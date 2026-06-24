export interface WordScore {
  score: number
  tags: string[]
}

const PROPER_NOUN_HINTS = new Set([
  'proper',
  'name',
  'given name',
  'surname',
  'toponym',
  'place',
  'country',
])

/** Crossword-valid lemma: uppercase A–Z, length 3–15. */
export function normalizeCrosswordLemma(raw: string): string | null {
  const word = raw.trim().toUpperCase()
  if (!/^[A-Z]{3,15}$/.test(word)) return null
  return word
}

/** Length-based scoring — keep in sync with scripts/wordScoring.mjs */
export function scoreWordByLength(word: string): WordScore {
  const w = word.toUpperCase()
  if (w.length <= 3) return { score: 60, tags: [] }
  if (w.length <= 5) return { score: 75, tags: [] }
  if (w.length <= 8) return { score: 70, tags: [] }
  return { score: 65, tags: [] }
}

function inferTagsFromApi(apiTags: string[]): string[] {
  const tags = new Set<string>()
  const lower = apiTags.map((t) => t.toLowerCase())
  if (lower.some((t) => [...PROPER_NOUN_HINTS].some((hint) => t.includes(hint)))) {
    tags.add('proper_noun')
  }
  return [...tags]
}

/**
 * Score a word imported from an online dictionary.
 * Length heuristics match the bundled word list; API tags may add proper_noun.
 */
export function scoreImportedWord(word: string, apiTags: string[] = []): WordScore {
  const { score: baseScore, tags: baseTags } = scoreWordByLength(word)
  const inferred = inferTagsFromApi(apiTags)
  const tags = [...new Set([...baseTags, ...inferred])]
  let score = baseScore
  if (tags.includes('proper_noun')) score = Math.min(score, 55)
  return { score, tags }
}
