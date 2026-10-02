import React from 'react';

const EMPTY_FORM = {
  entityName: '',
  description: '',
  monetaryImpact: '',
  controlId: 'CTRL-FIN-302',
  actorUserId: 'user_7731',
};

/** Creates an entry so the PENDING to COMPLETED flow can be seen live. */
export default class NewEntryForm extends React.Component {
  state = { form: EMPTY_FORM, submitting: false };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState((previous) => ({ form: { ...previous.form, [name]: value } }));
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({ submitting: true });
    const { form } = this.state;
    const created = await this.props.onCreate({ ...form, monetaryImpact: Number(form.monetaryImpact) });
    this.setState({ submitting: false, form: created ? EMPTY_FORM : form });
  };

  renderField(name, label, props = {}) {
    return (
      <label className="flex flex-col gap-1 text-xs text-muted">
        {label}
        <input
          required
          name={name}
          value={this.state.form[name]}
          onChange={this.handleChange}
          className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
          {...props}
        />
      </label>
    );
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit} className="grid gap-3 rounded border border-line bg-panel p-4 md:grid-cols-5">
        {this.renderField('entityName', 'Entity')}
        {this.renderField('description', 'Description')}
        {this.renderField('monetaryImpact', 'Amount (USD)', { type: 'number', min: 0, className: 'rounded border border-line bg-surface px-2 py-1 text-right font-mono text-sm text-ink' })}
        {this.renderField('controlId', 'Control ID')}
        <button
          disabled={this.state.submitting}
          className="self-end rounded bg-accent px-3 py-2 text-sm font-medium text-on-accent disabled:opacity-50"
        >
          {this.state.submitting ? 'Creating...' : 'Create entry'}
        </button>
      </form>
    );
  }
}
