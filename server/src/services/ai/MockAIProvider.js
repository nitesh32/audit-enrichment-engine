import { MOCK_DELAY_MS, PROVIDER } from '../../config/constants.js';
import { sleep } from '../../utils/sleep.js';
import { buildSummary, detectAnomalyFlags, riskLevelFor, scoreRisk } from './riskRules.js';
import { vectorize } from './vectorizer.js';

/** Deterministic local AI engine with a simulated processing delay. */
export class MockAIProvider {
  name = PROVIDER.MOCK;

  constructor({ delayMs = MOCK_DELAY_MS } = {}) {
    this.delayMs = delayMs;
  }

  /** @returns {Promise<{ riskScore: number, aiSummary: string, anomalyFlags: string[] }>} */
  async analyze(entry) {
    await sleep(this.delayMs);
    const anomalyFlags = detectAnomalyFlags(entry);
    const riskScore = scoreRisk(entry, anomalyFlags);
    const aiSummary = buildSummary(entry, anomalyFlags, riskLevelFor(riskScore));
    return { riskScore, aiSummary, anomalyFlags };
  }

  /** @returns {Promise<number[]>} */
  async embed(text) {
    return vectorize(text);
  }
}
