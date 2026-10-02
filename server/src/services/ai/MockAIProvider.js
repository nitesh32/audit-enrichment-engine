import { MOCK_DELAY_JITTER, MOCK_DELAY_MS, PROVIDER } from '../../config/constants.js';
import { sleep } from '../../utils/sleep.js';
import { buildSummary, detectAnomalyFlags, riskLevelFor, scoreRisk } from './riskRules.js';

/**
 * Varies a delay by +/- `jitter` so repeated calls take different times, like a real model.
 * @param {number} baseMs
 * @param {number} jitter fraction, e.g. 0.3 for +/-30%
 * @param {() => number} random returns a number in [0, 1)
 */
export function applyJitter(baseMs, jitter, random = Math.random) {
  return Math.round(baseMs * (1 - jitter + random() * 2 * jitter));
}

/** Local AI engine: results are deterministic, only the simulated processing time varies. */
export class MockAIProvider {
  name = PROVIDER.MOCK;

  constructor({ delayMs = MOCK_DELAY_MS } = {}) {
    this.delayMs = delayMs;
  }

  /** @returns {Promise<{ riskScore: number, aiSummary: string, anomalyFlags: string[] }>} */
  async analyze(entry) {
    await sleep(applyJitter(this.delayMs, MOCK_DELAY_JITTER));
    const anomalyFlags = detectAnomalyFlags(entry);
    const riskScore = scoreRisk(entry, anomalyFlags);
    const aiSummary = buildSummary(entry, anomalyFlags, riskLevelFor(riskScore));
    return { riskScore, aiSummary, anomalyFlags };
  }
}
