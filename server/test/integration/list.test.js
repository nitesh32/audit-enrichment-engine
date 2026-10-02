import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { STATUS } from '../../src/config/constants.js';
import { drainWorker, startTestEnvironment } from '../helpers/testEnvironment.js';

const ENTRY_COUNT = 12;

describe('GET /api/audit-entries (paging, filters, sorting)', () => {
  let env;

  beforeAll(async () => {
    env = await startTestEnvironment();
  });
  afterAll(() => env.stop());
  beforeEach(async () => {
    await env.reset();
    for (let index = 1; index <= ENTRY_COUNT; index += 1) {
      await env.createEntry({ entityName: `Entity ${index}`, monetaryImpact: index * 1000 + 1 });
    }
  });

  const list = (query = '') => env.api.get(`/api/audit-entries${query}`);

  it('returns the first page with totals by default', async () => {
    const { body } = await list().expect(200);
    expect(body).toMatchObject({ total: ENTRY_COUNT, page: 1, pageSize: 10, totalPages: 2 });
    expect(body.items).toHaveLength(10);
  });

  it('returns the remaining entries on the last page, newest first', async () => {
    const { body } = await list('?page=2').expect(200);
    expect(body.items.map((entry) => entry.entityName)).toEqual(['Entity 2', 'Entity 1']);
  });

  it('honours the page size and returns an empty page past the end', async () => {
    expect((await list('?limit=5&page=3')).body.items).toHaveLength(2);
    const pastEnd = (await list('?limit=5&page=9')).body;
    expect(pastEnd.items).toEqual([]);
    expect(pastEnd.total).toBe(ENTRY_COUNT);
  });

  it('sorts by amount in either direction', async () => {
    const descending = (await list('?sort=monetaryImpact&direction=desc&limit=3')).body.items;
    expect(descending.map((entry) => entry.monetaryImpact)).toEqual([12001, 11001, 10001]);
    const ascending = (await list('?sort=monetaryImpact&direction=asc&limit=2')).body.items;
    expect(ascending.map((entry) => entry.monetaryImpact)).toEqual([1001, 2001]);
  });

  it('searches across fields without treating input as a regex', async () => {
    const byEntity = (await list('?search=entity 12')).body;
    expect(byEntity.total).toBe(1);
    expect((await list('?search=.*')).body.total).toBe(0);
  });

  it('filters by status and risk, with totals reflecting the filter', async () => {
    expect((await list('?status=PENDING')).body.total).toBe(ENTRY_COUNT);
    expect((await list('?status=COMPLETED')).body.total).toBe(0);

    await drainWorker(env.createWorker());
    const completed = (await list('?status=COMPLETED&limit=50')).body;
    expect(completed.total).toBe(ENTRY_COUNT);
    const risks = new Set(completed.items.map((entry) => entry.aiMetadata.riskLevel));
    const someRisk = [...risks][0];
    const filtered = (await list(`?risk=${someRisk}&limit=50`)).body;
    expect(filtered.items.every((entry) => entry.aiMetadata.riskLevel === someRisk)).toBe(true);
  });

  it('rejects invalid or unknown query parameters', async () => {
    for (const query of ['?page=0', '?limit=1000', '?sort=entityName', '?status=DONE', '?unknown=1']) {
      const response = await list(query).expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('summarizes all entries regardless of paging', async () => {
    const empty = { total: ENTRY_COUNT, pending: ENTRY_COUNT, highRisk: 0, averageRiskScore: null };
    expect((await env.api.get('/api/audit-entries/summary').expect(200)).body).toEqual(empty);

    await drainWorker(env.createWorker());
    const { body } = await env.api.get('/api/audit-entries/summary').expect(200);
    expect(body).toMatchObject({ total: ENTRY_COUNT, pending: 0 });
    expect(body.averageRiskScore).toBeGreaterThan(0);
    const all = (await list('?limit=50')).body.items;
    expect(all.every((entry) => entry.aiMetadata.status === STATUS.COMPLETED)).toBe(true);
    expect(body.highRisk).toBe(all.filter((entry) => entry.aiMetadata.riskLevel === 'HIGH').length);
  });
});
