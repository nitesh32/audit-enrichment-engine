import { SIMILAR_TOP_K, STATUS } from '../config/constants.js';
import { ConflictError, NotFoundError } from '../errors/errors.js';
import { cosineSimilarity } from './cosineSimilarity.js';

/**
 * Brute-force cosine similarity over a tenant's completed entries:
 * O(n * d) with d = 8. At larger scale only this class changes (e.g. Atlas
 * $vectorSearch with a tenantId pre-filter).
 */
export class SimilarityService {
  constructor({ repository, topK = SIMILAR_TOP_K }) {
    this.repository = repository;
    this.topK = topK;
  }

  /**
   * @returns {Promise<Array<{ entry: object, similarity: number }>>} most similar first
   * @throws {NotFoundError} unknown entry
   * @throws {ConflictError} the source entry has no vector yet
   */
  async findSimilar(tenantId, entryId) {
    const source = await this.repository.findById(tenantId, entryId);
    if (!source) throw new NotFoundError(`Audit entry ${entryId} not found`);
    if (source.aiMetadata.status !== STATUS.COMPLETED) throw new ConflictError('Vector not ready');

    const candidates = await this.repository.findSimilarityCandidates({ tenantId, excludeId: source._id });

    return candidates
      .map((candidate) => ({
        entry: withoutVector(candidate),
        similarity: cosineSimilarity(source.aiMetadata.semanticVector, candidate.aiMetadata.semanticVector),
      }))
      .sort((first, second) => second.similarity - first.similarity)
      .slice(0, this.topK);
  }
}

function withoutVector({ aiMetadata: { semanticVector, ...visibleMetadata }, ...entry }) {
  return { ...entry, aiMetadata: visibleMetadata };
}
