import React from 'react';
import { validateField, validateForm } from '../lib/validation.js';
import { Button } from './ui/button.jsx';
import { Dialog } from './ui/dialog.jsx';
import { Field, Input, Textarea } from './ui/field.jsx';
import { Select } from './ui/select.jsx';

const EVENT_TYPES = ['Control Execution', 'Policy Exception', 'Access Review', 'Manual Journal'].map((label) => ({
  value: label,
  label,
}));

const EMPTY_FORM = {
  eventType: EVENT_TYPES[0].value,
  entityName: '',
  description: '',
  monetaryImpact: '',
  controlId: 'CTRL-FIN-302',
};

const EXAMPLE_FORM = {
  ...EMPTY_FORM,
  entityName: 'Atlas Freight Partners',
  description: 'Manual approval override executed for vendor invoice payables exceeding $50k threshold',
  monetaryImpact: '88500',
};

// The prototype has no authentication, so every entry is attributed to a demo actor.
const DEMO_ACTOR_ID = 'user_7731';

/** Modal form for ingesting evidence, with validation on blur and server errors under the fields. */
export default class NewEntryDialog extends React.Component {
  state = { form: EMPTY_FORM, errors: {}, formError: null, submitting: false };

  componentDidUpdate(previousProps) {
    if (!previousProps.open && this.props.open) {
      this.setState({ form: EMPTY_FORM, errors: {}, formError: null, submitting: false });
    }
  }

  change = (name) => (event) => {
    const { value } = event.target;
    this.setState((previous) => ({ form: { ...previous.form, [name]: value } }));
  };

  validateOnBlur = (name) => () => {
    const message = validateField(name, this.state.form[name]);
    this.setState((previous) => ({ errors: { ...previous.errors, [name]: message } }));
  };

  submit = async (event) => {
    event.preventDefault();
    const errors = validateForm(this.state.form);
    this.setState({ errors, formError: null });
    if (Object.keys(errors).length > 0) return;
    this.setState({ submitting: true });
    const { form } = this.state;
    try {
      await this.props.onCreate({ ...form, monetaryImpact: Number(form.monetaryImpact), actorUserId: DEMO_ACTOR_ID });
    } catch (error) {
      const serverErrors = Object.fromEntries((error.details ?? []).map(({ path, message }) => [path, message]));
      this.setState({ submitting: false, errors: serverErrors, formError: error.message });
    }
  };

  renderField(name, label, control) {
    return (
      <Field label={label} htmlFor={`new-${name}`} error={this.state.errors[name]}>
        {control}
      </Field>
    );
  }

  render() {
    const { open, onOpenChange } = this.props;
    const { form, errors, formError, submitting } = this.state;
    const bind = (name) => ({
      id: `new-${name}`,
      value: form[name],
      onChange: this.change(name),
      onBlur: this.validateOnBlur(name),
      'aria-invalid': Boolean(errors[name]),
    });
    return (
      <Dialog open={open} onOpenChange={onOpenChange} title="New evidence">
        <form onSubmit={this.submit} noValidate className="flex flex-col gap-4 px-6 py-5">
          {this.renderField('entityName', 'Entity', <Input {...bind('entityName')} />)}
          {this.renderField('description', 'Description', <Textarea rows={3} {...bind('description')} />)}
          <div className="grid gap-4 sm:grid-cols-2">
            {this.renderField('monetaryImpact', 'Amount (USD)', <Input type="number" min={0} className="font-mono" {...bind('monetaryImpact')} />)}
            {this.renderField('controlId', 'Control ID', <Input className="font-mono" {...bind('controlId')} />)}
          </div>
          <Field label="Event type" htmlFor="new-eventType">
            <Select
              id="new-eventType"
              label="Event type"
              value={form.eventType}
              options={EVENT_TYPES}
              onValueChange={(eventType) => this.setState((previous) => ({ form: { ...previous.form, eventType } }))}
            />
          </Field>
          {formError && !Object.keys(errors).length && <p role="alert" className="text-risk-high">{formError}</p>}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button variant="ghost" onClick={() => this.setState({ form: EXAMPLE_FORM, errors: {} })}>
              Use example
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Ingest evidence
            </Button>
          </div>
        </form>
      </Dialog>
    );
  }
}
