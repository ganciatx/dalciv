import type { Puzzle } from '@/types'
import { savePuzzleToLibrary } from '@/lib/puzzleLibrary'

const AUTOSAVE_KEY = 'cc-autosave'

/** Persist the active puzzle for crash recovery and the puzzle library. */
export function saveAutosave(puzzle: Puzzle): void {
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(puzzle))
  void savePuzzleToLibrary(puzzle)
}

export function loadAutosave(): Puzzle | null {
  const raw = localStorage.getItem(AUTOSAVE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Puzzle
  } catch {
    return null
  }
}

export function clearAutosave(): void {
  localStorage.removeItem(AUTOSAVE_KEY)
}

/** Save puzzle to library and download as JSON. */
export function savePuzzleFile(puzzle: Puzzle): void {
  void savePuzzleToLibrary(puzzle)
  const blob = new Blob([JSON.stringify(puzzle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${puzzle.title.replace(/[^a-z0-9]/gi, '_') || 'puzzle'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Clear autosave when it references a deleted library puzzle. */
export function clearAutosaveIfMatches(id: string): void {
  const autosave = loadAutosave()
  if (autosave?.id === id) clearAutosave()
}
