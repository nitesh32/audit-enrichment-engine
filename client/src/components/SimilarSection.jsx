import React from 'react';
import { Search } from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/format.js';
import StatusBadge from './StatusBadge.jsx';
import { Button } from './ui/button.jsx';
import { Skeleton } from './ui/skeleton.jsx';
import { Tooltip } from './ui/tooltip.jsx';

const RESULT_COUNT = 3;

/** Vector similarity search: the three closest completed entries, each openable. */
export default class SimilarSection extends React.Component {
  renderResult({ entry, similarity }) {
    return (
      <li key={entry._id}>
        <button
          type="button"
          onClick={() => this.props.onOpenEntry(entry._id)}
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-2"
        >
          <span className="w-10 font-mono text-label tabular-nums">{formatPercent(similarity)}</span>
          <span className="h-1 w-10 shrink-0 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <span className="block h-1 rounded-full bg-accent" style={{ width: formatPercent(Math.max(similarity, 0)) }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{entry.entityName}</span>
            <span className="font-mono text-label text-fg-muted">{entry.evidenceId}</span>
          </span>
          <span className="font-mono tabular-nums">{formatCurrency(entry.monetaryImpact)}</span>
          <StatusBadge status="COMPLETED" riskLevel={entry.aiMetadata.riskLevel} />
        </button>
      </li>
    );
  }

  renderBody({ loading, results, error }) {
    if (loading) {
      return (
        <ul className="mt-3 flex flex-col gap-3" aria-label="Loading similar entries">
          {Array.from({ length: RESULT_COUNT }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-9 w-full" />
            </li>
          ))}
        </ul>
      );
    }
    if (error) {
      return (
        <div role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-md bg-risk-high-bg px-3 py-2 text-risk-high">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={this.props.onFind}>
            Retry
          </Button>
        </div>
      );
    }
    if (results === null) return null;
    if (results.length === 0) return <p className="mt-3 text-fg-muted">No other analyzed entries to compare yet.</p>;
    return <ul className="mt-3">{results.map((result) => this.renderResult(result))}</ul>;
  }

  render() {
    const { canSearch, similar, onFind } = this.props;
    return (
      <section className="border-t border-border px-6 py-5" aria-labelledby="similar-title">
        <div className="flex items-center justify-between gap-3">
          <h3 id="similar-title" className="text-title font-semibold">
            Similar exceptions
          </h3>
          <Tooltip content={canSearch ? null : 'Available after AI analysis'}>
            <span className="inline-flex">
              <Button variant="secondary" size="sm" disabled={!canSearch || similar.loading} onClick={onFind}>
                <Search aria-hidden="true" />
                Find similar
              </Button>
            </span>
          </Tooltip>
        </div>
        {this.renderBody(similar)}
      </section>
    );
  }
}
