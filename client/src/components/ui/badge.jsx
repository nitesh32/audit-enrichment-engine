import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn.js';

const badgeVariants = cva('inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-label font-medium', {
  variants: {
    tone: {
      high: 'bg-risk-high-bg text-risk-high',
      medium: 'bg-risk-med-bg text-risk-med',
      low: 'bg-risk-low-bg text-risk-low',
      pending: 'bg-pending-bg text-pending',
      failed: 'bg-risk-high-bg text-failed',
    },
  },
  defaultVariants: { tone: 'pending' },
});

export function Badge({ tone, className, ...props }) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
