import { LIST_LIMIT, LOCK_TTL_MS, STATUS } from '../config/constants.js';
import { ConflictError } from '../errors/errors.js';
import { AuditEntry } from '../models/AuditEntry.js';

const DUPLICATE_KEY_ERROR_CODE = 11000;

const SIMILARITY_PROJECTION = {
  evidenceId: 1,
  entityName: 1,
  description: 1,
  monetaryImpact: 1,
  controlId: 1,
  'aiMetadata.riskScore': 1,
  'aiMetadata.riskLevel': 1,
  'aiMetadata.aiSummary': 1,
  'aiMetadata.semanticVector': 1,
};

/**
 * The only class that talks to MongoDB. Every update uses targeted operators
 * on dotted paths so baseline evidence is never overwritten.
 */
export class AuditRepository {
  /**
   * @param {object} data baseline evidence fields plus tenantId
   * @returns {Promise<object>} the stored entry
   * @throws {ConflictError} when the evidenceId already exists for the tenant
   */
  async create(data) {
    try {
      const document = await AuditEntry.create(data);
      return document.toObject();
    } catch (error) {
      if (error.code === DUPLICATE_KEY_ERROR_CODE) {
        throw new ConflictError(`Evidence ${data.evidenceId} already exists`);
      }
      throw error;
    }
  }

  /** @returns {Promise<object|null>} */
  findById(tenantId, id) {
    return AuditEntry.findOne({ _id: id, tenantId }).lean();
  }

  /** Newest first; the vector is left out to keep the polled payload small. */
  list(tenantId, limit = LIST_LIMIT) {
    return AuditEntry.find({ tenantId }, { 'aiMetadata.semanticVector': 0 })
      .sort({ created: -1 })
      .limit(limit)
      .lean();
  }

  /** Completed entries in the same vector space, with only the fields the UI needs. */
  findSimilarityCandidates({ tenantId, excludeId, providers }) {
    return AuditEntry.find(
      {
        tenantId,
        _id: { $ne: excludeId },
        'aiMetadata.status': STATUS.COMPLETED,
        'aiMetadata.provider': { $in: providers },
      },
      SIMILARITY_PROJECTION,
    ).lean();
  }

  /** Fast track: touches nothing but the notes, so it is safe while a worker runs. */
  async saveAuditorNotes(tenantId, id, auditorNotes) {
    await AuditEntry.updateOne({ _id: id, tenantId }, { $set: { 'aiMetadata.auditorNotes': auditorNotes } });
  }

  /**
   * Applies a core edit and sends the entry back to the AI queue, but only if
   * nobody else edited it since `readVersion`.
   * @returns {Promise<boolean>} false when a concurrent edit won
   */
  async requeueIfVersion({ tenantId, id, readVersion, changedCore, auditorNotes }, now = new Date()) {
    const notesUpdate = auditorNotes === null ? {} : { 'aiMetadata.auditorNotes': auditorNotes };
    const { matchedCount } = await AuditEntry.updateOne(
      { _id: id, tenantId, inputVersion: readVersion },
      {
        $set: {
          ...changedCore,
          ...notesUpdate,
          'aiMetadata.status': STATUS.PENDING,
          'aiMetadata.nextAttemptAt': now,
          'aiMetadata.attempts': 0,
          'aiMetadata.lockedBy': null,
          'aiMetadata.lockedAt': null,
        },
        $inc: { inputVersion: 1 },
      },
    );
    return matchedCount === 1;
  }

  /**
   * Atomically takes the next runnable entry: a due PENDING one, or a
   * PROCESSING one whose lock expired (crashed worker).
   * @returns {Promise<object|null>} the claimed entry, or null when idle
   */
  claimNext(workerId, now = new Date()) {
    const staleBefore = new Date(now.getTime() - LOCK_TTL_MS);
    return AuditEntry.findOneAndUpdate(
      {
        $or: [
          { 'aiMetadata.status': STATUS.PENDING, 'aiMetadata.nextAttemptAt': { $lte: now } },
          { 'aiMetadata.status': STATUS.PROCESSING, 'aiMetadata.lockedAt': { $lt: staleBefore } },
        ],
      },
      {
        $set: {
          'aiMetadata.status': STATUS.PROCESSING,
          'aiMetadata.lockedBy': workerId,
          'aiMetadata.lockedAt': now,
        },
        $inc: { 'aiMetadata.attempts': 1 },
      },
      { sort: { 'aiMetadata.nextAttemptAt': 1 }, returnDocument: 'after' },
    ).lean();
  }

  /**
   * Stores the AI result only if the entry is still the version and lock the
   * worker claimed. Never writes auditorNotes.
   * @returns {Promise<boolean>} false when the result is stale and was dropped
   */
  async completeIfCurrent(claim, result, now = new Date()) {
    const { matchedCount } = await AuditEntry.updateOne(this.#claimFilter(claim), {
      $set: {
        'aiMetadata.status': STATUS.COMPLETED,
        'aiMetadata.riskScore': result.riskScore,
        'aiMetadata.riskLevel': result.riskLevel,
        'aiMetadata.aiSummary': result.aiSummary,
        'aiMetadata.anomalyFlags': result.anomalyFlags,
        'aiMetadata.semanticVector': result.semanticVector,
        'aiMetadata.provider': result.provider,
        'aiMetadata.processedVersion': claim.claimedVersion,
        'aiMetadata.completedAt': now,
        'aiMetadata.lastError': null,
        'aiMetadata.lockedBy': null,
        'aiMetadata.lockedAt': null,
      },
    });
    return matchedCount === 1;
  }

  /**
   * Releases a failed job: back to PENDING with a backoff, or FAILED.
   * @returns {Promise<boolean>} false when the claim is stale
   */
  async releaseAfterFailure(claim, { status, nextAttemptAt, lastError }) {
    const { matchedCount } = await AuditEntry.updateOne(this.#claimFilter(claim), {
      $set: {
        'aiMetadata.status': status,
        'aiMetadata.nextAttemptAt': nextAttemptAt,
        'aiMetadata.lastError': lastError,
        'aiMetadata.lockedBy': null,
        'aiMetadata.lockedAt': null,
      },
    });
    return matchedCount === 1;
  }

  /** Removes every entry; used only by the seed script. */
  async deleteAll() {
    await AuditEntry.deleteMany({});
  }

  #claimFilter({ id, workerId, claimedVersion }) {
    return {
      _id: id,
      inputVersion: claimedVersion,
      'aiMetadata.lockedBy': workerId,
      'aiMetadata.status': STATUS.PROCESSING,
    };
  }
}
