import cors from 'cors';
import express from 'express';
import { UPDATE_PATH_HEADER } from './config/constants.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { tenantContext } from './middleware/tenantContext.js';
import { createAuditRoutes } from './routes/auditRoutes.js';

/** Builds the Express app without listening, so tests can drive it with supertest. */
export function createApp({ controller, defaultTenantId, logger }) {
  const app = express();
  app.use(cors({ exposedHeaders: [UPDATE_PATH_HEADER] }));
  app.use(express.json());
  app.use('/api/audit-entries', tenantContext(defaultTenantId), createAuditRoutes(controller));
  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
