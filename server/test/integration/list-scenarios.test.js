import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildEntryPayload, drainWorker, startTestEnvironment } from '../helpers/testEnvironment.js';

const OTHER_TENANT = '650000000000000000000002';
const PAGE_SIZE = 5;

/** What a user sees as they add entries, filter, sort and page: every transition of the list. */
describe('list paging scenarios', () => {
  let env;

  beforeAll(async () => {
    env = await startTestEnvironment();
  });
  afterAll(() => env.stop());
  beforeEach(() => env.reset());

  const list = (query = '') => env.api.get(`/api/audit-entries?limit=${PAGE_SIZE}${query}`);
  const names = (response) => response.body.items.map((entry) => entry.entityName);
  const createMany = async (count, overrides = () => ({})) => {
    for (let index = 1; index <= count; index += 1) await env.createEntry({ entityName: `Entity ${index}`, ...overrides(index) });
  };

  describe('a new entry arrives', () => {
    it('appears first on page 1 and pushes the last row of page 1 onto page 2', async () => {
      await createMany(PAGE_SIZE);
      expect(names(await list())).toEqual(['Entity 5', 'Entity 4', 'Entity 3', 'Entity 2', 'Entity 1']);
      expect((await list()).body).toMatchObject({ total: 5, totalPages: 1 });

      await env.createEntry({ entityName: 'Entity 6' });

      const first = await list();
      const second = await list('&page=2');
      expect(names(first)).toEqual(['Entity 6', 'Entity 5', 'Entity 4', 'Entity 3', 'Entity 2']);
      expect(names(second)).toEqual(['Entity 1']);
      expect(first.body).toMatchObject({ total: 6, totalPages: 2 });
    });

    it('shifts the rows of page 2 by one without losing or repeating any entry', async () => {
      await createMany(8);
      const beforePage2 = names(await list('&page=2'));
      await env.createEntry({ entityName: 'Entity 9' });
      const afterPage2 = names(await list('&page=2'));
      expect(beforePage2).toEqual(['Entity 3', 'Entity 2', 'Entity 1']);
      expect(afterPage2).toEqual(['Entity 4', 'Entity 3', 'Entity 2', 'Entity 1']);
    });

    it('grows the page count exactly when the new entry overflows the last page', async () => {
      await createMany(PAGE_SIZE);
      expect((await list()).body.totalPages).toBe(1);
      await env.createEntry();
      expect((await list()).body.totalPages).toBe(2);
    });

    it('is counted in the summary immediately as pending', async () => {
      await createMany(3);
      expect((await env.api.get('/api/audit-entries/summary')).body).toMatchObject({ total: 3, pending: 3 });
    });
  });

  describe('filters are added', () => {
    beforeEach(async () => {
      await createMany(12, (index) => ({ monetaryImpact: index % 2 === 0 ? 90000 : 1200 }));
      await drainWorker(env.createWorker());
    });

    it('computes totals and page count over the filtered set, not the whole table', async () => {
      const all = (await list()).body;
      const high = (await list('&risk=HIGH')).body;
      expect(all.total).toBe(12);
      expect(high.total).toBeLessThan(all.total);
      expect(high.totalPages).toBe(Math.ceil(high.total / PAGE_SIZE));
      expect(high.items.every((entry) => entry.aiMetadata.riskLevel === 'HIGH')).toBe(true);
    });

    it('pages through a filtered set with no duplicates and no gaps', async () => {
      const { totalPages, total } = (await list('&risk=HIGH')).body;
      const seen = [];
      for (let page = 1; page <= totalPages; page += 1) seen.push(...(await list(`&risk=HIGH&page=${page}`)).body.items.map((entry) => entry._id));
      expect(seen).toHaveLength(total);
      expect(new Set(seen).size).toBe(total);
    });

    it('returns an empty page, with a correct total, when the requested page no longer exists', async () => {
      const response = await list('&risk=HIGH&page=5');
      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.page).toBe(5);
    });

    it('combines status, risk, search, sort and paging in one request', async () => {
      const response = await list('&status=COMPLETED&risk=HIGH&search=entity&sort=monetaryImpact&direction=asc&page=1');
      expect(response.status).toBe(200);
      const amounts = response.body.items.map((entry) => entry.monetaryImpact);
      expect(amounts).toEqual([...amounts].sort((first, second) => first - second));
    });

    it('returns total 0 and one page for a filter that matches nothing', async () => {
      const response = await list('&search=no-such-entity');
      expect(response.body).toMatchObject({ items: [], total: 0, totalPages: 1 });
    });

    it('keeps the summary global while a filter narrows the list', async () => {
      const summary = (await env.api.get('/api/audit-entries/summary')).body;
      expect(summary.total).toBe(12);
      expect((await list('&risk=LOW')).body.total).toBeLessThan(summary.total);
    });
  });

  describe('sorting', () => {
    it('keeps page order stable when many entries share the same sort value', async () => {
      await createMany(12, () => ({ monetaryImpact: 5000 }));
      const seen = [];
      for (let page = 1; page <= 3; page += 1) seen.push(...(await list(`&sort=monetaryImpact&page=${page}`)).body.items.map((entry) => entry._id));
      expect(seen).toHaveLength(12);
      expect(new Set(seen).size).toBe(12);
    });

    it('lists scored entries first and unscored (pending) last when sorting by risk score descending', async () => {
      await createMany(2, (index) => ({ monetaryImpact: index * 40000 }));
      await drainWorker(env.createWorker());
      await env.createEntry({ entityName: 'Still pending' });
      const items = (await list('&sort=riskScore&direction=desc')).body.items;
      expect(items.at(-1).entityName).toBe('Still pending');
      expect(items[0].aiMetadata.riskScore).toBeGreaterThanOrEqual(items[1].aiMetadata.riskScore);
    });

    it('is applied across pages, not within each page', async () => {
      await createMany(8, (index) => ({ monetaryImpact: index * 1000 }));
      const first = (await list('&sort=monetaryImpact&direction=desc')).body.items.map((entry) => entry.monetaryImpact);
      const second = (await list('&sort=monetaryImpact&direction=desc&page=2')).body.items.map((entry) => entry.monetaryImpact);
      expect([...first, ...second]).toEqual([8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000]);
    });
  });

  describe('entries change while someone is paging', () => {
    it('moves an entry out of the Pending filter when the worker completes it, updating total and pages', async () => {
      await createMany(7);
      expect((await list('&status=PENDING')).body).toMatchObject({ total: 7, totalPages: 2 });
      await env.createWorker().runOnce();
      expect((await list('&status=PENDING')).body).toMatchObject({ total: 6, totalPages: 2 });
      await drainWorker(env.createWorker());
      expect((await list('&status=PENDING')).body).toMatchObject({ total: 0, totalPages: 1 });
      expect((await list('&status=COMPLETED')).body.total).toBe(7);
    });

    it('moves an entry back into the Pending filter when a core field is edited', async () => {
      await createMany(3);
      await drainWorker(env.createWorker());
      expect((await list('&status=PENDING')).body.total).toBe(0);
      const target = (await list()).body.items[0];
      await env.api.put(`/api/audit-entries/${target._id}`).send({ monetaryImpact: 123456 }).expect(200);
      expect((await list('&status=PENDING')).body.total).toBe(1);
    });

    it('keeps an entry on the same page after a notes edit (fast track does not reorder)', async () => {
      await createMany(8);
      const before = names(await list('&page=2'));
      const target = (await list('&page=2')).body.items[0];
      await env.api.put(`/api/audit-entries/${target._id}`).send({ auditorNotes: 'seen' }).expect(200);
      expect(names(await list('&page=2'))).toEqual(before);
    });
  });

  describe('tenants and limits', () => {
    it('lists and counts only the requesting tenant, per page and in the summary', async () => {
      await createMany(3);
      await env.api.post('/api/audit-entries').set('X-Tenant-Id', OTHER_TENANT).send(buildEntryPayload()).expect(202);

      const mine = await list();
      const theirs = await env.api.get('/api/audit-entries').set('X-Tenant-Id', OTHER_TENANT);
      expect(mine.body.total).toBe(3);
      expect(theirs.body.total).toBe(1);
      expect((await env.api.get('/api/audit-entries/summary').set('X-Tenant-Id', OTHER_TENANT)).body.total).toBe(1);
    });

    it('accepts the maximum page size and rejects one above it, or fractional values', async () => {
      await env.api.get('/api/audit-entries?limit=50').expect(200);
      for (const query of ['?limit=51', '?limit=0', '?page=1.5', '?page=-1', '?page=abc']) {
        await env.api.get(`/api/audit-entries${query}`).expect(400);
      }
    });

    it('returns an empty first page and a zeroed summary for a tenant with no entries', async () => {
      const response = await env.api.get('/api/audit-entries').set('X-Tenant-Id', OTHER_TENANT).expect(200);
      expect(response.body).toMatchObject({ items: [], total: 0, page: 1, totalPages: 1 });
      const summary = (await env.api.get('/api/audit-entries/summary').set('X-Tenant-Id', OTHER_TENANT)).body;
      expect(summary).toEqual({ total: 0, pending: 0, highRisk: 0, averageRiskScore: null });
    });
  });
});
