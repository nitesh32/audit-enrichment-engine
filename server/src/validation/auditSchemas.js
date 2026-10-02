import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'must be a 24-character hex id');
const requiredText = z.string().trim().min(1);

export const entryIdParamsSchema = z.object({ id: objectId });

export const createEntrySchema = z
  .object({
    eventType: requiredText.default('Control Execution'),
    evidenceId: requiredText.optional(),
    entityName: requiredText,
    description: requiredText,
    monetaryImpact: z.number().nonnegative(),
    controlId: requiredText,
    actorUserId: requiredText,
    timestamp: z.coerce.date().optional(),
  })
  .strict();

/** Allowlist: only core fields and auditor notes can be edited. */
export const updateEntrySchema = z
  .object({
    monetaryImpact: z.number().nonnegative(),
    description: requiredText,
    controlId: requiredText,
    auditorNotes: z.string().max(5000),
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'at least one field is required');

export const tenantIdSchema = objectId;
