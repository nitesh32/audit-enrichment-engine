const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatCurrency = (amount) => currencyFormatter.format(amount);
export const formatPercent = (ratio) => `${Math.round(ratio * 100)}%`;
export const isAiPending = (status) => status === 'PENDING' || status === 'PROCESSING';
