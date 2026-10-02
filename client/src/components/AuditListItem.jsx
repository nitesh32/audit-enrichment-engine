import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../lib/format.js';
import RelativeTime from './RelativeTime.jsx';
import StatusBadge from './StatusBadge.jsx';
import SummaryCell from './SummaryCell.jsx';

/** Compact stacked item used instead of a table row below 768px. */
export default class AuditListItem extends React.PureComponent {
  open = () => this.props.onOpen(this.props.entry._id);

  render() {
    const { entry } = this.props;
    const { aiMetadata } = entry;
    return (
      <li className="border-t border-border first:border-t-0">
        <button
          type="button"
          data-testid="audit-list-item"
          onClick={this.open}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-medium">{entry.entityName}</span>
              <span className="font-mono tabular-nums">{formatCurrency(entry.monetaryImpact)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={aiMetadata.status} riskLevel={aiMetadata.riskLevel} lastError={aiMetadata.lastError} />
              <span className="font-mono text-label text-fg-muted">{entry.evidenceId}</span>
              <RelativeTime value={entry.created} className="text-label text-fg-subtle" />
            </div>
            <div className="mt-2">
              <SummaryCell status={aiMetadata.status} summary={aiMetadata.aiSummary} lines={1} />
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
        </button>
      </li>
    );
  }
}
