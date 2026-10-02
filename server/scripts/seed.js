import { loadEnv } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { buildContainer } from '../src/container.js';
import { connectDatabase, disconnectDatabase } from '../src/db/connect.js';

const SAMPLE_ENTRIES = [
  {
    evidenceId: 'EVID-902188',
    entityName: 'Global Procurement Services',
    description: 'Manual approval override executed for vendor invoice payables exceeding $50k threshold',
    monetaryImpact: 84750,
    controlId: 'CTRL-FIN-302',
    actorUserId: 'user_7731',
    timestamp: '2026-07-21T10:00:00.000Z',
  },
  {
    evidenceId: 'EVID-902205',
    entityName: 'Northwind Logistics',
    description: 'Manual approval override executed for vendor invoice payables exceeding $50k limit',
    monetaryImpact: 91200,
    controlId: 'CTRL-FIN-302',
    actorUserId: 'user_4410',
    timestamp: '2026-07-22T14:30:00.000Z',
  },
  {
    evidenceId: 'EVID-902310',
    entityName: 'Facilities Management',
    description: 'Routine monthly subscription payment for office software licences',
    monetaryImpact: 1230,
    controlId: 'CTRL-OPS-110',
    actorUserId: 'user_1029',
    timestamp: '2026-07-23T11:15:00.000Z',
  },
  {
    evidenceId: 'EVID-902377',
    entityName: 'Treasury Operations',
    description: 'Urgent cash disbursement approved as an exception outside the normal process',
    monetaryImpact: 27350,
    controlId: 'CTRL-FIN-118',
    actorUserId: 'user_5582',
    timestamp: '2026-07-24T02:45:00.000Z',
  },
  {
    evidenceId: 'EVID-902412',
    entityName: 'Marketing Services',
    description: 'Consulting retainer paid without a purchase order',
    monetaryImpact: 100000,
    controlId: 'CTRL-PRC-204',
    actorUserId: 'user_3308',
    timestamp: '2026-07-25T09:20:00.000Z',
  },
];

const config = loadEnv();
const logger = createLogger(config.LOG_LEVEL);
const { repository, auditService } = buildContainer({ config, logger });

const shouldReset = process.argv.includes('--reset');
if (shouldReset && config.NODE_ENV === 'production') {
  throw new Error('Refusing to reset data when NODE_ENV=production');
}

await connectDatabase(config.MONGO_URI);
if (shouldReset) await repository.deleteAll();
for (const entry of SAMPLE_ENTRIES) {
  await auditService.create(config.DEFAULT_TENANT_ID, { eventType: 'Control Execution', ...entry });
}
logger.info({ count: SAMPLE_ENTRIES.length }, 'seed.completed');
await disconnectDatabase();
