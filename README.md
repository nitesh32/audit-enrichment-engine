# SmartAudit: AI-enriched continuous audit pipeline

Audit evidence is saved immediately as `PENDING`. A background worker enriches it with a risk score, summary,
anomaly flags and an 8-dimension semantic vector. Edits are evaluated by value: only changes to core financial
fields re-run the AI, auditor-note edits are saved instantly.

Stack: Node 20+ / Express 5 / Mongoose, React 18 class components (Vite + Tailwind v4).

## Quickstart

```bash
docker compose up -d        # MongoDB 7
cp .env.example .env        # MOCK_AI=true needs no API key
npm i && npm run seed       # 5 sample entries (all PENDING)
npm run dev                 # api + worker + client (http://localhost:5173)
```

| Command | Purpose |
|---|---|
| `npm run worker` | start an extra worker process (demonstrates multi-worker safety) |
| `npm test` | unit + integration tests (in-memory MongoDB, no Docker needed) |
| `npm run lint` | ESLint |

Set `OPENAI_API_KEY` and `MOCK_AI=false` to use a live model; otherwise the deterministic local engine runs
(400ms simulated delay).

## API

| Endpoint | Behaviour |
|---|---|
| `POST /api/audit-entries` | 202, saved as `PENDING` |
| `GET /api/audit-entries` | one page: `?page=1&limit=10&search=&status=&risk=&sort=created&direction=desc`; returns `{ items, total, page, pageSize, totalPages }`, vectors omitted |
| `GET /api/audit-entries/summary` | totals across all entries: `{ total, pending, highRisk, averageRiskScore }` |
| `GET /api/audit-entries/:id` | one entry |
| `PUT /api/audit-entries/:id` | smart delta update; returns `{ entry, path, changedFields, durationMs }` and header `X-Update-Path` |
| `POST /api/audit-entries/:id/similar` | top 3 most similar completed entries; 409 while the source is not `COMPLETED` |

Requests are scoped to one tenant: `DEFAULT_TENANT_ID`, or the `X-Tenant-Id` header.

## Design decisions

### AI workload integration
`AIService` is a facade over providers: a semaphore caps concurrent calls (`AI_MAX_CONCURRENCY`), transient
429/5xx errors are retried with jittered exponential backoff, and the OpenAI call has a 15s timeout and a zod-validated
JSON reply. If the live provider still fails or returns invalid output, the result is produced by the local engine
and tagged `provider: 'mock-fallback'`. The local engine is deterministic, which keeps tests stable. A concurrency cap
is the rate-limiting strategy; a requests-per-minute limiter would be the next step.

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
tenant pre-filter; only `SimilarityService` changes. Candidates are limited to entries embedded by the same provider
family, because OpenAI and mock vectors are not comparable.

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
- The UI polls every 1.5s (paused while the tab is hidden); SSE or change streams would push updates.
- Tenancy is a single demo tenant with an optional header, not authentication.
- Similarity on 8 dimensions is coarse by design (mock embeddings).
