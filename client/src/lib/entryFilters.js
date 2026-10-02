import { isAiPending } from './format.js';

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

const SEARCHABLE_FIELDS = ['evidenceId', 'entityName', 'description', 'controlId'];
const SORT_VALUE = {
  created: (entry) => new Date(entry.created).getTime(),
  monetaryImpact: (entry) => entry.monetaryImpact,
  riskScore: (entry) => entry.aiMetadata.riskScore,
};

export const isDefaultFilters = (filters) =>
  filters.status === 'ALL' && filters.risk === 'ALL' && filters.search === '';

function matchesStatus({ aiMetadata }, status) {
  if (status === 'ALL') return true;
  return status === 'PENDING' ? isAiPending(aiMetadata.status) : aiMetadata.status === status;
}

export function applyFilters(entries, { status, risk, search }) {
  const query = search.trim().toLowerCase();
  return entries.filter((entry) => {
    if (!matchesStatus(entry, status)) return false;
    if (risk !== 'ALL' && entry.aiMetadata.riskLevel !== risk) return false;
    return !query || SEARCHABLE_FIELDS.some((field) => entry[field].toLowerCase().includes(query));
  });
}

/** Sorts a copy; entries without a value (unscored) always go last. */
export function sortEntries(entries, { field, direction }) {
  const valueOf = SORT_VALUE[field];
  const factor = direction === 'asc' ? 1 : -1;
  return [...entries].sort((first, second) => {
    const firstValue = valueOf(first);
    const secondValue = valueOf(second);
    if (firstValue === null || secondValue === null) return (firstValue === null) - (secondValue === null);
    return (firstValue - secondValue) * factor;
  });
}

/**
 * Keeps the previous array and object identities when nothing changed, so a
 * poll that returns the same data causes no re-render.
 */
export function mergeEntries(previous, incoming) {
  const previousById = new Map(previous.map((entry) => [entry._id, entry]));
  const merged = incoming.map((entry) => {
    const existing = previousById.get(entry._id);
    return existing?.updated === entry.updated ? existing : entry;
  });
  const unchanged = merged.length === previous.length && merged.every((entry, index) => entry === previous[index]);
  return unchanged ? previous : merged;
}

export const countPending = (entries) => entries.filter((entry) => isAiPending(entry.aiMetadata.status)).length;
