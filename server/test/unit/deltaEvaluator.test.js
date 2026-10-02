import { describe, expect, it } from 'vitest';
import { UPDATE_PATH } from '../../src/config/constants.js';
import { evaluateDelta } from '../../src/services/deltaEvaluator.js';

const existing = {
  monetaryImpact: 85000,
  description: 'Manual approval override',
  controlId: 'CTRL-FIN-302',
  aiMetadata: { auditorNotes: 'first note' },
};

describe('evaluateDelta', () => {
  it('fast-tracks a notes-only change', () => {
    const delta = evaluateDelta(existing, { auditorNotes: 'second note' });
    expect(delta).toMatchObject({ path: UPDATE_PATH.FAST_TRACK, changedNotes: 'second note' });
  });

  it('requeues a core field change', () => {
    const delta = evaluateDelta(existing, { monetaryImpact: 90000 });
    expect(delta).toMatchObject({ path: UPDATE_PATH.AI_REQUEUE, changedCore: { monetaryImpact: 90000 } });
  });

  it('requeues when core and notes change together and keeps the notes', () => {
    const delta = evaluateDelta(existing, { controlId: 'CTRL-FIN-999', auditorNotes: 'new' });
    expect(delta).toMatchObject({ path: UPDATE_PATH.AI_REQUEUE, changedNotes: 'new' });
  });

  it('reports no change for equal values in a different type', () => {
    expect(evaluateDelta(existing, { monetaryImpact: '85000' }).path).toBe(UPDATE_PATH.NO_CHANGE);
  });

  it('ignores whitespace-only description changes', () => {
    expect(evaluateDelta(existing, { description: '  Manual approval override ' }).path).toBe(UPDATE_PATH.NO_CHANGE);
  });

  it('reports no change when notes are resent unchanged', () => {
    expect(evaluateDelta(existing, { auditorNotes: 'first note' }).path).toBe(UPDATE_PATH.NO_CHANGE);
  });
});
