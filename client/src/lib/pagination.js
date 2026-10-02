/**
 * Page numbers to show: first, last and the current page with its neighbours.
 * A gap of one page shows that page; a larger gap shows an ellipsis.
 * @returns {Array<number|'ellipsis-start'|'ellipsis-end'>}
 */
export function getPageItems(page, totalPages) {
  const wanted = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((candidate) => candidate >= 1 && candidate <= totalPages)
    .sort((first, second) => first - second);
  const items = [];
  wanted.forEach((candidate, index) => {
    const gap = index === 0 ? 0 : candidate - wanted[index - 1];
    if (gap === 2) items.push(candidate - 1);
    if (gap > 2) items.push(candidate < page ? 'ellipsis-start' : 'ellipsis-end');
    items.push(candidate);
  });
  return items;
}
