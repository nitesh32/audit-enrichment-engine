import React from 'react';

/** Four headline numbers, divided by 1px rules rather than boxed in cards. */
export default class KpiStrip extends React.Component {
  buildTiles({ total, pending, highRisk, averageRiskScore }) {
    return [
      { label: 'Total entries', value: total },
      { label: 'Pending AI', value: pending, live: true },
      { label: 'High risk', value: highRisk },
      { label: 'Avg risk score', value: averageRiskScore ?? '-' },
    ];
  }

  render() {
    const tiles = this.buildTiles(this.props.summary);
    return (
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        {tiles.map(({ label, value, live }) => (
          <div key={label} className="bg-surface px-4 py-3 md:px-5">
            <dt className="text-label-caps flex items-center gap-2">
              {label}
              {live && value > 0 && <span className="size-1.5 animate-pulse-dot rounded-full bg-fg-subtle" />}
            </dt>
            <dd className="mt-1 font-mono text-kpi font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    );
  }
}
