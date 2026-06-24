import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/puzzleLibrary', () => ({
  savePuzzleToLibrary: vi.fn().mockResolvedValue(undefined),
}))

import {
  saveAutosave,
  loadAutosave,
  clearAutosaveIfMatches,
} from '@/lib/persistence'
import { createPuzzle } from '@/lib/grid'

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('autosave writes to localStorage', () => {
    const puzzle = createPuzzle()
    saveAutosave(puzzle)
    expect(loadAutosave()?.id).toBe(puzzle.id)
  })

  it('clearAutosaveIfMatches removes matching autosave', () => {
    const puzzle = createPuzzle()
    saveAutosave(puzzle)
    clearAutosaveIfMatches(puzzle.id)
    expect(loadAutosave()).toBeNull()
  })

  it('clearAutosaveIfMatches ignores non-matching id', () => {
    const puzzle = createPuzzle()
    saveAutosave(puzzle)
    clearAutosaveIfMatches('other-id')
    expect(loadAutosave()?.id).toBe(puzzle.id)
  })
})
