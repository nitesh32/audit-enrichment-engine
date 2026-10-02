import React from 'react';
import { ArrowDown, ArrowUp, Inbox } from 'lucide-react';
import { cn } from '../lib/cn.js';
import AuditListItem from './AuditListItem.jsx';
import AuditRow from './AuditRow.jsx';
import AuditRowSkeleton from './AuditRowSkeleton.jsx';
import { Button } from './ui/button.jsx';
import { Skeleton } from './ui/skeleton.jsx';

const SKELETON_ROWS = 6;
const COLUMNS = [
  { label: 'Evidence', sortField: 'created', sortHint: 'Sort by date' },
  { label: 'Amount', sortField: 'monetaryImpact', align: 'right' },
  { label: 'Control', className: 'hidden lg:table-cell' },
  { label: 'Status' },
  { label: 'Score', sortField: 'riskScore', align: 'right' },
  { label: 'AI summary', className: 'hidden md:table-cell' },
  { label: 'Flags', className: 'hidden xl:table-cell' },
  { label: '', srLabel: 'Open' },
];

/** Audit stream: sortable table from 768px up, stacked list below, with every state handled. */
export default class AuditTable extends React.Component {
  renderMessage(title, hint, action) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <Inbox className="size-6 text-fg-subtle" aria-hidden="true" />
        <p className="text-title font-semibold">{title}</p>
        {hint && <p className="text-fg-muted">{hint}</p>}
        {action}
      </div>
    );
  }

  renderEmptyState() {
    const { hasActiveFilter, onClearFilters, onNewEntry } = this.props;
    if (hasActiveFilter) {
      return this.renderMessage(
        'No entries match these filters',
        null,
        <button className="text-accent underline underline-offset-2" onClick={onClearFilters}>
          Clear filters
        </button>,
      );
    }
    return this.renderMessage(
      'No audit evidence yet',
      'Run npm run seed to load sample evidence, or add your own.',
      <Button variant="primary" onClick={onNewEntry}>
        New evidence
      </Button>,
    );
  }

  renderSortHeader({ label, sortField, sortHint, align, className }) {
    const { sort, onSort } = this.props;
    const isActive = sort.field === sortField;
    const Arrow = sort.direction === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th
        key={label || 'open'}
        scope="col"
        aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
        className={cn('sticky top-14 z-10 bg-surface-2 px-3 py-2 text-left', align === 'right' && 'text-right', className)}
      >
        {sortField ? (
          <button
            type="button"
            title={sortHint}
            onClick={() => onSort(sortField)}
            className={cn('text-label-caps inline-flex items-center gap-1 hover:text-fg', isActive && 'text-fg')}
          >
            {label}
            {isActive && <Arrow className="size-3" aria-hidden="true" />}
          </button>
        ) : (
          <span className={label ? 'text-label-caps' : 'sr-only'}>{label || 'Open'}</span>
        )}
      </th>
    );
  }

  render() {
    const { entries, loading, onOpen } = this.props;
    const isEmpty = !loading && entries.length === 0;
    if (isEmpty) return <div className="rounded-lg border border-border bg-surface">{this.renderEmptyState()}</div>;
    return (
      <div className="rounded-lg border border-border bg-surface">
        <table className="hidden w-full text-left md:table">
          <thead>
            <tr>{COLUMNS.map((column) => this.renderSortHeader(column))}</tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }, (_, index) => <AuditRowSkeleton key={index} />)
              : entries.map((entry) => <AuditRow key={entry._id} entry={entry} onOpen={onOpen} />)}
          </tbody>
        </table>
        <ul className="md:hidden">
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <li key={index} className="border-t border-border px-4 py-3 first:border-t-0" aria-hidden="true">
                  <Skeleton className="mb-2 h-4 w-40" />
                  <Skeleton className="h-3 w-[70%]" />
                </li>
              ))
            : entries.map((entry) => <AuditListItem key={entry._id} entry={entry} onOpen={onOpen} />)}
        </ul>
      </div>
    );
  }
}
