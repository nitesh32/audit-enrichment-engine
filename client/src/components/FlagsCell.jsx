import React from 'react';
import { formatFlag } from '../lib/format.js';
import { Tooltip } from './ui/tooltip.jsx';

const VISIBLE_FLAGS = 2;
const CHIP_CLASS = 'rounded border border-border-strong px-1.5 font-mono text-chip text-fg-muted';

/** At most two flag chips plus a "+N" chip whose tooltip lists the rest. */
export default class FlagsCell extends React.Component {
  render() {
    const { flags, showAll = false } = this.props;
    const visible = showAll ? flags : flags.slice(0, VISIBLE_FLAGS);
    const hidden = showAll ? [] : flags.slice(VISIBLE_FLAGS);
    if (flags.length === 0) return <span className="text-fg-subtle">-</span>;
    return (
      <span className="flex flex-wrap gap-1">
        {visible.map((flag) => (
          <span key={flag} title={flag} className={CHIP_CLASS}>
            {formatFlag(flag)}
          </span>
        ))}
        {hidden.length > 0 && (
          <Tooltip content={hidden.map(formatFlag).join(', ')}>
            <span className={CHIP_CLASS}>+{hidden.length}</span>
          </Tooltip>
        )}
      </span>
    );
  }
}
