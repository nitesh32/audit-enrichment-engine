import React from 'react';
import { countPending } from '../lib/entryFilters.js';
import { cn } from '../lib/cn.js';

/** Four headline numbers, divided by 1px rules rather than boxed in cards. */
export default class KpiStrip extends React.Component {
  buildTiles(entries) {
    const scores = entries.map((entry) => entry.aiMetadata.riskScore).filter((score) => score !== null);
    const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : '-';
    return [
      { label: 'Total entries', value: entries.length },
      { label: 'Pending AI', value: countPending(entries), live: true },
      { label: 'High risk', value: entries.filter((entry) => entry.aiMetadata.riskLevel === 'HIGH').length },
      { label: 'Avg risk score', value: averageScore },
    ];
  }

  render() {
    const tiles = this.buildTiles(this.props.entries);
    return (
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        {tiles.map(({ label, value, live }) => (
          <div key={label} className="bg-surface px-4 py-3 md:px-5">
            <dt className="text-label-caps flex items-center gap-2">
              {label}
              {live && value > 0 && <span className="size-1.5 animate-pulse-dot rounded-full bg-fg-subtle" />}
            </dt>
            <dd className={cn('mt-1 font-mono text-kpi font-semibold tabular-nums')}>{value}</dd>
          </div>
        ))}
      </dl>
    );
  }
}
