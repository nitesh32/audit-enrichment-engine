import { ValidationError } from '../errors/errors.js';

/**
 * @param {import('zod').ZodType} schema
 * @param {unknown} data
 * @returns parsed data
 * @throws {ValidationError} with one entry per invalid field
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const fields = result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
  throw new ValidationError('Invalid request', fields);
}
