import { useEffect, useState } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { useCurrentSlot } from '@/hooks/useDerivedPuzzleState'
import { searchFillCandidates } from '@/lib/fillAssist'
import { DictionaryLookupPanel } from '@/components/words/DictionaryLookupPanel'
import { help } from '@/lib/helpContent'
import type { FillCandidate } from '@/types'

export function WordEntryPanel() {
  const fillCurrentWord = usePuzzleStore((s) => s.fillCurrentWord)
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const slot = useCurrentSlot()
  const [fetchState, setFetchState] = useState<{ key: string; results: FillCandidate[] }>({
    key: '',
    results: [],
  })
  const [minScore, setMinScore] = useState(40)
  const [fillRefresh, setFillRefresh] = useState(0)

  const canSearch = Boolean(slot.word && slot.word.length >= 3 && slot.cells.length)
  const slotKey = canSearch
    ? `${slot.word}|${slot.cells[0].row}|${slot.cells[0].col}|${slot.direction}|${minScore}|${fillRefresh}`
    : ''

  const slotComplete = canSearch && !slot.word.includes('?')
  const slotWord = slotComplete ? slot.word.toUpperCase() : ''

  useEffect(() => {
    if (!canSearch) return
    let cancelled = false
    const fullSlot = {
      number: slot.number ?? 0,
      direction: slot.direction,
      row: slot.cells[0].row,
      col: slot.cells[0].col,
      length: slot.cells.length,
      word: slot.word,
      cells: slot.cells,
    }
    void searchFillCandidates(puzzle.grid, fullSlot, { minScore, limit: 20 }).then((results) => {
      if (cancelled) return
      setFetchState({ key: slotKey, results })
    })
    return () => { cancelled = true }
  }, [canSearch, slotKey, slot, minScore, puzzle.grid, fillRefresh])

  const results = canSearch && fetchState.key === slotKey ? fetchState.results : []
  const showDictionaryLookup = slotComplete && results.length === 0

  if (!slot.cells.length) {
    return (
      <div className="app-panel-pad text-sm text-app-subtle">
        Select a white cell to see word suggestions.
      </div>
    )
  }

  return (
    <div className="app-panel-pad">
      <h3 className="app-heading mb-2">
        {slot.direction === 'across' ? 'Across' : 'Down'}
        {slot.number ? ` ${slot.number}` : ''}
      </h3>
      <p className="mb-3 font-mono text-lg tracking-widest">{slot.word}</p>

      <label className="mb-3 flex items-center gap-2 text-sm text-app-muted" title={help.grid.wordEntry.minScore}>
        Min score: {minScore}
        <input
          type="range"
          min={1}
          max={100}
          value={minScore}
          title={help.grid.wordEntry.minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="flex-1"
        />
      </label>

      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {results.map((r) => (
          <li key={r.word}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-app-tint"
              title={help.grid.wordEntry.applySuggestion}
              onClick={() => fillCurrentWord(r.word)}
            >
              <span className="font-mono font-medium">{r.word}</span>
              <span className="text-xs text-app-subtle">
                {Math.round(r.adjustedScore)}
                {r.tags.length ? ` · ${r.tags.join(', ')}` : ''}
              </span>
            </button>
          </li>
        ))}
        {!results.length && !showDictionaryLookup && (
          <li className="text-sm text-app-subtle">No matches for this pattern.</li>
        )}
      </ul>

      {showDictionaryLookup && (
        <div className="mt-4 border-t border-app-border pt-4" title={help.grid.wordEntry.dictionaryLookup}>
          <p className="mb-2 text-xs text-app-subtle">
            No local matches for <span className="font-mono font-medium">{slotWord}</span>.
          </p>
          <DictionaryLookupPanel
            compact
            initialWord={slotWord}
            onImported={() => setFillRefresh((n) => n + 1)}
          />
        </div>
      )}
    </div>
  )
}
