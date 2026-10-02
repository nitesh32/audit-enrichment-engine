import React from 'react';
import { cn } from '../lib/cn.js';

const FILL_TONE = { LOW: 'bg-risk-low', MEDIUM: 'bg-risk-med', HIGH: 'bg-risk-high' };

/** Score as a mono number plus a 48x4 meter; a dash while there is no score. */
export default class RiskScoreCell extends React.Component {
  render() {
    const { score, level, className, barClassName, hideNumber = false } = this.props;
    if (score === null) return <span className={cn('text-fg-subtle', className)}>-</span>;
    return (
      <span className={cn('inline-flex items-center justify-end gap-2', className)}>
        {!hideNumber && <span className="font-mono tabular-nums">{score}</span>}
        <span className={cn('h-1 overflow-hidden rounded-full bg-surface-2', barClassName ?? 'w-12')} aria-hidden="true">
          <span className={cn('block h-1 rounded-full', FILL_TONE[level])} style={{ width: `${score}%` }} />
        </span>
      </span>
    );
  }
}
