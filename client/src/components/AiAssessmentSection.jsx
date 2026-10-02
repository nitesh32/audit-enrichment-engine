import React from 'react';
import { formatAbsoluteTime, formatRelativeTime } from '../lib/format.js';
import FlagsCell from './FlagsCell.jsx';
import RiskScoreCell from './RiskScoreCell.jsx';
import StatusBadge from './StatusBadge.jsx';
import SummaryCell from './SummaryCell.jsx';
import { Tooltip } from './ui/tooltip.jsx';

/** Read-only AI result: score, level, full summary, flags and provenance. */
export default class AiAssessmentSection extends React.Component {
  renderMeta({ provider, processedVersion, completedAt }) {
    return (
      <dl className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <dt className="text-label-caps">Provider</dt>
          <dd className="mt-1 font-mono text-label">{provider}</dd>
        </div>
        <div>
          <dt className="text-label-caps">Input version</dt>
          <dd className="mt-1 font-mono text-label">v{processedVersion}</dd>
        </div>
        <div>
          <dt className="text-label-caps">Completed</dt>
          <dd className="mt-1 text-label">
            <Tooltip content={formatAbsoluteTime(completedAt)}>
              <span>{formatRelativeTime(completedAt)}</span>
            </Tooltip>
          </dd>
        </div>
      </dl>
    );
  }

  render() {
    const { aiMetadata } = this.props.entry;
    const isCompleted = aiMetadata.status === 'COMPLETED';
    return (
      <section className="px-6 py-5" aria-labelledby="ai-assessment-title">
        <h3 id="ai-assessment-title" className="mb-3 text-title font-semibold">
          AI assessment
        </h3>
        {isCompleted ? (
          <>
            <div className="flex items-center gap-4">
              <span className="font-mono text-kpi font-semibold tabular-nums">{aiMetadata.riskScore}</span>
              <RiskScoreCell score={aiMetadata.riskScore} level={aiMetadata.riskLevel} hideNumber barClassName="w-24" />
              <StatusBadge status={aiMetadata.status} riskLevel={aiMetadata.riskLevel} />
            </div>
            <p className="mt-3">{aiMetadata.aiSummary}</p>
            <div className="mt-3">
              <FlagsCell flags={aiMetadata.anomalyFlags} showAll />
            </div>
            {this.renderMeta(aiMetadata)}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <StatusBadge status={aiMetadata.status} lastError={aiMetadata.lastError} />
            <SummaryCell status={aiMetadata.status} summary={null} />
          </div>
        )}
      </section>
    );
  }
}
