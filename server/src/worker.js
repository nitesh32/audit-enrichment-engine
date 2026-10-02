import { loadEnv } from './config/env.js';
import { createLogger } from './config/logger.js';
import { buildContainer } from './container.js';
import { connectDatabase, disconnectDatabase } from './db/connect.js';

const config = loadEnv();
const logger = createLogger(config.LOG_LEVEL);
await connectDatabase(config.MONGO_URI);

const worker = buildContainer({ config, logger }).createWorker();
worker.start();

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await worker.stop();
    await disconnectDatabase();
    process.exit(0);
  });
}
