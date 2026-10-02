import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { STATUS } from '../../src/config/constants.js';
import { buildEntryPayload, drainWorker, startTestEnvironment } from '../helpers/testEnvironment.js';

const UNKNOWN_ID = '650000000000000000000099';

describe('audit entry API', () => {
  let env;

  beforeAll(async () => {
    env = await startTestEnvironment();
  });
  afterAll(() => env.stop());
  beforeEach(() => env.reset());

  it('accepts a new entry as PENDING', async () => {
    const response = await env.api.post('/api/audit-entries').send(buildEntryPayload()).expect(202);
    expect(response.body.aiMetadata.status).toBe(STATUS.PENDING);
    expect(response.body.inputVersion).toBe(1);
  });

  it('rejects an invalid payload with field errors', async () => {
    const response = await env.api.post('/api/audit-entries').send({ entityName: '', monetaryImpact: 'lots' }).expect(400);
    const failingFields = response.body.error.details.map((detail) => detail.path);
    expect(failingFields).toEqual(expect.arrayContaining(['entityName', 'monetaryImpact', 'description']));
  });

  it('rejects a duplicate evidenceId', async () => {
    const payload = buildEntryPayload();
    await env.api.post('/api/audit-entries').send(payload).expect(202);
    await env.api.post('/api/audit-entries').send(payload).expect(409);
  });

  it('lists entries without their vectors', async () => {
    await env.createEntry();
    await drainWorker(env.createWorker());
    const { body } = await env.api.get('/api/audit-entries').expect(200);
    expect(body[0].aiMetadata.semanticVector).toBeUndefined();
  });

  describe('POST /:id/similar', () => {
    it('returns the top 3 completed entries, most similar first, excluding itself', async () => {
      const source = await env.createEntry({ description: 'Manual approval override for vendor invoice' });
      await env.createEntry({ description: 'Manual approval override for vendor invoice payables' });
      await env.createEntry({ description: 'Routine monthly subscription for office software', monetaryImpact: 1200 });
      await env.createEntry({ description: 'Urgent cash disbursement exception', monetaryImpact: 27000 });
      await env.createEntry({ description: 'Consulting retainer without purchase order' });
      await drainWorker(env.createWorker());
      const pending = await env.createEntry({ description: 'Manual approval override for vendor invoice again' });

      const { body } = await env.api.post(`/api/audit-entries/${source._id}/similar`).expect(200);

      expect(body).toHaveLength(3);
      const similarities = body.map((match) => match.similarity);
      expect(similarities).toEqual([...similarities].sort((first, second) => second - first));
      const matchedIds = body.map((match) => match.entry._id);
      expect(matchedIds).not.toContain(source._id);
      expect(matchedIds).not.toContain(pending._id);
      expect(body[0].entry.description).toContain('vendor invoice payables');
    });

    it('returns 409 while the source is still PENDING', async () => {
      const entry = await env.createEntry();
      await env.api.post(`/api/audit-entries/${entry._id}/similar`).expect(409);
    });

    it('returns 404 for an unknown id', async () => {
      await env.api.post(`/api/audit-entries/${UNKNOWN_ID}/similar`).expect(404);
    });
  });
});
