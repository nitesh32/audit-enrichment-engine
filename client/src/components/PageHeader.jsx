import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from './ui/button.jsx';

/** Page title, a one-line explanation of the pipeline, and the create action. */
export default class PageHeader extends React.Component {
  render() {
    return (
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-page font-semibold tracking-[-0.01em]">Audit Evidence</h1>
          <p className="mt-1 text-fg-muted">
            Evidence is saved as PENDING, enriched by the AI worker, and re-analyzed only when core fields change.
          </p>
        </div>
        <Button variant="primary" onClick={this.props.onNewEntry}>
          <Plus aria-hidden="true" />
          New evidence
        </Button>
      </header>
    );
  }
}
