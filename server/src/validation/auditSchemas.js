import { z } from 'zod';
import {
  DEFAULT_PAGE_SIZE,
  LIST_SORT_PATHS,
  MAX_PAGE_SIZE,
  RISK_LEVEL,
  STATUS_FILTER_MATCHES,
} from '../config/constants.js';

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

export const listEntriesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    search: z.string().trim().max(100).optional(),
    status: z.enum(Object.keys(STATUS_FILTER_MATCHES)).optional(),
    risk: z.enum(Object.values(RISK_LEVEL)).optional(),
    sort: z.enum(Object.keys(LIST_SORT_PATHS)).default('created'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

export const tenantIdSchema = objectId;
