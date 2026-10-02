import { AI_MAX_RETRIES, AI_RETRY_BASE_MS, PROVIDER } from '../../config/constants.js';
import { Semaphore } from '../../utils/Semaphore.js';
import { withRetry } from '../../utils/retry.js';
import { riskLevelFor } from './riskRules.js';
import { vectorize } from './vectorizer.js';

/**
 * Facade over AI providers: caps concurrent calls, retries transient errors
 * and falls back to the local provider when the primary one fails.
 * The semantic vector is always built locally, so similarity works the same with any provider.
 */
export class AIService {
  /**
   * @param {{ provider: object, fallbackProvider: object, logger: object, maxConcurrency: number }} dependencies
   */
  constructor({ provider, fallbackProvider, logger, maxConcurrency }) {
    this.provider = provider;
    this.fallbackProvider = fallbackProvider;
    this.logger = logger;
    this.semaphore = new Semaphore(maxConcurrency);
  }

  /**
   * @param {object} entry audit entry with monetaryImpact, description, controlId, timestamp
   * @returns {Promise<{ riskScore: number, riskLevel: string, aiSummary: string,
   *   anomalyFlags: string[], semanticVector: number[], provider: string }>}
   * @throws when the fallback provider also fails
   */
  async enrich(entry) {
    try {
      return await this.#enrichWith(this.provider, entry, this.provider.name);
    } catch (error) {
      if (this.provider === this.fallbackProvider) throw error;
      this.logger.warn({ err: error, evidenceId: entry.evidenceId }, 'ai.fallback');
      return this.#enrichWith(this.fallbackProvider, entry, PROVIDER.MOCK_FALLBACK);
    }
  }

  async #enrichWith(provider, entry, providerName) {
    const analysis = await this.#limited(() => provider.analyze(entry));
    const semanticVector = vectorize(entry.description);
    return { ...analysis, riskLevel: riskLevelFor(analysis.riskScore), semanticVector, provider: providerName };
  }

  #limited(task) {
    const retryOptions = { maxRetries: AI_MAX_RETRIES, baseDelayMs: AI_RETRY_BASE_MS };
    return this.semaphore.run(() => withRetry(task, retryOptions));
  }
}
