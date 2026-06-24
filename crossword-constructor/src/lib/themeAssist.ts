import type { Cell, ThemeCandidate, WordSlot } from '@/types'
import { getSymmetricPartnerSlot } from '@/lib/grid'
import { loadAllWords } from '@/lib/wordDb'

export interface ThemeSearchOptions {
  minLength?: number
  maxLength?: number
  minScore?: number
  limit?: number
}

const DEFAULT_LENGTHS_15 = [9, 10, 11, 12, 13, 14, 15]
const DEFAULT_LENGTHS_21 = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

export async function searchThemeCandidates(
  concept: string,
  gridSize: 15 | 21,
  options: ThemeSearchOptions = {},
): Promise<ThemeCandidate[]> {
  const tokens = tokenizeConcept(concept)
  if (!tokens.length) return []

  const lengths = lengthsInRange(
    options.minLength ?? (gridSize === 15 ? 9 : 11),
    options.maxLength ?? gridSize,
  )
  const minScore = options.minScore ?? 50
  const limit = options.limit ?? 30
  const all = await loadAllWords()

  const scored: ThemeCandidate[] = []

  for (const entry of all) {
    if (entry.excluded) continue
    if (entry.score < minScore) continue
    if (!lengths.includes(entry.word.length)) continue
    if (entry.tags.includes('abbreviation')) continue

    const { score: matchScore, reason } = scoreThemeMatch(entry.word, entry.tags, tokens)
    if (matchScore <= 0) continue

    scored.push({
      word: entry.word,
      score: entry.score + matchScore,
      matchReason: reason,
      length: entry.word.length,
    })
  }

  return scored
    .sort((a, b) => b.score - a.score || b.length - a.length)
    .slice(0, limit)
}

export interface SymmetricHint {
  slotNumber: number
  direction: WordSlot['direction']
  partnerNumber: number | null
  partnerDirection: WordSlot['direction'] | null
  message: string
}

export function getSymmetricPlacementHint(
  grid: Cell[][],
  slot: WordSlot,
): SymmetricHint {
  const partner = getSymmetricPartnerSlot(grid, slot)
  if (!partner) {
    return {
      slotNumber: slot.number,
      direction: slot.direction,
      partnerNumber: null,
      partnerDirection: null,
      message: 'No symmetric partner slot at this position yet — place black squares first.',
    }
  }

  const sameCell = partner.row === slot.row && partner.col === slot.col
  if (sameCell) {
    return {
      slotNumber: slot.number,
      direction: slot.direction,
      partnerNumber: slot.number,
      partnerDirection: slot.direction,
      message: 'On-center slot — no symmetric pair needed.',
    }
  }

  return {
    slotNumber: slot.number,
    direction: slot.direction,
    partnerNumber: partner.number,
    partnerDirection: partner.direction,
    message: `Place matching theme entry at ${partner.direction} ${partner.number} (180° symmetric pair).`,
  }
}

function tokenizeConcept(concept: string): string[] {
  return concept
    .toLowerCase()
    .split(/[\s,;/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

function lengthsInRange(min: number, max: number): number[] {
  const out: number[] = []
  for (let l = min; l <= max; l++) out.push(l)
  return out
}

function scoreThemeMatch(
  word: string,
  tags: string[],
  tokens: string[],
): { score: number; reason: string } {
  const upper = word.toUpperCase()
  const lower = word.toLowerCase()
  let score = 0
  const reasons: string[] = []

  for (const token of tokens) {
    const tokenUpper = token.toUpperCase()
    if (upper.includes(tokenUpper)) {
      score += 30
      reasons.push(`contains "${token}"`)
    }
    for (const tag of tags) {
      if (tag === `domain:${token}`) {
        score += 40
        reasons.push(`domain:${token}`)
      } else if (tag.startsWith('domain:') && tag.slice(7).includes(token)) {
        score += 25
        reasons.push(tag)
      }
    }
    if (lower === token) {
      score += 50
      reasons.push('exact match')
    }
  }

  if (score > 0 && word.length >= 9) {
    score += 5
  }

  return {
    score,
    reason: reasons.length ? reasons.slice(0, 2).join(', ') : 'related',
  }
}

export function defaultThemeLengths(gridSize: 15 | 21): number[] {
  return gridSize === 15 ? [...DEFAULT_LENGTHS_15] : [...DEFAULT_LENGTHS_21]
}
