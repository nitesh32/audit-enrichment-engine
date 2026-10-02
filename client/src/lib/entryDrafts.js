/** Editable form state for an entry, plus the checks that mirror the backend's delta rules. */
export function createDrafts(entry) {
  return {
    notes: entry.aiMetadata.auditorNotes,
    core: {
      monetaryImpact: String(entry.monetaryImpact),
      description: entry.description,
      controlId: entry.controlId,
    },
  };
}

export const isNotesDirty = (entry, drafts) => drafts.notes.trim() !== entry.aiMetadata.auditorNotes;

export function isCoreDirty(entry, { core }) {
  return (
    Number(core.monetaryImpact) !== entry.monetaryImpact ||
    core.description.trim() !== entry.description.trim() ||
    core.controlId.trim() !== entry.controlId.trim()
  );
}

export function isCoreValid({ core }) {
  const amount = Number(core.monetaryImpact);
  return core.monetaryImpact.trim() !== '' && Number.isFinite(amount) && amount >= 0 && core.description.trim() !== '' && core.controlId.trim() !== '';
}
