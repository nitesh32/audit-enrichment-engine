import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import { BACKOFF_BASE_MS, MAX_ATTEMPTS, STATUS, WORKER_OUTCOME } from '../config/constants.js';
import { sleep } from '../utils/sleep.js';

const defaultWorkerId = () => `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;

/**
 * Polls MongoDB for PENDING entries and enriches them. Several slots (and
 * several processes) can run side by side: the atomic claim in the repository
 * guarantees one owner per entry.
 */
export class AIWorkerService {
  #abortController = null;
  #slots = [];

  /**
   * @param {{ repository: object, aiService: object, logger: object, concurrency: number,
   *   pollIntervalMs: number, workerId?: string, clock?: () => Date }} dependencies
   */
  constructor({ repository, aiService, logger, concurrency, pollIntervalMs, workerId = defaultWorkerId(), clock = () => new Date() }) {
    this.repository = repository;
    this.aiService = aiService;
    this.logger = logger;
    this.concurrency = concurrency;
    this.pollIntervalMs = pollIntervalMs;
    this.workerId = workerId;
    this.clock = clock;
  }

  /** Starts `concurrency` independent claim-and-process loops. */
  start() {
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;
    this.#slots = Array.from({ length: this.concurrency }, () => this.#runSlot(signal));
    this.logger.info({ workerId: this.workerId, concurrency: this.concurrency }, 'worker.started');
  }

  /** Stops claiming new work and waits for in-flight jobs to finish. */
  async stop() {
    this.#abortController?.abort();
    await Promise.all(this.#slots);
    this.logger.info({ workerId: this.workerId }, 'worker.stopped');
  }

  /**
   * Claims and processes a single entry.
   * @returns {Promise<string>} one of WORKER_OUTCOME
   */
  async runOnce() {
    const entry = await this.repository.claimNext(this.workerId, this.clock());
    if (!entry) return WORKER_OUTCOME.IDLE;

    const claim = { id: entry._id, workerId: this.workerId, claimedVersion: entry.inputVersion };
    this.logger.info({ evidenceId: entry.evidenceId, attempt: entry.aiMetadata.attempts }, 'worker.claimed');
    try {
      const result = await this.aiService.enrich(entry);
      return await this.#commit(entry, claim, result);
    } catch (error) {
      return this.#handleFailure(entry, claim, error);
    }
  }

  async #runSlot(signal) {
    while (!signal.aborted) {
      try {
        const outcome = await this.runOnce();
        if (outcome === WORKER_OUTCOME.IDLE) await sleep(this.pollIntervalMs, signal);
      } catch (error) {
        this.logger.error({ err: error }, 'worker.loop.error');
        await sleep(this.pollIntervalMs, signal);
      }
    }
  }

  async #commit(entry, claim, result) {
    const committed = await this.repository.completeIfCurrent(claim, result, this.clock());
    if (!committed) {
      this.logger.info({ evidenceId: entry.evidenceId }, 'worker.result.discarded');
      return WORKER_OUTCOME.DISCARDED;
    }
    this.logger.info({ evidenceId: entry.evidenceId, riskScore: result.riskScore }, 'worker.completed');
    return WORKER_OUTCOME.COMPLETED;
  }

  async #handleFailure(entry, claim, error) {
    const { attempts } = entry.aiMetadata;
    const canRetry = attempts < MAX_ATTEMPTS;
    const now = this.clock();
    const released = await this.repository.releaseAfterFailure(claim, {
      status: canRetry ? STATUS.PENDING : STATUS.FAILED,
      nextAttemptAt: new Date(now.getTime() + BACKOFF_BASE_MS * 2 ** (attempts - 1)),
      lastError: error.message,
    });
    this.logger.warn({ evidenceId: entry.evidenceId, attempts, err: error }, 'worker.failed');
    if (!released) return WORKER_OUTCOME.DISCARDED;
    return canRetry ? WORKER_OUTCOME.RETRY : WORKER_OUTCOME.FAILED;
  }
}
