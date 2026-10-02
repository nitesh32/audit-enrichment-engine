import { sleep } from './sleep.js';

const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;
const JITTER_FLOOR = 0.5;

function isTransientHttpError(error) {
  return error?.status === HTTP_TOO_MANY_REQUESTS || error?.status >= HTTP_SERVER_ERROR;
}

/**
 * Runs `task`, retrying transient failures with exponential backoff and jitter.
 * @template T
 * @param {() => Promise<T>} task
 * @param {{ maxRetries: number, baseDelayMs: number }} options
 * @returns {Promise<T>}
 * @throws the last error once retries are exhausted or the error is not transient
 */
export async function withRetry(task, { maxRetries, baseDelayMs }) {
  for (let retry = 0; ; retry += 1) {
    try {
      return await task();
    } catch (error) {
      if (retry >= maxRetries || !isTransientHttpError(error)) throw error;
      const jitter = JITTER_FLOOR + Math.random() * (1 - JITTER_FLOOR);
      await sleep(baseDelayMs * 2 ** retry * jitter);
    }
  }
}
