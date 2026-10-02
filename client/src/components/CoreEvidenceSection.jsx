import React from 'react';
import { Button } from './ui/button.jsx';
import { Field, Input, Textarea } from './ui/field.jsx';

/** Core financial fields: changing them re-queues the entry for AI analysis. */
export default class CoreEvidenceSection extends React.Component {
  change = (field) => (event) => this.props.onChange({ [field]: event.target.value });

  render() {
    const { draft, onSave, isSaving, isDirty, isValid } = this.props;
    return (
      <section className="border-t border-border px-6 py-5" aria-labelledby="core-title">
        <h3 id="core-title" className="mb-1 text-title font-semibold">
          Core evidence
        </h3>
        <p className="mb-3 text-fg-muted">Changing these re-queues the entry for AI analysis.</p>
        <div className="flex flex-col gap-3">
          <Field label="Amount (USD)" htmlFor="core-amount">
            <Input id="core-amount" type="number" min={0} value={draft.monetaryImpact} onChange={this.change('monetaryImpact')} className="font-mono" />
          </Field>
          <Field label="Description" htmlFor="core-description">
            <Textarea id="core-description" rows={3} value={draft.description} onChange={this.change('description')} />
          </Field>
          <Field label="Control ID" htmlFor="core-control">
            <Input id="core-control" value={draft.controlId} onChange={this.change('controlId')} className="font-mono" />
          </Field>
        </div>
        <Button variant="secondary" className="mt-3" disabled={!isDirty || !isValid} loading={isSaving} onClick={onSave}>
          Save &amp; re-analyze
        </Button>
      </section>
    );
  }
}
