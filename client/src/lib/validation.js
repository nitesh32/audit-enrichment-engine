const REQUIRED_MESSAGES = {
  entityName: 'Entity is required',
  description: 'Description is required',
  controlId: 'Control ID is required',
};

/** @returns {string|null} an error message, or null when the value is valid */
export function validateField(name, value) {
  if (name === 'monetaryImpact') {
    const amount = Number(value);
    return String(value).trim() === '' || !Number.isFinite(amount) || amount < 0 ? 'Enter an amount of 0 or more' : null;
  }
  return String(value).trim() === '' ? REQUIRED_MESSAGES[name] : null;
}

export function validateForm(form) {
  const errors = {};
  for (const name of ['entityName', 'description', 'monetaryImpact', 'controlId']) {
    const message = validateField(name, form[name]);
    if (message) errors[name] = message;
  }
  return errors;
}
