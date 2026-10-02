/**
 * @param {number[]} first
 * @param {number[]} second same length as `first`
 * @returns {number} value in [-1, 1]; 0 when either vector is all zeros
 */
export function cosineSimilarity(first, second) {
  let dotProduct = 0;
  let firstNormSquared = 0;
  let secondNormSquared = 0;
  for (let index = 0; index < first.length; index += 1) {
    dotProduct += first[index] * second[index];
    firstNormSquared += first[index] ** 2;
    secondNormSquared += second[index] ** 2;
  }
  const denominator = Math.sqrt(firstNormSquared * secondNormSquared);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
