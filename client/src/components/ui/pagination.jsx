import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { buttonVariants } from './button.jsx';

/**
 * shadcn/ui Pagination (same exports and composition as the registry component):
 * Pagination > PaginationContent > PaginationItem > Link | Previous | Next | Ellipsis.
 * Links render <button> instead of <a> because paging here is client state, not navigation.
 */
export function Pagination({ className, ...props }) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }) {
  return <ul data-slot="pagination-content" className={cn('flex flex-row items-center gap-1', className)} {...props} />;
}

export function PaginationItem(props) {
  return <li data-slot="pagination-item" {...props} />;
}

export function PaginationLink({ className, isActive, size = 'icon', ...props }) {
  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size }), className)}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, ...props }) {
  return (
    <PaginationLink aria-label="Go to previous page" size="md" className={cn('gap-1 px-2.5 sm:pl-2.5', className)} {...props}>
      <ChevronLeft aria-hidden="true" />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

export function PaginationNext({ className, ...props }) {
  return (
    <PaginationLink aria-label="Go to next page" size="md" className={cn('gap-1 px-2.5 sm:pr-2.5', className)} {...props}>
      <span className="hidden sm:block">Next</span>
      <ChevronRight aria-hidden="true" />
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className, ...props }) {
  return (
    <span
      aria-hidden="true"
      data-slot="pagination-ellipsis"
      className={cn('flex size-8 items-center justify-center text-fg-subtle', className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
