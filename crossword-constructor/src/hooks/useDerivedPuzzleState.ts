import { useMemo } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { validatePuzzle, getComplianceStatus } from '@/lib/validation'
import { computeStats, getWordAt } from '@/lib/grid'

/** Memoized validation issues — avoids unstable getSnapshot in Zustand selectors. */
export function useValidationIssues() {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const wordLookup = usePuzzleStore((s) => s.wordLookup)
  return useMemo(() => validatePuzzle(puzzle, wordLookup), [puzzle, wordLookup])
}

export function useComplianceStatus() {
  const issues = useValidationIssues()
  return useMemo(() => getComplianceStatus(issues), [issues])
}

export function usePuzzleStats() {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  return useMemo(
    () => computeStats(puzzle.grid, puzzle.target, puzzle.size),
    [puzzle.grid, puzzle.target, puzzle.size],
  )
}

export function useCurrentSlot() {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const selection = usePuzzleStore((s) => s.selection)
  return useMemo(() => {
    const slot = getWordAt(puzzle.grid, selection.row, selection.col, selection.direction)
    const number = puzzle.grid[selection.row]?.[selection.col]?.number ?? null
    return slot
      ? { ...slot, direction: selection.direction, number }
      : { cells: [], word: '', direction: selection.direction, number: null }
  }, [puzzle.grid, selection.row, selection.col, selection.direction])
}
