import { formatRiskLevel, isAiPending } from './format.js';

/**
 * Screen-reader text for entries whose AI analysis just finished.
 * @returns {string|null} e.g. "EVID-902188 analyzed: High risk", or null when nothing completed
 */
export function describeCompletions(previousEntries, incomingEntries) {
  const previousById = new Map(previousEntries.map((entry) => [entry._id, entry]));
  const messages = incomingEntries
    .filter((entry) => {
      const previous = previousById.get(entry._id);
      return previous && isAiPending(previous.aiMetadata.status) && entry.aiMetadata.status === 'COMPLETED';
    })
    .map((entry) => `${entry.evidenceId} analyzed: ${formatRiskLevel(entry.aiMetadata.riskLevel)} risk`);
  return messages.length ? messages.join('. ') : null;
}
