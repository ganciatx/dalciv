/**
 * Shared length-based crossword word scoring (used by generate-words.mjs and the app).
 */

/** @param {string} word */
export function scoreWordByLength(word) {
  const w = word.toUpperCase()
  if (w.length <= 3) return { score: 60, tags: [] }
  if (w.length <= 5) return { score: 75, tags: [] }
  if (w.length <= 8) return { score: 70, tags: [] }
  return { score: 65, tags: [] }
}
