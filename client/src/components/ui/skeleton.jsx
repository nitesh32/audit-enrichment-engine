import { cn } from '../../lib/cn.js';

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-skeleton rounded bg-surface-2', className)} />;
}
