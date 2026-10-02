import { CORE_FIELDS, UPDATE_PATH } from '../config/constants.js';

const NORMALIZERS = Object.freeze({
  monetaryImpact: Number,
  description: (value) => String(value).trim(),
  controlId: (value) => String(value).trim(),
});

const normalizeNotes = (notes) => String(notes).trim();

/**
 * Decides how an update must be processed by comparing values, not the keys
 * present in the request.
 * @param {object} existing stored entry
 * @param {object} patch requested changes (core fields and/or auditorNotes)
 * @returns {{ path: string, changedCore: object, changedNotes: string|null }}
 *   `changedCore` holds normalised new values of changed core fields;
 *   `changedNotes` is the new notes text, or null when notes did not change.
 */
export function evaluateDelta(existing, patch) {
  const changedCore = {};
  for (const field of CORE_FIELDS) {
    if (patch[field] === undefined) continue;
    const nextValue = NORMALIZERS[field](patch[field]);
    if (nextValue !== NORMALIZERS[field](existing[field])) changedCore[field] = nextValue;
  }

  const nextNotes = patch.auditorNotes === undefined ? null : normalizeNotes(patch.auditorNotes);
  const changedNotes = nextNotes !== null && nextNotes !== existing.aiMetadata.auditorNotes ? nextNotes : null;

  if (Object.keys(changedCore).length > 0) return { path: UPDATE_PATH.AI_REQUEUE, changedCore, changedNotes };
  if (changedNotes !== null) return { path: UPDATE_PATH.FAST_TRACK, changedCore, changedNotes };
  return { path: UPDATE_PATH.NO_CHANGE, changedCore, changedNotes };
}
