import React from 'react';
import { formatCurrency, isAiPending } from '../lib/format.js';
import SimilarPanel from './SimilarPanel.jsx';
import StatusBadge from './StatusBadge.jsx';

const FLASH_DURATION_MS = 600;
const COLUMN_COUNT = 9;

/** One table row; flashes briefly when the AI result arrives. */
export default class AuditRow extends React.Component {
  state = { flashing: false };
  flashTimer = null;

  componentDidUpdate(previousProps) {
    const wasWaiting = isAiPending(previousProps.entry.aiMetadata.status);
    if (wasWaiting && this.props.entry.aiMetadata.status === 'COMPLETED') {
      this.setState({ flashing: true });
      this.flashTimer = setTimeout(() => this.setState({ flashing: false }), FLASH_DURATION_MS);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.flashTimer);
  }

  renderFlags(flags) {
    return (
      <div className="flex flex-wrap gap-1">
        {flags.map((flag) => (
          <span key={flag} className="rounded bg-neutral-soft px-1 py-0.5 font-mono text-[10px] text-muted">
            {flag}
          </span>
        ))}
      </div>
    );
  }

  render() {
    const { entry, similarState, onEdit, onFindSimilar } = this.props;
    const { aiMetadata } = entry;
    const isCompleted = aiMetadata.status === 'COMPLETED';
    return (
      <>
        <tr className={`border-t border-line align-top ${this.state.flashing ? 'row-flash' : ''}`}>
          <td className="px-3 py-3 font-mono text-xs">{entry.evidenceId}</td>
          <td className="px-3 py-3">{entry.entityName}</td>
          <td className="px-3 py-3 text-right font-mono tabular-nums">{formatCurrency(entry.monetaryImpact)}</td>
          <td className="px-3 py-3 font-mono text-xs">{entry.controlId}</td>
          <td className="px-3 py-3">
            <StatusBadge status={aiMetadata.status} riskLevel={aiMetadata.riskLevel} />
          </td>
          <td className="px-3 py-3 text-right font-mono tabular-nums">{aiMetadata.riskScore ?? '-'}</td>
          <td className="max-w-xs px-3 py-3 text-sm">
            <p className="line-clamp-2">{aiMetadata.aiSummary ?? 'Awaiting AI analysis...'}</p>
          </td>
          <td className="px-3 py-3">{this.renderFlags(aiMetadata.anomalyFlags)}</td>
          <td className="whitespace-nowrap px-3 py-3 text-right">
            <button
              className="mr-2 rounded border border-line px-2 py-1 text-xs disabled:opacity-40"
              disabled={!isCompleted || similarState?.loading}
              title={isCompleted ? 'Find similar historical exceptions' : 'Available once AI analysis completes'}
              onClick={() => onFindSimilar(entry._id)}
            >
              Find similar
            </button>
            <button className="rounded border border-line px-2 py-1 text-xs" onClick={() => onEdit(entry._id)}>
              Edit
            </button>
          </td>
        </tr>
        {similarState && (
          <tr className="bg-panel">
            <td colSpan={COLUMN_COUNT} className="px-6 py-3">
              <SimilarPanel state={similarState} />
            </td>
          </tr>
        )}
      </>
    );
  }
}
