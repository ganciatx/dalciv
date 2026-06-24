import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEmptyGrid, createPuzzle, fillWordInGrid, getSymmetricPartnerSlot, recalculateNumbers, symmetricSlotStart } from '@/lib/grid'
import { searchFillCandidates } from '@/lib/fillAssist'
import { searchThemeCandidates } from '@/lib/themeAssist'
import { exportJson, importJson } from '@/lib/export'
import type { WordEntry } from '@/types'

vi.mock('@/lib/wordDb', () => ({
  searchWords: vi.fn(),
  loadAllWords: vi.fn(),
}))

import { searchWords, loadAllWords } from '@/lib/wordDb'

const mockSearchWords = vi.mocked(searchWords)
const mockLoadAllWords = vi.mocked(loadAllWords)

describe('symmetric slot helpers', () => {
  it('computes symmetric across start', () => {
    expect(symmetricSlotStart(2, 3, 5, 'across', 15)).toEqual({ row: 12, col: 7 })
  })

  it('computes symmetric down start', () => {
    expect(symmetricSlotStart(2, 3, 5, 'down', 15)).toEqual({ row: 8, col: 11 })
  })

  it('finds symmetric partner slot on empty grid', () => {
    let grid = createEmptyGrid(15)
    grid[0][5].isBlack = true
    grid[14][9].isBlack = true
    grid = recalculateNumbers(grid)

    const slot = {
      number: grid[0][0].number!,
      direction: 'across' as const,
      row: 0,
      col: 0,
      length: 5,
      word: '?????',
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }],
    }
    const partner = getSymmetricPartnerSlot(grid, slot)
    expect(partner).not.toBeNull()
    expect(partner!.row).toBe(14)
    expect(partner!.col).toBe(10)
    expect(partner!.length).toBe(5)
  })
})

describe('searchFillCandidates', () => {
  beforeEach(() => {
    mockSearchWords.mockReset()
  })

  it('ranks duplicates lower than fresh words', async () => {
    let grid = createEmptyGrid(15)
    grid[0][3].isBlack = true
    grid[1][3].isBlack = true
    grid = recalculateNumbers(grid)
    grid = fillWordInGrid(grid, [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    ], 'CAT')

    mockSearchWords.mockResolvedValue([
      { word: 'CAT', score: 80, tags: [], excluded: false },
      { word: 'CAR', score: 75, tags: [], excluded: false },
    ])

    const slot = {
      number: 2,
      direction: 'across' as const,
      row: 2,
      col: 0,
      length: 3,
      word: '???',
      cells: [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
    }

    const results = await searchFillCandidates(grid, slot, { limit: 5 })
    expect(results[0].word).toBe('CAR')
    expect(results.find((r) => r.word === 'CAT')!.adjustedScore).toBeLessThan(results[0].adjustedScore)
  })

  it('penalizes crosswordese', async () => {
    mockSearchWords.mockResolvedValue([
      { word: 'ETUI', score: 70, tags: ['crosswordese'], excluded: false },
      { word: 'EAST', score: 65, tags: [], excluded: false },
    ])

    const grid = recalculateNumbers(createEmptyGrid(15))
    const slot = {
      number: 1,
      direction: 'across' as const,
      row: 0,
      col: 0,
      length: 4,
      word: '????',
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
    }

    const results = await searchFillCandidates(grid, slot, { limit: 5 })
    expect(results[0].word).toBe('EAST')
  })
})

describe('searchThemeCandidates', () => {
  beforeEach(() => {
    mockLoadAllWords.mockReset()
  })

  it('matches concept tokens in word text', async () => {
    const entries: WordEntry[] = [
      { word: 'OCEAN', score: 70, tags: [], excluded: false },
      { word: 'TABLE', score: 80, tags: [], excluded: false },
      { word: 'ATLANTIC', score: 60, tags: ['domain:geography'], excluded: false },
    ]
    mockLoadAllWords.mockResolvedValue(entries)

    const results = await searchThemeCandidates('ocean', 15, { minLength: 5, maxLength: 15 })
    expect(results.some((r) => r.word === 'OCEAN')).toBe(true)
    expect(results.some((r) => r.word === 'TABLE')).toBe(false)
  })

  it('matches domain tags', async () => {
    const entries: WordEntry[] = [
      { word: 'BEATLES', score: 55, tags: ['proper_noun', 'domain:music'], excluded: false },
      { word: 'CHAIR', score: 80, tags: [], excluded: false },
    ]
    mockLoadAllWords.mockResolvedValue(entries)

    const results = await searchThemeCandidates('music', 15, { minLength: 5, maxLength: 15, minScore: 40 })
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].word).toBe('BEATLES')
  })
})

describe('theme metadata persistence', () => {
  it('round-trips theme fields through JSON export', () => {
    const puzzle = createPuzzle()
    puzzle.themeConcept = 'spring flowers'
    puzzle.themeSlotNumbers = [3, 14]

    const restored = importJson(exportJson(puzzle))
    expect(restored.themeConcept).toBe('spring flowers')
    expect(restored.themeSlotNumbers).toEqual([3, 14])
  })
})
