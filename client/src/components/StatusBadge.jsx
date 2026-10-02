import React from 'react';
import { isAiPending } from '../lib/format.js';

const TONE_BY_LABEL = {
  PENDING: 'bg-neutral-soft text-muted',
  PROCESSING: 'bg-neutral-soft text-muted',
  LOW: 'bg-success-soft text-success',
  MEDIUM: 'bg-warning-soft text-warning',
  HIGH: 'bg-danger-soft text-danger',
  FAILED: 'bg-danger-soft text-danger',
};

/** Shows the AI status while queued, then the risk level once completed. */
export default class StatusBadge extends React.Component {
  render() {
    const { status, riskLevel } = this.props;
    const label = status === 'COMPLETED' ? riskLevel : status;
    const pulse = isAiPending(status) ? 'badge-pulse' : '';
    return (
      <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${TONE_BY_LABEL[label]} ${pulse}`}>
        {label}
      </span>
    );
  }
}
