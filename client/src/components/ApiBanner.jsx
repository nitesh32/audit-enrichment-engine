import React from 'react';
import { AlertTriangle } from 'lucide-react';

/** Shown above the table while the API is unreachable; polling keeps retrying. */
export default class ApiBanner extends React.Component {
  render() {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-risk-high bg-risk-high-bg px-4 py-2 text-risk-high">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        Can&apos;t reach the API. Retrying...
      </div>
    );
  }
}
