import { describe, expect, it } from 'vitest';
import { VECTOR_DIM } from '../../src/config/constants.js';
import { cosineSimilarity } from '../../src/services/cosineSimilarity.js';
import { vectorize } from '../../src/services/ai/vectorizer.js';

describe('vectorize', () => {
  it('always returns VECTOR_DIM numbers', () => {
    expect(vectorize('anything at all')).toHaveLength(VECTOR_DIM);
    expect(vectorize('')).toHaveLength(VECTOR_DIM);
  });

  it('is L2-normalised', () => {
    expect(Math.hypot(...vectorize('manual override of vendor payment'))).toBeCloseTo(1, 3);
  });

  it('is deterministic', () => {
    expect(vectorize('same text')).toEqual(vectorize('same text'));
  });

  it('ranks similar text above unrelated text', () => {
    const base = vectorize('Manual approval override executed for vendor invoice payables');
    const similar = vectorize('Manual approval override executed for vendor invoice payables limit');
    const unrelated = vectorize('Routine monthly subscription for office software licences');
    expect(cosineSimilarity(base, similar)).toBeGreaterThan(cosineSimilarity(base, unrelated));
  });
});

describe('cosineSimilarity', () => {
  it('is 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('is 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('returns 0 instead of NaN for a zero vector', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});
