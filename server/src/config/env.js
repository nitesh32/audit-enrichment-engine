import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const ENV_FILE = fileURLToPath(new URL('../../../.env', import.meta.url));

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/smartaudit'),
  PORT: z.coerce.number().int().positive().default(4000),
  MOCK_AI: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(3),
  AI_MAX_CONCURRENCY: z.coerce.number().int().positive().default(2),
  LOG_LEVEL: z.string().default('info'),
  DEFAULT_TENANT_ID: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .default('650000000000000000000001'),
});

/**
 * Reads and validates environment variables. Fails fast on invalid config.
 * @returns {Readonly<z.infer<typeof envSchema>>}
 */
export function loadEnv() {
  dotenv.config({ path: ENV_FILE, quiet: true });
  return Object.freeze(envSchema.parse(process.env));
}
