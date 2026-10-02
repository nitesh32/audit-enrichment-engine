import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency, isAiPending } from '../lib/format.js';
import { cn } from '../lib/cn.js';
import FlagsCell from './FlagsCell.jsx';
import RelativeTime from './RelativeTime.jsx';
import RiskScoreCell from './RiskScoreCell.jsx';
import StatusBadge from './StatusBadge.jsx';
import SummaryCell from './SummaryCell.jsx';

const FLASH_DURATION_MS = 800;

/** One table row: opens the detail sheet, and flashes when the AI result arrives. */
export default class AuditRow extends React.PureComponent {
  state = { flashLevel: null };
  flashTimer = null;

  componentDidUpdate(previousProps) {
    const { aiMetadata } = this.props.entry;
    const justCompleted =
      isAiPending(previousProps.entry.aiMetadata.status) && aiMetadata.status === 'COMPLETED';
    if (!justCompleted) return;
    this.setState({ flashLevel: aiMetadata.riskLevel.toLowerCase() });
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.setState({ flashLevel: null }), FLASH_DURATION_MS);
  }

  componentWillUnmount() {
    clearTimeout(this.flashTimer);
  }

  open = () => this.props.onOpen(this.props.entry._id);

  handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.open();
  };

  render() {
    const { entry } = this.props;
    const { aiMetadata } = entry;
    const { flashLevel } = this.state;
    return (
      <tr
        tabIndex={0}
        data-testid="audit-row"
        aria-label={`${entry.evidenceId}, ${entry.entityName}`}
        onClick={this.open}
        onKeyDown={this.handleKeyDown}
        className={cn(
          'h-11 cursor-pointer border-t border-border hover:bg-surface-2 focus-visible:outline-offset-[-2px]',
          flashLevel && `row-flash flash-${flashLevel}`,
        )}
      >
        <td className="px-3 py-1">
          <div className="flex items-center gap-1.5 whitespace-nowrap text-label text-fg-muted">
            <span className="font-mono">{entry.evidenceId}</span>
            <span aria-hidden="true">·</span>
            <RelativeTime value={entry.created} className="text-fg-subtle" />
          </div>
          <div className="max-w-56 truncate font-medium">{entry.entityName}</div>
        </td>
        <td className="px-3 py-1 text-right font-mono tabular-nums">{formatCurrency(entry.monetaryImpact)}</td>
        <td className="hidden px-3 py-1 font-mono text-label text-fg-muted lg:table-cell">{entry.controlId}</td>
        <td className="px-3 py-1">
          <StatusBadge status={aiMetadata.status} riskLevel={aiMetadata.riskLevel} lastError={aiMetadata.lastError} />
        </td>
        <td className="px-3 py-1 text-right">
          <RiskScoreCell score={aiMetadata.riskScore} level={aiMetadata.riskLevel} />
        </td>
        <td className="hidden max-w-md px-3 py-1 md:table-cell">
          <SummaryCell status={aiMetadata.status} summary={aiMetadata.aiSummary} />
        </td>
        <td className="hidden px-3 py-1 xl:table-cell">
          <FlagsCell flags={aiMetadata.anomalyFlags} />
        </td>
        <td className="w-8 pr-3 text-fg-subtle">
          <ChevronRight className="size-4" aria-hidden="true" />
        </td>
      </tr>
    );
  }
}
