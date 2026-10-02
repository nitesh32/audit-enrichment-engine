import { randomInt } from 'node:crypto';
import { UPDATE_MAX_ATTEMPTS, UPDATE_PATH } from '../config/constants.js';
import { ConflictError, NotFoundError } from '../errors/errors.js';
import { evaluateDelta } from './deltaEvaluator.js';

const EVIDENCE_ID_MIN = 100000;
const EVIDENCE_ID_MAX = 1000000;

export class AuditService {
  constructor({ repository, logger }) {
    this.repository = repository;
    this.logger = logger;
  }

  /**
   * Saves the entry immediately as PENDING; the worker enriches it later.
   * @throws {ConflictError} duplicate evidenceId
   */
  create(tenantId, payload) {
    const evidenceId = payload.evidenceId ?? `EVID-${randomInt(EVIDENCE_ID_MIN, EVIDENCE_ID_MAX)}`;
    return this.repository.create({ ...payload, evidenceId, tenantId });
  }

  /**
   * @param {object} query validated paging, filter and sort options
   * @returns {Promise<{ items: object[], total: number, page: number, pageSize: number, totalPages: number }>}
   */
  async list(tenantId, query) {
    const { items, total } = await this.repository.list(tenantId, query);
    return { items, total, page: query.page, pageSize: query.limit, totalPages: Math.max(1, Math.ceil(total / query.limit)) };
  }

  summary(tenantId) {
    return this.repository.summarize(tenantId);
  }

  /** @throws {NotFoundError} */
  async get(tenantId, id) {
    const entry = await this.repository.findById(tenantId, id);
    if (!entry) throw new NotFoundError(`Audit entry ${id} not found`);
    return entry;
  }

  /**
   * Smart delta update: notes-only edits are saved directly (fast track),
   * core edits send the entry back to the AI queue.
   * @returns {Promise<{ entry: object, path: string, changedFields: string[], durationMs: number }>}
   * @throws {NotFoundError}
   * @throws {ConflictError} when concurrent edits keep winning
   */
  async update(tenantId, id, patch) {
    const startedAt = performance.now();
    for (let attempt = 1; attempt <= UPDATE_MAX_ATTEMPTS; attempt += 1) {
      const existing = await this.get(tenantId, id);
      const delta = evaluateDelta(existing, patch);
      if (!(await this.#apply(tenantId, existing, delta))) continue;

      const entry = delta.path === UPDATE_PATH.NO_CHANGE ? existing : await this.get(tenantId, id);
      const changedFields = [...Object.keys(delta.changedCore), ...(delta.changedNotes === null ? [] : ['auditorNotes'])];
      return { entry, path: delta.path, changedFields, durationMs: Math.round(performance.now() - startedAt) };
    }
    throw new ConflictError('Entry was modified concurrently, please retry');
  }

  /** @returns {Promise<boolean>} false when a concurrent core edit won the race */
  async #apply(tenantId, existing, { path, changedCore, changedNotes }) {
    if (path === UPDATE_PATH.FAST_TRACK) {
      await this.repository.saveAuditorNotes(tenantId, existing._id, changedNotes);
      this.logger.info({ evidenceId: existing.evidenceId }, 'update.fast_track');
    }
    if (path === UPDATE_PATH.AI_REQUEUE) {
      const requeued = await this.repository.requeueIfVersion({
        tenantId,
        id: existing._id,
        readVersion: existing.inputVersion,
        changedCore,
        auditorNotes: changedNotes,
      });
      if (requeued) this.logger.info({ evidenceId: existing.evidenceId }, 'update.ai_requeue');
      return requeued;
    }
    return true;
  }
}
