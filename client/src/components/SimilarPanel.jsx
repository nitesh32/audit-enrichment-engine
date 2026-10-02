import React from 'react';
import { formatCurrency, formatPercent } from '../lib/format.js';
import StatusBadge from './StatusBadge.jsx';

/** Top similar historical entries for one row. */
export default class SimilarPanel extends React.Component {
  renderMatch({ entry, similarity }) {
    return (
      <li key={entry._id} className="grid grid-cols-[8rem_1fr_6rem_5rem] items-center gap-4 py-2 text-sm">
        <span className="font-mono">{entry.evidenceId}</span>
        <span className="truncate" title={entry.description}>
          {entry.entityName}
        </span>
        <span className="text-right font-mono tabular-nums">{formatCurrency(entry.monetaryImpact)}</span>
        <StatusBadge status="COMPLETED" riskLevel={entry.aiMetadata.riskLevel} />
        <span className="col-span-4 flex items-center gap-2">
          <span className="h-1 flex-1 rounded bg-neutral-soft">
            <span className="block h-1 rounded bg-accent" style={{ width: formatPercent(Math.max(similarity, 0)) }} />
          </span>
          <span className="w-10 text-right font-mono text-xs tabular-nums">{formatPercent(similarity)}</span>
        </span>
      </li>
    );
  }

  render() {
    const { loading, results, error } = this.props.state;
    if (loading) return <p className="text-sm text-muted">Comparing semantic vectors...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;
    if (results.length === 0) return <p className="text-sm text-muted">No other completed entries to compare.</p>;
    return (
      <div>
        <p className="mb-1 text-xs font-medium text-muted">Most similar historical exceptions</p>
        <ul className="divide-y divide-line">{results.map((match) => this.renderMatch(match))}</ul>
      </div>
    );
  }
}
