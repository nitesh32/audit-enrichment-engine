import {
  ANOMALY_FLAG,
  BUSINESS_HOURS_UTC,
  FINANCE_CONTROL_PREFIX,
  HIGH_RISK_MIN_SCORE,
  MEDIUM_RISK_MIN_SCORE,
  MONETARY_THRESHOLD,
  OVERRIDE_KEYWORDS,
  RISK_LEVEL,
  RISK_WEIGHTS,
  ROUND_AMOUNT_UNIT,
  SUSPICIOUS_KEYWORDS,
} from '../../config/constants.js';

const FLAG_PHRASES = Object.freeze({
  [ANOMALY_FLAG.MONETARY_THRESHOLD_EXCEEDED]: 'an amount above the approval threshold',
  [ANOMALY_FLAG.MANUAL_OVERRIDE]: 'a manual control override',
  [ANOMALY_FLAG.ROUND_AMOUNT]: 'a suspiciously round amount',
  [ANOMALY_FLAG.OFF_HOURS_ACTIVITY]: 'activity outside business hours',
  [ANOMALY_FLAG.UNUSUAL_DESCRIPTION_PATTERN]: 'an unusual description pattern',
});

const containsAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const isOffHours = (timestamp) => {
  const hour = new Date(timestamp).getUTCHours();
  return hour < BUSINESS_HOURS_UTC.START || hour >= BUSINESS_HOURS_UTC.END;
};

/**
 * @param {{ monetaryImpact: number, description: string, timestamp: Date|string }} entry
 * @returns {string[]} anomaly flags, in a stable order
 */
export function detectAnomalyFlags({ monetaryImpact, description, timestamp }) {
  const text = description.toLowerCase();
  const checks = [
    [ANOMALY_FLAG.MONETARY_THRESHOLD_EXCEEDED, monetaryImpact > MONETARY_THRESHOLD],
    [ANOMALY_FLAG.MANUAL_OVERRIDE, containsAny(text, ['override', 'bypass'])],
    [ANOMALY_FLAG.ROUND_AMOUNT, monetaryImpact >= ROUND_AMOUNT_UNIT && monetaryImpact % ROUND_AMOUNT_UNIT === 0],
    [ANOMALY_FLAG.OFF_HOURS_ACTIVITY, isOffHours(timestamp)],
    [ANOMALY_FLAG.UNUSUAL_DESCRIPTION_PATTERN, containsAny(text, SUSPICIOUS_KEYWORDS)],
  ];
  return checks.filter(([, isRaised]) => isRaised).map(([flag]) => flag);
}

/**
 * @param {{ monetaryImpact: number, description: string, controlId: string }} entry
 * @param {string[]} flags result of detectAnomalyFlags
 * @returns {number} integer score from 0 to 100
 */
export function scoreRisk({ monetaryImpact, description, controlId }, flags) {
  const weights = RISK_WEIGHTS;
  const text = description.toLowerCase();
  const amountScore = Math.min(
    weights.AMOUNT_MAX,
    Math.round(Math.log10(Math.max(monetaryImpact, 1)) * weights.AMOUNT_LOG_FACTOR),
  );
  const keywordHits = [...OVERRIDE_KEYWORDS, ...SUSPICIOUS_KEYWORDS].filter((keyword) => text.includes(keyword));
  const keywordScore = Math.min(keywordHits.length, weights.KEYWORD_MAX_COUNT) * weights.KEYWORD;
  const flagScore =
    (flags.includes(ANOMALY_FLAG.MONETARY_THRESHOLD_EXCEEDED) ? weights.THRESHOLD : 0) +
    (flags.includes(ANOMALY_FLAG.ROUND_AMOUNT) ? weights.ROUND_AMOUNT : 0) +
    (flags.includes(ANOMALY_FLAG.OFF_HOURS_ACTIVITY) ? weights.OFF_HOURS : 0);
  const controlScore = controlId.startsWith(FINANCE_CONTROL_PREFIX) ? weights.FINANCE_CONTROL : 0;
  return Math.min(weights.MAX_SCORE, amountScore + keywordScore + flagScore + controlScore);
}

/** LOW < 40 <= MEDIUM < 70 <= HIGH */
export function riskLevelFor(riskScore) {
  if (riskScore >= HIGH_RISK_MIN_SCORE) return RISK_LEVEL.HIGH;
  if (riskScore >= MEDIUM_RISK_MIN_SCORE) return RISK_LEVEL.MEDIUM;
  return RISK_LEVEL.LOW;
}

/** @returns {string} a one or two sentence explanation built from the flags */
export function buildSummary({ monetaryImpact, controlId }, flags, riskLevel) {
  const impact = `$${monetaryImpact.toLocaleString('en-US')}`;
  if (flags.length === 0) {
    return `No anomaly signals detected. Routine ${impact} activity under ${controlId}.`;
  }
  const phrases = flags.map((flag) => FLAG_PHRASES[flag]).join(', ');
  return `Flagged for ${phrases}. The ${impact} impact under ${controlId} is ${riskLevel} risk and needs auditor review.`;
}
