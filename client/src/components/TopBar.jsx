import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../lib/cn.js';
import ThemeToggle from './ThemeToggle.jsx';

/** 56px app bar: brand, tenant, API connection state and theme toggle. */
export default class TopBar extends React.Component {
  render() {
    const { isApiDown } = this.props;
    return (
      <div className="sticky top-0 z-30 h-14 border-b border-border bg-surface">
        <div className="mx-auto flex h-full max-w-360 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-6 items-center justify-center rounded bg-accent text-accent-fg">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <span className="text-title font-semibold">SmartAudit</span>
            <span className="rounded-full border border-border px-2 text-label text-fg-muted">Demo tenant</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-label text-fg-muted" role="status">
              <span
                className={cn('size-1.5 rounded-full', isApiDown ? 'bg-risk-high' : 'animate-pulse-dot bg-risk-low')}
              />
              {isApiDown ? 'Reconnecting...' : 'API live'}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    );
  }
}
