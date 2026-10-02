import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { WORKER_OUTCOME } from '../../src/config/constants.js';
import { buildContainer } from '../../src/container.js';
import { connectDatabase, disconnectDatabase } from '../../src/db/connect.js';
import { AuditEntry } from '../../src/models/AuditEntry.js';
import { ControllableAIService } from './ControllableAIService.js';

export const TENANT_ID = '650000000000000000000001';
const silentLogger = { warn() {}, info() {}, error() {} };
const TEST_WORKER_CONCURRENCY = 3;
const TEST_POLL_INTERVAL_MS = 10;

let evidenceCounter = 0;

export function buildEntryPayload(overrides = {}) {
  evidenceCounter += 1;
  return {
    eventType: 'Control Execution',
    evidenceId: `EVID-TEST-${evidenceCounter}`,
    entityName: 'Global Procurement Services',
    description: 'Manual approval override executed for vendor invoice payables',
    monetaryImpact: 85000,
    controlId: 'CTRL-FIN-302',
    actorUserId: 'user_7731',
    ...overrides,
  };
}

/** Boots an in-memory MongoDB and a fully wired app around a controllable AI stub. */
export async function startTestEnvironment() {
  const mongod = await MongoMemoryServer.create();
  await connectDatabase(mongod.getUri());
  await AuditEntry.init();

  const ai = new ControllableAIService();
  const container = buildContainer({
    config: { WORKER_CONCURRENCY: TEST_WORKER_CONCURRENCY },
    logger: silentLogger,
    aiService: ai,
  });
  const app = createApp({ controller: container.controller, defaultTenantId: TENANT_ID, logger: silentLogger });
  const api = request(app);

  return {
    ai,
    api,
    repository: container.repository,
    createWorker: (overrides) => container.createWorker({ pollIntervalMs: TEST_POLL_INTERVAL_MS, ...overrides }),

    async createEntry(overrides) {
      const { body } = await api.post('/api/audit-entries').send(buildEntryPayload(overrides)).expect(202);
      return body;
    },
    async getEntry(id) {
      const { body } = await api.get(`/api/audit-entries/${id}`).expect(200);
      return body;
    },
    /** Writes fields straight into MongoDB to arrange a scenario. */
    forceState(id, fields) {
      return AuditEntry.updateOne({ _id: id }, { $set: fields });
    },
    async reset() {
      await AuditEntry.deleteMany({});
      ai.calledEntryIds.length = 0;
      ai.failure = null;
    },
    async stop() {
      await disconnectDatabase();
      await mongoose.disconnect();
      await mongod.stop();
    },
  };
}

/** Calls runOnce until the worker reports idle; returns the outcomes seen. */
export async function drainWorker(worker) {
  const outcomes = [];
  for (let outcome = await worker.runOnce(); outcome !== WORKER_OUTCOME.IDLE; outcome = await worker.runOnce()) {
    outcomes.push(outcome);
  }
  return outcomes;
}
