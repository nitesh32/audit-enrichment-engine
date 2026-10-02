import React from 'react';
import { isAiPending } from '../lib/format.js';
import { cn } from '../lib/cn.js';
import { Skeleton } from './ui/skeleton.jsx';

/** AI summary clamped to two lines (or one); a skeleton while the AI is working. */
export default class SummaryCell extends React.Component {
  render() {
    const { status, summary, lines = 2 } = this.props;
    if (isAiPending(status)) {
      return (
        <div className="flex flex-col gap-2" role="status" aria-label="AI analysis in progress">
          <Skeleton className="h-3 w-[70%]" />
          {lines > 1 && <Skeleton className="h-3 w-[45%]" />}
        </div>
      );
    }
    if (status === 'FAILED') return <span className="text-failed">AI analysis failed</span>;
    return <p className={cn('text-fg-muted', lines === 1 ? 'truncate' : 'line-clamp-2')}>{summary}</p>;
  }
}
