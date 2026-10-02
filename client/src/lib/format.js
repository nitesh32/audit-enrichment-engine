const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const FLAG_LABELS = {
  MONETARY_THRESHOLD_EXCEEDED: 'Over threshold',
  MANUAL_OVERRIDE: 'Manual override',
  ROUND_AMOUNT: 'Round amount',
  OFF_HOURS_ACTIVITY: 'Off-hours',
  UNUSUAL_DESCRIPTION_PATTERN: 'Unusual wording',
};

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const JUST_NOW_SECONDS = 10;

export const formatCurrency = (amount) => currencyFormatter.format(amount);
export const formatPercent = (ratio) => `${Math.round(ratio * 100)}%`;
export const isAiPending = (status) => status === 'PENDING' || status === 'PROCESSING';
export const formatFlag = (flag) => FLAG_LABELS[flag] ?? flag;
export const formatRiskLevel = (level) => level.charAt(0) + level.slice(1).toLowerCase();
export const formatAbsoluteTime = (isoDate) => new Date(isoDate).toLocaleString('en-US');

export function formatRelativeTime(isoDate, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(isoDate).getTime()) / 1000));
  if (seconds < JUST_NOW_SECONDS) return 'just now';
  if (seconds < SECONDS_PER_MINUTE) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  if (minutes < MINUTES_PER_HOUR) return `${minutes}m ago`;
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) return `${hours}h ago`;
  return `${Math.floor(hours / HOURS_PER_DAY)}d ago`;
}
