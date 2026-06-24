import type { Puzzle, PuzzleSummary } from '@/types'
import { getAppDb, PUZZLES_STORE } from '@/lib/appDb'

const MIGRATED_KEY = 'cc-library-migrated'
const AUTOSAVE_KEY = 'cc-autosave'

function loadAutosaveRaw(): Puzzle | null {
  const raw = localStorage.getItem(AUTOSAVE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Puzzle
  } catch {
    return null
  }
}

export function toPuzzleSummary(puzzle: Puzzle): PuzzleSummary {
  return {
    id: puzzle.id,
    title: puzzle.title,
    target: puzzle.target,
    size: puzzle.size,
    createdAt: puzzle.createdAt,
    updatedAt: puzzle.updatedAt,
  }
}

export async function listPuzzleSummaries(): Promise<PuzzleSummary[]> {
  const db = await getAppDb()
  const puzzles = await db.getAll(PUZZLES_STORE)
  return puzzles
    .map(toPuzzleSummary)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getPuzzleFromLibrary(id: string): Promise<Puzzle | undefined> {
  const db = await getAppDb()
  return db.get(PUZZLES_STORE, id)
}

export async function savePuzzleToLibrary(puzzle: Puzzle): Promise<void> {
  const db = await getAppDb()
  await db.put(PUZZLES_STORE, puzzle)
}

export async function deletePuzzleFromLibrary(id: string): Promise<void> {
  const db = await getAppDb()
  await db.delete(PUZZLES_STORE, id)
}

export async function renamePuzzleInLibrary(id: string, title: string): Promise<Puzzle | null> {
  const puzzle = await getPuzzleFromLibrary(id)
  if (!puzzle) return null

  const updated: Puzzle = {
    ...puzzle,
    title: title.trim() || 'Untitled Puzzle',
    updatedAt: new Date().toISOString(),
  }
  await savePuzzleToLibrary(updated)
  return updated
}

/** One-time import of autosave into the puzzle library for existing users. */
export async function migrateLegacyPuzzles(): Promise<void> {
  if (localStorage.getItem(MIGRATED_KEY)) return

  const autosave = loadAutosaveRaw()
  if (autosave) {
    const existing = await getPuzzleFromLibrary(autosave.id)
    if (!existing || existing.updatedAt < autosave.updatedAt) {
      await savePuzzleToLibrary(autosave)
    }
  }

  localStorage.setItem(MIGRATED_KEY, '1')
}

export async function ensureLibraryReady(): Promise<PuzzleSummary[]> {
  await migrateLegacyPuzzles()
  return listPuzzleSummaries()
}
