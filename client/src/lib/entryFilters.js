export const STATUS_FILTERS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending AI' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

export const RISK_FILTERS = [
  { value: 'ALL', label: 'All risk levels' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export const DEFAULT_FILTERS = { status: 'ALL', risk: 'ALL', search: '' };
export const DEFAULT_SORT = { field: 'created', direction: 'desc' };

export const isDefaultFilters = (filters) =>
  filters.status === 'ALL' && filters.risk === 'ALL' && filters.search === '';
