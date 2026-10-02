# SmartAudit: AI-enriched continuous audit pipeline

Audit evidence is saved immediately as `PENDING`. A background worker enriches it with a risk score, summary,
anomaly flags and an 8-dimension semantic vector. Edits are evaluated by value: only changes to core financial
fields re-run the AI, auditor-note edits are saved instantly.

Stack: Node 20+ / Express 5 / Mongoose, React 18 class components (Vite + Tailwind v4).

## Quickstart

```bash
docker compose up -d        # MongoDB 7
cp .env.example .env        # MOCK_AI=true needs no API key
npm i && npm run seed       # 5 sample entries (all PENDING); replaces existing entries
npm run dev                 # api + worker + client (http://localhost:5173)
```

### No Docker?
Docker is only a convenience. The app needs a MongoDB connection string in `MONGO_URI` (in `.env`); any MongoDB works
(tested with 7 and 8).

- **Local install:** install MongoDB Community, start `mongod`, and keep the default `MONGO_URI`.
- **MongoDB Atlas (free tier):** create a cluster and a database user, allow your IP address, then set
  `MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/smartaudit` (URL-encode special characters in the
  password).

Then run `npm i && npm run seed && npm run dev` as above. Notes:

- `npm run seed` deletes all audit entries in the database that `MONGO_URI` points to before inserting the samples, so
  point it at a scratch database.
- If MongoDB cannot be reached, the API and worker stop with a connection error after about 30 seconds.
- `npm test` uses an in-memory MongoDB that is downloaded on first run (needs internet). Offline, set
  `MONGOMS_SYSTEM_BINARY` to the path of a local `mongod`.

| Command | Purpose |
|---|---|
| `npm run worker` | start an extra worker process (demonstrates multi-worker safety) |
| `npm test` | unit + integration tests (in-memory MongoDB, no Docker needed) |
| `npm run lint` | ESLint |

### AI mode
| Mode | `.env` | Behaviour |
|---|---|---|
| Mock (default) | `MOCK_AI=true` | Local rule-based engine, no key needed. Results are deterministic; the simulated response time is about 2s and varies +/-30% per call (`MOCK_DELAY_MS` in `constants.js`), so rows visibly go Pending, Processing, then done. |
| Real AI | `MOCK_AI=false`, `OPENROUTER_API_KEY=<your key>` | Risk score, summary and flags come from an LLM through [OpenRouter](https://openrouter.ai). Pick the model with `OPENROUTER_MODEL` (default `openai/gpt-4o-mini`). |

If `MOCK_AI=false` but the key is empty, the app logs a warning and uses the mock. If the LLM call fails or returns
invalid output, that entry is processed by the mock and tagged `mock-fallback`. Restart the API and worker after
changing `.env`; each logs which provider it is using (`ai.provider`).

## Try it
1. Open http://localhost:5173. The seeded rows start as `PENDING` and fill in with a score, summary and flags.
2. Click a row to open the detail sheet. Save **Auditor notes**: instant, the AI is skipped. Change **Core evidence**
   (amount, description or control) and save: the row returns to `PENDING` and is re-scored.
3. In the sheet, **Find similar** shows the 3 closest entries by vector. The vector itself is listed under the AI
   assessment.
4. **New evidence** ingests an entry; **Use example** fills in a sample.

## API

| Endpoint | Behaviour |
|---|---|
| `POST /api/audit-entries` | 202, saved as `PENDING` |
| `GET /api/audit-entries` | one page: `?page=1&limit=10&search=&status=&risk=&sort=created&direction=desc`; returns `{ items, total, page, pageSize, totalPages }`, vectors omitted |
| `GET /api/audit-entries/summary` | totals across all entries: `{ total, pending, highRisk, averageRiskScore }` |
| `GET /api/audit-entries/:id` | one entry, including its semantic vector |
| `PUT /api/audit-entries/:id` | smart delta update; returns `{ entry, path, changedFields, durationMs }` and header `X-Update-Path` |
| `POST /api/audit-entries/:id/similar` | top 3 most similar completed entries; 409 while the source is not `COMPLETED` |

Requests are scoped to one tenant: `DEFAULT_TENANT_ID`, or the `X-Tenant-Id` header.

## Design decisions

### AI workload integration
`AIService` is a facade over providers: a semaphore caps concurrent calls (`AI_MAX_CONCURRENCY`), transient
429/5xx errors are retried with jittered exponential backoff, and the OpenRouter call has a 15s timeout and a
zod-validated JSON reply (code fences and surrounding prose are tolerated, and flag names are normalised). If the live provider still fails or returns
invalid output, the result is produced by the local engine and tagged `provider: 'mock-fallback'`. The local engine is
deterministic, which keeps tests stable. A concurrency cap is the rate-limiting strategy; a requests-per-minute limiter
would be the next step. The semantic vector is always built locally (the brief calls it a mock embedding), so the LLM
only decides risk, and similarity behaves the same in every mode.

### Asynchronous architecture: MongoDB as the queue
The status field on each document is the job state, so no extra infrastructure is needed.

```
PENDING --claim--> PROCESSING --success--> COMPLETED
   ^                   |
   +--- retry (backoff)+--- attempts exhausted --> FAILED
   ^
   +--- core edit (any state)
```

- **Atomic claim:** one `findOneAndUpdate` takes a due `PENDING` entry (or a `PROCESSING` one with an expired lock) and
  sets the lock. Two workers can never own the same entry.
- **Version-guarded commit:** `inputVersion` is incremented on every core edit. A worker commits only if the version and
  lock owner still match; otherwise the stale result is discarded and the entry is re-processed with the new data.
- **Crash recovery:** a lock older than `LOCK_TTL_MS` is treated as abandoned. Failures retry with exponential backoff
  up to `MAX_ATTEMPTS`, then `FAILED`.
- **Scaling:** the worker is its own process with `WORKER_CONCURRENCY` async slots, and `npm run worker` adds more.
  Move to BullMQ/SQS for high throughput, priorities or fan-out; change streams could replace polling.

### Vector similarity
Vectors are built with a hashing trick (tokens hashed into 8 signed buckets, L2-normalised), so descriptions that share
words get similar vectors. Search is brute-force cosine similarity over the tenant's completed entries: O(n·d) with
d=8, fine for tens of thousands of records per tenant. At larger scale it moves to Atlas `$vectorSearch` (HNSW) with a
tenant pre-filter; only `SimilarityService` changes.

### Delta evaluation and fast track
`evaluateDelta` compares normalised values (numbers via `Number`, strings trimmed) of `monetaryImpact`, `description`
and `controlId`, not the keys present in the request body. Core change: `AI_REQUEUE`. Notes only: `FAST_TRACK`, a
single `$set` on `aiMetadata.auditorNotes` that touches neither status, version nor lock. Nothing changed:
`NO_CHANGE`, no write. The worker never writes `auditorNotes`, so a note saved while the AI runs survives. A schema
allowlist rejects any other field with a 400.

### Pagination
Paging, filtering, search and sorting run on the server (offset pagination, 10 per page, max 50), so they apply to the
whole data set rather than the page on screen. Changing a filter, search or sort resets to page 1; creating an entry
jumps to page 1 where the newest entry appears first. The header numbers come from a separate summary endpoint so they
stay global while the list is filtered. Offset paging is simple and fits page-number navigation; at large scale a
cursor would avoid rows shifting between pages when entries arrive.

## Trade-offs
- The UI fetches only while something is pending, after your own actions and while retrying a failed request, so entries ingested elsewhere appear on your next action; SSE or change streams would push them.
- Tenancy is a single demo tenant with an optional header, not authentication.
- Similarity on 8 dimensions is coarse by design (mock embeddings).
