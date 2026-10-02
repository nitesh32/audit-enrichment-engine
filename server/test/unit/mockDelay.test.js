import { describe, expect, it } from 'vitest';
import { applyJitter } from '../../src/services/ai/MockAIProvider.js';

describe('applyJitter', () => {
  it('stays within +/- the jitter fraction of the base delay', () => {
    expect(applyJitter(2000, 0.3, () => 0)).toBe(1400);
    expect(applyJitter(2000, 0.3, () => 0.5)).toBe(2000);
    expect(applyJitter(2000, 0.3, () => 0.999999)).toBe(2600);
  });

  it('never delays when the base delay is zero (tests and CI)', () => {
    expect(applyJitter(0, 0.3, () => 0)).toBe(0);
    expect(applyJitter(0, 0.3, () => 0.9)).toBe(0);
  });

  it('gives different delays across calls with real randomness', () => {
    const delays = new Set(Array.from({ length: 20 }, () => applyJitter(2000, 0.3)));
    expect(delays.size).toBeGreaterThan(5);
  });
});
