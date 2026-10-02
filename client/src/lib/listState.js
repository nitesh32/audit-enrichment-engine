/**
 * Keeps the previous array and object identities when nothing changed, so a
 * poll that returns the same data causes no re-render.
 */
function mergeEntries(previous, incoming) {
  const previousById = new Map(previous.map((entry) => [entry._id, entry]));
  const merged = incoming.map((entry) => {
    const existing = previousById.get(entry._id);
    return existing?.updated === entry.updated ? existing : entry;
  });
  const unchanged = merged.length === previous.length && merged.every((entry, index) => entry === previous[index]);
  return unchanged ? previous : merged;
}

const isSameValue = (first, second) => first === second || JSON.stringify(first) === JSON.stringify(second);

/**
 * Applies a list + summary response to the dashboard state.
 * @returns {object|null} the state changes, or null when nothing visible changed
 */
export function mergeListResponse(previous, list, summary) {
  const entries = mergeEntries(previous.entries, list.items);
  const sheetEntry = entries.find((entry) => entry._id === previous.sheetEntry?._id) ?? previous.sheetEntry;
  const next = { entries, total: list.total, totalPages: list.totalPages, summary, sheetEntry, loading: false, apiStatus: 'ok' };
  return Object.keys(next).every((key) => isSameValue(next[key], previous[key])) ? null : next;
}

/** Clicking a sort header: a new field sorts descending, the same field flips direction. */
export function nextSort(current, field) {
  const flip = current.field === field && current.direction === 'desc';
  return { field, direction: flip ? 'asc' : 'desc' };
}
