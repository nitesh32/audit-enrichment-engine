import React from 'react';

/** Side drawer with two separate save paths: auditor notes (fast track) and core evidence (AI re-run). */
export default class EntryEditor extends React.Component {
  state = {
    notes: this.props.entry.aiMetadata.auditorNotes,
    monetaryImpact: String(this.props.entry.monetaryImpact),
    description: this.props.entry.description,
    controlId: this.props.entry.controlId,
    saving: null,
  };

  handleChange = (event) => this.setState({ [event.target.name]: event.target.value });

  save = async (section, patch) => {
    this.setState({ saving: section });
    await this.props.onSave(this.props.entry._id, patch);
    this.setState({ saving: null });
  };

  saveNotes = () => this.save('notes', { auditorNotes: this.state.notes });

  saveCore = () => {
    const { monetaryImpact, description, controlId } = this.state;
    return this.save('core', { monetaryImpact: Number(monetaryImpact), description, controlId });
  };

  renderInput(name, label, props = {}) {
    return (
      <label className="flex flex-col gap-1 text-xs text-muted">
        {label}
        <input
          name={name}
          value={this.state[name]}
          onChange={this.handleChange}
          className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
          {...props}
        />
      </label>
    );
  }

  renderSaveButton(section, label, onClick) {
    return (
      <button
        onClick={onClick}
        disabled={this.state.saving !== null}
        className="self-start rounded bg-accent px-3 py-2 text-sm font-medium text-on-accent disabled:opacity-50"
      >
        {this.state.saving === section ? 'Saving...' : label}
      </button>
    );
  }

  render() {
    const { entry, onClose } = this.props;
    return (
      <aside className="fixed inset-y-0 right-0 z-10 flex w-full max-w-md flex-col gap-6 overflow-y-auto border-l border-line bg-panel p-6">
        <header className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-medium">{entry.evidenceId}</h2>
          <button onClick={onClose} className="text-sm text-muted">Close</button>
        </header>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Auditor notes</h3>
          <p className="text-xs text-muted">Saved instantly. The AI is not re-run.</p>
          <textarea
            name="notes"
            rows={4}
            value={this.state.notes}
            onChange={this.handleChange}
            className="rounded border border-line bg-surface px-2 py-1 text-sm"
          />
          {this.renderSaveButton('notes', 'Save notes', this.saveNotes)}
        </section>

        <section className="flex flex-col gap-3 border-t border-line pt-6">
          <h3 className="text-sm font-medium">Core evidence</h3>
          <p className="text-xs text-muted">Changing these re-queues the entry for AI analysis.</p>
          {this.renderInput('monetaryImpact', 'Amount (USD)', { type: 'number', min: 0 })}
          {this.renderInput('description', 'Description')}
          {this.renderInput('controlId', 'Control ID')}
          {this.renderSaveButton('core', 'Save and re-run AI', this.saveCore)}
        </section>
      </aside>
    );
  }
}
