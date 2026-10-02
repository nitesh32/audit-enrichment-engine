import React from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/cn.js';
import { formatRiskLevel } from '../lib/format.js';
import { Badge } from './ui/badge.jsx';
import { Tooltip } from './ui/tooltip.jsx';

const QUEUE_LABEL = { PENDING: 'Pending', PROCESSING: 'Processing', FAILED: 'Failed' };
const CROSS_FADE = { duration: 0.15 };

/** AI queue state while waiting, then the risk level; cross-fades when it changes. */
export default class StatusBadge extends React.Component {
  resolve({ status, riskLevel }) {
    if (status === 'COMPLETED') return { label: formatRiskLevel(riskLevel), tone: riskLevel.toLowerCase() };
    return { label: QUEUE_LABEL[status], tone: status === 'FAILED' ? 'failed' : 'pending' };
  }

  renderIndicator(status) {
    if (status === 'PROCESSING') return <Loader2 className="size-3 animate-spin" aria-hidden="true" />;
    return <span className={cn('size-1.5 rounded-full bg-current', status === 'PENDING' && 'animate-pulse-dot')} />;
  }

  render() {
    const { status, lastError } = this.props;
    const { label, tone } = this.resolve(this.props);
    const badge = (
      <span className="inline-flex">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            className="inline-flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={CROSS_FADE}
          >
            <Badge tone={tone}>
              {this.renderIndicator(status)}
              {label}
            </Badge>
          </motion.span>
        </AnimatePresence>
      </span>
    );
    return status === 'FAILED' && lastError ? <Tooltip content={lastError}>{badge}</Tooltip> : badge;
  }
}
