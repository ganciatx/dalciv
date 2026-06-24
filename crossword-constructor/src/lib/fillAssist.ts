import type { Cell, FillCandidate, WordSlot } from '@/types'
import { collectGridWords, wordToPattern } from '@/lib/grid'
import { searchWords } from '@/lib/wordDb'

export interface FillAssistOptions {
  minScore?: number
  excludeProperNouns?: boolean
  excludeAbbreviations?: boolean
  excludeCrosswordese?: boolean
  limit?: number
}

export async function searchFillCandidates(
  grid: Cell[][],
  slot: WordSlot,
  options: FillAssistOptions = {},
): Promise<FillCandidate[]> {
  const pattern = wordToPattern(slot.word)
  const gridWords = collectGridWords(grid)
  const limit = options.limit ?? 20

  const matches = await searchWords(pattern, {
    length: slot.length,
    minScore: options.minScore ?? 1,
    excludeProperNouns: options.excludeProperNouns,
    excludeAbbreviations: options.excludeAbbreviations ?? true,
    excludeCrosswordese: options.excludeCrosswordese,
    limit: limit * 3,
  })

  return matches
    .map((entry) => ({
      ...entry,
      adjustedScore: rankFillCandidate(entry, gridWords),
    }))
    .sort((a, b) => b.adjustedScore - a.adjustedScore)
    .slice(0, limit)
}

function rankFillCandidate(
  entry: { word: string; score: number; tags: string[] },
  gridWords: Set<string>,
): number {
  let score = entry.score

  if (gridWords.has(entry.word.toUpperCase())) score -= 50
  if (entry.tags.includes('crosswordese')) score -= 25
  if (entry.tags.includes('abbreviation')) score -= 15
  if (entry.tags.includes('proper_noun')) score -= 10

  return score
}

export async function searchFillForUnfilledSlots(
  grid: Cell[][],
  slots: WordSlot[],
  options: FillAssistOptions & { perSlot?: number } = {},
): Promise<Map<number, FillCandidate[]>> {
  const perSlot = options.perSlot ?? 3
  const unfilled = slots.filter((s) => s.word.includes('?'))
  const results = new Map<number, FillCandidate[]>()

  await Promise.all(
    unfilled.map(async (slot) => {
      const candidates = await searchFillCandidates(grid, slot, {
        ...options,
        limit: perSlot,
      })
      results.set(slot.number, candidates)
    }),
  )

  return results
}
