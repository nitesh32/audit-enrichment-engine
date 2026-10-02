export const PAGE_SIZE = 10;

/** Query parameters for GET /api/audit-entries; "ALL" filters and empty search are omitted. */
export function buildListParams({ page, filters, sort }) {
  const params = { page, limit: PAGE_SIZE, sort: sort.field, direction: sort.direction };
  if (filters.status !== 'ALL') params.status = filters.status;
  if (filters.risk !== 'ALL') params.risk = filters.risk;
  const search = filters.search.trim();
  if (search) params.search = search;
  return params;
}
