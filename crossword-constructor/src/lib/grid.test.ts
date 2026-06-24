import { describe, it, expect } from 'vitest'
import {
  createEmptyGrid,
  recalculateNumbers,
  hasRotationalSymmetry,
  checkInterlock,
  extractAllSlots,
  getMaxWordCount,
  symmetricPosition,
  blackSquarePositions,
  setCellsBlack,
  getStem,
} from '@/lib/grid'
import { validatePuzzle, getComplianceStatus } from '@/lib/validation'
import { createPuzzle } from '@/lib/grid'

describe('grid numbering', () => {
  it('numbers cells that start across or down words', () => {
    let grid = createEmptyGrid(5)
    grid[0][0].isBlack = true
    grid = recalculateNumbers(grid)
    expect(grid[0][1].number).toBe(1)
  })
})

describe('symmetry', () => {
  it('detects symmetric grids', () => {
    const grid = createEmptyGrid(5)
    grid[0][0].isBlack = true
    grid[4][4].isBlack = true
    expect(hasRotationalSymmetry(grid)).toBe(true)
  })

  it('detects asymmetric grids', () => {
    const grid = createEmptyGrid(5)
    grid[0][0].isBlack = true
    expect(hasRotationalSymmetry(grid)).toBe(false)
  })

  it('computes symmetric positions', () => {
    expect(symmetricPosition(0, 0, 15)).toEqual({ row: 14, col: 14 })
  })
})

describe('interlock', () => {
  it('passes for connected white cells', () => {
    const grid = createEmptyGrid(5)
    expect(checkInterlock(grid)).toBe(true)
  })

  it('fails for isolated regions', () => {
    const grid = createEmptyGrid(5)
    for (let c = 0; c < 5; c++) grid[2][c].isBlack = true
    expect(checkInterlock(grid)).toBe(false)
  })
})

describe('word count', () => {
  it('returns 78 for 15x15 NYT', () => {
    expect(getMaxWordCount('NYT', 15)).toBe(78)
  })

  it('returns 140 for 21x21', () => {
    expect(getMaxWordCount('WSJ', 21)).toBe(140)
  })
})

describe('black square placement', () => {
  it('returns symmetric pair for non-center cells', () => {
    const positions = blackSquarePositions(0, 0, 15, true)
    expect(positions).toEqual([
      { row: 0, col: 0 },
      { row: 14, col: 14 },
    ])
  })

  it('returns single cell for grid center when size is odd', () => {
    const positions = blackSquarePositions(7, 7, 15, true)
    expect(positions).toEqual([{ row: 7, col: 7 }])
  })

  it('skips symmetric partner when symmetry is disabled', () => {
    expect(blackSquarePositions(0, 0, 15, false)).toEqual([{ row: 0, col: 0 }])
  })

  it('setCellsBlack clears letters when blackening', () => {
    let grid = createEmptyGrid(3)
    grid[1][1].letter = 'A'
    grid = setCellsBlack(grid, [{ row: 1, col: 1 }], true)
    expect(grid[1][1].isBlack).toBe(true)
    expect(grid[1][1].letter).toBeNull()
  })
})

describe('stem detection', () => {
  it('strips trailing S', () => {
    expect(getStem('RUNS')).toBe('RUN')
  })
})

describe('validation', () => {
  it('flags symmetry errors', () => {
    const puzzle = createPuzzle(15, 'NYT')
    puzzle.grid[0][0].isBlack = true
    const issues = validatePuzzle(puzzle, new Map())
    expect(issues.some((i) => i.id === 'SYMMETRY')).toBe(true)
    expect(getComplianceStatus(issues)).toBe('error')
  })
})

describe('pattern search logic', () => {
  it('extracts slots from filled grid', () => {
    const grid = createEmptyGrid(5)
    for (let c = 1; c < 4; c++) grid[2][c].letter = 'CAT'[c - 1]
    const numbered = recalculateNumbers(grid)
    const slots = extractAllSlots(numbered)
    expect(slots.some((s) => s.word.includes('CAT'))).toBe(true)
  })
})
