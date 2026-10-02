import React from 'react';
import { Search } from 'lucide-react';
import { RISK_FILTERS, STATUS_FILTERS } from '../lib/entryFilters.js';
import { cn } from '../lib/cn.js';
import { Input } from './ui/field.jsx';
import { Select } from './ui/select.jsx';

/** Search, status and risk filters, and the auto-refresh indicator. */
export default class Toolbar extends React.Component {
  render() {
    const { filters, isApiDown, onFiltersChange } = this.props;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-fg-subtle" aria-hidden="true" />
          <Input
            type="search"
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
            placeholder="Search evidence, entity or description"
            aria-label="Search audit entries"
            className="pl-8"
          />
        </div>
        <Select
          label="Filter by status"
          value={filters.status}
          options={STATUS_FILTERS}
          onValueChange={(status) => onFiltersChange({ status })}
        />
        <Select
          label="Filter by risk level"
          value={filters.risk}
          options={RISK_FILTERS}
          onValueChange={(risk) => onFiltersChange({ risk })}
        />
        <span className="ml-auto hidden items-center gap-2 text-label text-fg-muted sm:flex">
          Auto-refresh
          <span className={cn('size-1.5 rounded-full', isApiDown ? 'bg-fg-subtle' : 'animate-pulse-dot bg-risk-low')} />
        </span>
      </div>
    );
  }
}
