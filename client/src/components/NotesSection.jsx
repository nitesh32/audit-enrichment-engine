import React from 'react';
import { Zap } from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Field, Textarea } from './ui/field.jsx';

/** Fast-track edit: saved instantly, never re-runs the AI. */
export default class NotesSection extends React.Component {
  render() {
    const { value, onChange, onSave, isSaving, isDirty } = this.props;
    return (
      <section className="border-t border-border px-6 py-5" aria-labelledby="notes-title">
        <h3 id="notes-title" className="mb-3 text-title font-semibold">
          Auditor notes
        </h3>
        <Field label="Notes" htmlFor="auditor-notes" hint="Notes don't trigger AI re-analysis.">
          <Textarea
            id="auditor-notes"
            rows={4}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Add your review notes"
          />
        </Field>
        <Button variant="primary" className="mt-3" disabled={!isDirty} loading={isSaving} onClick={onSave}>
          {!isSaving && <Zap aria-hidden="true" />}
          Save notes
        </Button>
      </section>
    );
  }
}
