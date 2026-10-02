import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BACKOFF_BASE_MS, LOCK_TTL_MS, MAX_ATTEMPTS, STATUS, WORKER_OUTCOME } from '../../src/config/constants.js';
import { buildEntryPayload, drainWorker, startTestEnvironment, TENANT_ID } from '../helpers/testEnvironment.js';

const WORKER_COUNT = 4;
const RECORD_COUNT = 30;

describe('AIWorkerService', () => {
  let env;

  beforeAll(async () => {
    env = await startTestEnvironment();
  });
  afterAll(() => env.stop());
  beforeEach(() => env.reset());

  it('processes every record exactly once under contention', async () => {
    const entries = await Promise.all(
      Array.from({ length: RECORD_COUNT }, () => env.repository.create({ ...buildEntryPayload(), tenantId: TENANT_ID })),
    );
    const workers = Array.from({ length: WORKER_COUNT }, () => env.createWorker());
    const slots = workers.flatMap((worker) => Array.from({ length: worker.concurrency }, () => drainWorker(worker)));
    await Promise.all(slots);

    expect(env.ai.calledEntryIds).toHaveLength(RECORD_COUNT);
    expect(new Set(env.ai.calledEntryIds).size).toBe(RECORD_COUNT);
    for (const entry of entries) {
      expect((await env.getEntry(entry._id)).aiMetadata.status).toBe(STATUS.COMPLETED);
    }
  });

  it('recovers a record whose lock expired', async () => {
    const entry = await env.createEntry();
    await env.forceState(entry._id, {
      'aiMetadata.status': STATUS.PROCESSING,
      'aiMetadata.lockedBy': 'dead-worker',
      'aiMetadata.lockedAt': new Date(Date.now() - LOCK_TTL_MS - 1000),
    });

    expect(await env.createWorker().runOnce()).toBe(WORKER_OUTCOME.COMPLETED);
    expect((await env.getEntry(entry._id)).aiMetadata.status).toBe(STATUS.COMPLETED);
  });

  it('does not steal a live lock', async () => {
    const entry = await env.createEntry();
    await env.forceState(entry._id, {
      'aiMetadata.status': STATUS.PROCESSING,
      'aiMetadata.lockedBy': 'busy-worker',
      'aiMetadata.lockedAt': new Date(),
    });

    expect(await env.createWorker().runOnce()).toBe(WORKER_OUTCOME.IDLE);
  });

  it('discards the result when a core field changes during processing', async () => {
    const entry = await env.createEntry();
    const worker = env.createWorker();
    env.ai.pause();
    const running = worker.runOnce();
    await env.ai.waitUntilEntered();

    await env.api.put(`/api/audit-entries/${entry._id}`).send({ monetaryImpact: 120000 }).expect(200);
    env.ai.release();

    expect(await running).toBe(WORKER_OUTCOME.DISCARDED);
    const requeued = await env.getEntry(entry._id);
    expect(requeued.aiMetadata.status).toBe(STATUS.PENDING);
    expect(requeued.aiMetadata.riskScore).toBeNull();
    expect(requeued.inputVersion).toBe(2);

    expect(await worker.runOnce()).toBe(WORKER_OUTCOME.COMPLETED);
    expect((await env.getEntry(entry._id)).aiMetadata.processedVersion).toBe(2);
  });

  it('keeps auditor notes saved while the AI is running', async () => {
    const entry = await env.createEntry();
    const worker = env.createWorker();
    env.ai.pause();
    const running = worker.runOnce();
    await env.ai.waitUntilEntered();

    await env.api.put(`/api/audit-entries/${entry._id}`).send({ auditorNotes: 'checked with vendor' }).expect(200);
    env.ai.release();

    expect(await running).toBe(WORKER_OUTCOME.COMPLETED);
    const completed = await env.getEntry(entry._id);
    expect(completed.aiMetadata.status).toBe(STATUS.COMPLETED);
    expect(completed.aiMetadata.auditorNotes).toBe('checked with vendor');
  });

  it('retries with backoff and ends as FAILED after MAX_ATTEMPTS', async () => {
    const entry = await env.createEntry();
    let clockOffsetMs = 0;
    const worker = env.createWorker({ clock: () => new Date(Date.now() + clockOffsetMs) });
    env.ai.failure = new Error('model unavailable');

    expect(await worker.runOnce()).toBe(WORKER_OUTCOME.RETRY);
    expect(await worker.runOnce()).toBe(WORKER_OUTCOME.IDLE);

    const outcomes = [];
    for (let attempt = 2; attempt <= MAX_ATTEMPTS; attempt += 1) {
      clockOffsetMs += BACKOFF_BASE_MS * 2 ** attempt;
      outcomes.push(await worker.runOnce());
    }

    expect(outcomes).toEqual([WORKER_OUTCOME.RETRY, WORKER_OUTCOME.FAILED]);
    const failed = await env.getEntry(entry._id);
    expect(failed.aiMetadata).toMatchObject({
      status: STATUS.FAILED,
      attempts: MAX_ATTEMPTS,
      lastError: 'model unavailable',
    });
  });

  it('waits for the in-flight job on stop and claims nothing afterwards', async () => {
    const first = await env.createEntry();
    const worker = env.createWorker({ concurrency: 1 });
    env.ai.pause();
    worker.start();
    await env.ai.waitUntilEntered();
    const second = await env.createEntry();

    const stopping = worker.stop();
    env.ai.release();
    await stopping;

    expect((await env.getEntry(first._id)).aiMetadata.status).toBe(STATUS.COMPLETED);
    expect((await env.getEntry(second._id)).aiMetadata.status).toBe(STATUS.PENDING);
    expect(env.ai.calledEntryIds).toHaveLength(1);
  });
});
