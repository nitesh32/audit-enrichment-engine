import React from 'react';
import { getPageItems } from '../lib/pagination.js';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination.jsx';

/** "Showing 1-10 of 23" plus page controls; the server does the paging. */
export default class AuditPagination extends React.Component {
  render() {
    const { page, totalPages, total, pageSize, onPageChange } = this.props;
    const firstShown = (page - 1) * pageSize + 1;
    const lastShown = Math.min(page * pageSize, total);
    return (
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-fg-muted" aria-live="polite">
          Showing <span className="font-mono tabular-nums">{firstShown}-{lastShown}</span> of{' '}
          <span className="font-mono tabular-nums">{total}</span>
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
            </PaginationItem>
            {getPageItems(page, totalPages).map((item) => (
              <PaginationItem key={item}>
                {typeof item === 'number' ? (
                  <PaginationLink isActive={item === page} aria-label={`Page ${item}`} onClick={() => onPageChange(item)}>
                    {item}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }
}
