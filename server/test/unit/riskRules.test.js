import { describe, expect, it } from 'vitest';
import { ANOMALY_FLAG, RISK_LEVEL } from '../../src/config/constants.js';
import { detectAnomalyFlags, riskLevelFor } from '../../src/services/ai/riskRules.js';

const businessHours = '2026-07-21T10:00:00.000Z';
const entry = (overrides) => ({ monetaryImpact: 1234, description: 'Payment', timestamp: businessHours, ...overrides });

describe('detectAnomalyFlags', () => {
  it('raises the threshold flag only above 50000', () => {
    expect(detectAnomalyFlags(entry({ monetaryImpact: 50000 }))).not.toContain(ANOMALY_FLAG.MONETARY_THRESHOLD_EXCEEDED);
    expect(detectAnomalyFlags(entry({ monetaryImpact: 50001 }))).toContain(ANOMALY_FLAG.MONETARY_THRESHOLD_EXCEEDED);
  });

  it('flags override wording, round amounts and off-hours activity', () => {
    const flags = detectAnomalyFlags(
      entry({ monetaryImpact: 20000, description: 'Bypass approval', timestamp: '2026-07-21T02:00:00.000Z' }),
    );
    expect(flags).toEqual([ANOMALY_FLAG.MANUAL_OVERRIDE, ANOMALY_FLAG.ROUND_AMOUNT, ANOMALY_FLAG.OFF_HOURS_ACTIVITY]);
  });

  it('returns no flags for routine activity', () => {
    expect(detectAnomalyFlags(entry())).toEqual([]);
  });
});

describe('riskLevelFor', () => {
  it.each([
    [39, RISK_LEVEL.LOW],
    [40, RISK_LEVEL.MEDIUM],
    [69, RISK_LEVEL.MEDIUM],
    [70, RISK_LEVEL.HIGH],
  ])('maps score %i to %s', (score, level) => {
    expect(riskLevelFor(score)).toBe(level);
  });
});
