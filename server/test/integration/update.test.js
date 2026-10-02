import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { STATUS, UPDATE_PATH, UPDATE_PATH_HEADER } from '../../src/config/constants.js';
import { drainWorker, startTestEnvironment } from '../helpers/testEnvironment.js';

describe('PUT /api/audit-entries/:id', () => {
  let env;

  beforeAll(async () => {
    env = await startTestEnvironment();
  });
  afterAll(() => env.stop());
  beforeEach(() => env.reset());

  async function createCompletedEntry() {
    const entry = await env.createEntry();
    await drainWorker(env.createWorker());
    env.ai.calledEntryIds.length = 0;
    return env.getEntry(entry._id);
  }

  it('fast-tracks a notes-only edit without touching the AI', async () => {
    const before = await createCompletedEntry();
    const response = await env.api.put(`/api/audit-entries/${before._id}`).send({ auditorNotes: 'looks fine' }).expect(200);

    expect(response.body.path).toBe(UPDATE_PATH.FAST_TRACK);
    expect(response.headers[UPDATE_PATH_HEADER.toLowerCase()]).toBe(UPDATE_PATH.FAST_TRACK);
    expect(env.ai.calledEntryIds).toHaveLength(0);

    const after = await env.getEntry(before._id);
    expect(after.inputVersion).toBe(before.inputVersion);
    expect(after.aiMetadata.status).toBe(STATUS.COMPLETED);
    expect(after.aiMetadata).toEqual({ ...before.aiMetadata, auditorNotes: 'looks fine' });
  });

  it('requeues a core edit and keeps the notes sent with it', async () => {
    const before = await createCompletedEntry();
    const response = await env.api
      .put(`/api/audit-entries/${before._id}`)
      .send({ description: 'Urgent cash payment', auditorNotes: 'escalated' })
      .expect(200);

    expect(response.body.path).toBe(UPDATE_PATH.AI_REQUEUE);
    expect(response.body.changedFields).toEqual(['description', 'auditorNotes']);
    const after = await env.getEntry(before._id);
    expect(after.aiMetadata).toMatchObject({ status: STATUS.PENDING, auditorNotes: 'escalated' });
    expect(after.inputVersion).toBe(before.inputVersion + 1);
  });

  it('performs no write when values are unchanged', async () => {
    const before = await createCompletedEntry();
    const sameValue = await env.api.put(`/api/audit-entries/${before._id}`).send({ monetaryImpact: 85000 }).expect(200);
    expect(sameValue.body.path).toBe(UPDATE_PATH.NO_CHANGE);
    expect((await env.getEntry(before._id)).updated).toBe(before.updated);
  });

  it('rejects unknown and immutable fields', async () => {
    const entry = await env.createEntry();
    for (const body of [{ tenantId: '650000000000000000000002' }, { inputVersion: 9 }, { 'aiMetadata.status': 'COMPLETED' }]) {
      await env.api.put(`/api/audit-entries/${entry._id}`).send(body).expect(400);
    }
  });

  it('never loses a write when two core edits race', async () => {
    const before = await createCompletedEntry();
    const responses = await Promise.all(
      [90000, 95000].map((monetaryImpact) =>
        env.api.put(`/api/audit-entries/${before._id}`).send({ monetaryImpact }),
      ),
    );

    const statuses = responses.map((response) => response.status);
    expect(statuses.every((status) => status === 200 || status === 409)).toBe(true);
    const successes = statuses.filter((status) => status === 200).length;
    expect((await env.getEntry(before._id)).inputVersion).toBe(before.inputVersion + successes);
  });
});
