import { VECTOR_DIM } from '../../config/constants.js';

const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;
const SIGN_BIT_SHIFT = 16;
const VECTOR_PRECISION = 4;

function hashToken(token) {
  let hash = FNV_OFFSET_BASIS;
  for (const character of token) {
    hash = Math.imul(hash ^ character.charCodeAt(0), FNV_PRIME) >>> 0;
  }
  return hash;
}

/**
 * Hashing-trick embedding: each token adds a signed weight to one of the
 * VECTOR_DIM buckets, then the vector is L2-normalised. Texts sharing words
 * therefore end up with similar vectors.
 * @param {string} text
 * @returns {number[]} VECTOR_DIM floats (all zeros when the text has no tokens)
 */
export function vectorize(text) {
  const buckets = new Array(VECTOR_DIM).fill(0);
  for (const token of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    const hash = hashToken(token);
    buckets[hash % VECTOR_DIM] += (hash >>> SIGN_BIT_SHIFT) & 1 ? 1 : -1;
  }
  const norm = Math.hypot(...buckets);
  if (norm === 0) return buckets;
  return buckets.map((value) => Number((value / norm).toFixed(VECTOR_PRECISION)));
}
