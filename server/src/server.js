import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './config/logger.js';
import { buildContainer } from './container.js';
import { connectDatabase, disconnectDatabase } from './db/connect.js';

const config = loadEnv();
const logger = createLogger(config.LOG_LEVEL);
await connectDatabase(config.MONGO_URI);

const { controller } = buildContainer({ config, logger });
const app = createApp({ controller, defaultTenantId: config.DEFAULT_TENANT_ID, logger });
const server = app.listen(config.PORT, () => logger.info({ port: config.PORT }, 'api.listening'));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  }));
}
