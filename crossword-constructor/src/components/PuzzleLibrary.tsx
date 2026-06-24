import { useCallback, useEffect, useState } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import {
  deletePuzzleFromLibrary,
  ensureLibraryReady,
  getPuzzleFromLibrary,
  renamePuzzleInLibrary,
} from '@/lib/puzzleLibrary'
import { clearAutosaveIfMatches } from '@/lib/persistence'
import { help } from '@/lib/helpContent'
import type { PuzzleSummary } from '@/types'

export function PuzzleLibrary() {
  const setPuzzle = usePuzzleStore((s) => s.setPuzzle)
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setPuzzles(await ensureLibraryReady())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void ensureLibraryReady().then((list) => {
      if (!cancelled) {
        setPuzzles(list)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  async function handleOpen(id: string) {
    const puzzle = await getPuzzleFromLibrary(id)
    if (puzzle) setPuzzle(puzzle)
  }

  async function handleDelete(summary: PuzzleSummary) {
    const confirmed = window.confirm(
      `Delete "${summary.title}"? This cannot be undone.`,
    )
    if (!confirmed) return

    await deletePuzzleFromLibrary(summary.id)
    clearAutosaveIfMatches(summary.id)
    if (editingId === summary.id) setEditingId(null)
    await refresh()
  }

  function startRename(summary: PuzzleSummary) {
    setEditingId(summary.id)
    setEditTitle(summary.title)
  }

  async function commitRename(id: string) {
    await renamePuzzleInLibrary(id, editTitle)
    setEditingId(null)
    await refresh()
  }

  function cancelRename() {
    setEditingId(null)
    setEditTitle('')
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Puzzles</h2>
        {!loading && (
          <span className="text-sm text-app-subtle">{puzzles.length} saved</span>
        )}
      </div>

      {loading && (
        <p className="text-sm text-app-subtle">Loading puzzles…</p>
      )}

      {!loading && puzzles.length === 0 && (
        <div className="rounded-lg border border-dashed border-app-border bg-white px-4 py-8 text-center text-sm text-app-subtle">
          No saved puzzles yet. Create a new puzzle above, or open a .json / .puz file from the editor.
        </div>
      )}

      {!loading && puzzles.length > 0 && (
        <ul className="divide-y divide-app-border rounded-lg border border-app-border bg-white">
          {puzzles.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              {editingId === p.id ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void commitRename(p.id)
                  }}
                >
                  <input
                    type="text"
                    className="min-w-0 flex-1 rounded border border-app-border px-2 py-1"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    maxLength={120}
                  />
                  <button
                    type="submit"
                    className="rounded bg-app-accent px-2 py-1 text-xs text-white hover:bg-app-accent-hover"
                    title={help.home.saveRename}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="rounded bg-app-warm px-2 py-1 text-xs hover:bg-app-border"
                    title={help.home.cancelRename}
                    onClick={cancelRename}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-left font-medium text-app-fg hover:text-app-accent"
                    title={help.home.openPuzzle}
                    onClick={() => void handleOpen(p.id)}
                  >
                    {p.title}
                  </button>
                  <span className="rounded bg-app-warm px-1.5 py-0.5 text-xs text-app-muted">
                    {p.size}×{p.size}
                  </span>
                  <span className="rounded bg-app-warm px-1.5 py-0.5 text-xs text-app-muted">
                    {p.target}
                  </span>
                  <span className="text-xs text-app-subtle">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-xs text-app-muted hover:bg-app-warm"
                      title={help.home.renamePuzzle}
                      onClick={() => startRename(p)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      title={help.home.deletePuzzle}
                      onClick={() => void handleDelete(p)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
