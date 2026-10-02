import { AIService } from '../../src/services/ai/AIService.js';
import { MockAIProvider } from '../../src/services/ai/MockAIProvider.js';

const silentLogger = { warn() {}, info() {}, error() {} };

function createDeferred() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

/**
 * Test double for AIService. Records every call, can be paused mid-job, and
 * can be told to fail; otherwise it delegates to the instant mock provider.
 */
export class ControllableAIService {
  calledEntryIds = [];
  failure = null;
  #gate = null;
  #entered = createDeferred();
  #delegate = new AIService({
    provider: new MockAIProvider({ delayMs: 0 }),
    fallbackProvider: new MockAIProvider({ delayMs: 0 }),
    logger: silentLogger,
    maxConcurrency: 4,
  });

  /** The next enrich() calls block until release(). */
  pause() {
    this.#gate = createDeferred();
    this.#entered = createDeferred();
  }

  release() {
    this.#gate?.resolve();
    this.#gate = null;
  }

  /** Resolves once a worker is inside enrich(). */
  waitUntilEntered() {
    return this.#entered.promise;
  }

  async enrich(entry) {
    this.calledEntryIds.push(String(entry._id));
    this.#entered.resolve();
    if (this.#gate) await this.#gate.promise;
    if (this.failure) throw this.failure;
    return this.#delegate.enrich(entry);
  }
}
