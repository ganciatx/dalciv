import { useMemo, useRef } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { extractAllSlots } from '@/lib/grid'
import { searchClues } from '@/lib/clues'
import { help } from '@/lib/helpContent'
import type { Direction } from '@/types'

export function CluesWorkspace() {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const setTitle = usePuzzleStore((s) => s.setTitle)
  const setClue = usePuzzleStore((s) => s.setClue)
  const setWorkspace = usePuzzleStore((s) => s.setWorkspace)
  const selectCell = usePuzzleStore((s) => s.selectCell)

  const slots = useMemo(() => extractAllSlots(puzzle.grid), [puzzle.grid])
  const across = slots.filter((s) => s.direction === 'across' && !s.word.includes('?'))
  const down = slots.filter((s) => s.direction === 'down' && !s.word.includes('?'))

  const acrossComplete = across.filter((s) => puzzle.clues.across[s.number]?.trim()).length
  const downComplete = down.filter((s) => puzzle.clues.down[s.number]?.trim()).length

  const allClueTexts = [...Object.values(puzzle.clues.across), ...Object.values(puzzle.clues.down)]
    .filter(Boolean)
  const duplicateClues = allClueTexts.filter((c, i, arr) => arr.indexOf(c) !== i && c.trim())

  return (
    <div className="app-workspace mx-auto max-w-6xl space-y-4 p-6">
      {puzzle.target === 'WSJ' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <label className="block text-sm font-medium text-amber-900" title={help.clues.wsjTitle}>
            Puzzle Title (required for WSJ)
          </label>
          <input
            type="text"
            maxLength={60}
            className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
            title={help.clues.wsjTitle}
            value={puzzle.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title should not duplicate any theme answer"
          />
          <p className="mt-1 text-xs text-amber-700">{puzzle.title.length}/60 characters</p>
        </div>
      )}

      <div className="flex gap-4 text-sm text-app-muted">
        <span>Across: {acrossComplete}/{across.length} clues</span>
        <span>Down: {downComplete}/{down.length} clues</span>
      </div>

      {duplicateClues.length > 0 && (
        <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          Duplicate clue text detected — consider varying your wording.
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <ClueColumn
          title="Across"
          slots={across}
          clues={puzzle.clues.across}
          direction="across"
          onClueChange={(n, t) => setClue('across', n, t)}
          onJumpToCell={(row, col) => {
            setWorkspace('grid')
            selectCell(row, col)
          }}
        />
        <ClueColumn
          title="Down"
          slots={down}
          clues={puzzle.clues.down}
          direction="down"
          onClueChange={(n, t) => setClue('down', n, t)}
          onJumpToCell={(row, col) => {
            setWorkspace('grid')
            selectCell(row, col)
          }}
        />
      </div>
    </div>
  )
}

function ClueColumn({
  title,
  slots,
  clues,
  direction,
  onClueChange,
  onJumpToCell,
}: {
  title: string
  slots: ReturnType<typeof extractAllSlots>
  clues: Record<number, string>
  direction: Direction
  onClueChange: (num: number, text: string) => void
  onJumpToCell: (row: number, col: number) => void
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  return (
    <div className="app-panel">
      <h3 className="app-heading border-b border-app-border px-4 py-2">{title}</h3>
      <ul className="max-h-[calc(100vh-280px)] divide-y divide-app-border overflow-y-auto">
        {slots.map((slot, idx) => {
          const clueText = clues[slot.number] ?? ''
          const empty = !clueText.trim()
          const hasWordplay = /\b(pun|play on|sounds like)\b/i.test(clueText)
          const needsQuestion = hasWordplay && !clueText.trimEnd().endsWith('?')
          const answerHasAbbr = slot.word.includes('.')

          return (
            <li key={`${direction}-${slot.number}`} className="flex gap-2 px-3 py-2 text-sm">
              <span className="w-6 shrink-0 pt-2 font-medium text-app-subtle">{slot.number}</span>
              <span className="w-24 shrink-0 pt-2 font-mono text-app-muted">{slot.word}</span>
              <div className="min-w-0 flex-1">
                <input
                  ref={(el) => { refs.current[idx] = el }}
                  type="text"
                  className={`w-full rounded border px-2 py-1 ${empty ? 'border-red-300 bg-red-50' : 'border-app-border'}`}
                  title={help.clues.clueInput}
                  value={clueText}
                  onChange={(e) => onClueChange(slot.number, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      const next = e.shiftKey ? idx - 1 : idx + 1
                      refs.current[next]?.focus()
                    }
                    if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
                      e.preventDefault()
                      onJumpToCell(slot.row, slot.col)
                    }
                  }}
                  placeholder="Enter clue..."
                />
                {needsQuestion && (
                  <p className="mt-0.5 text-xs text-app-accent">Consider adding ? for wordplay clues</p>
                )}
                {answerHasAbbr && (
                  <p className="mt-0.5 text-xs text-app-accent">Answer has abbreviation — consider &quot;Abbr.&quot; in clue</p>
                )}
                <ClueLookup answer={slot.word} onCopy={(c) => onClueChange(slot.number, c)} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ClueLookup({ answer, onCopy }: { answer: string; onCopy: (clue: string) => void }) {
  const matches = searchClues(answer)
  if (!matches.length) return null

  return (
    <details className="mt-1 text-xs text-app-subtle" title={help.clues.pastClues}>
      <summary>{matches.length} past clue(s)</summary>
      <ul className="mt-1 space-y-0.5">
        {matches.slice(0, 5).map((m, i) => (
          <li key={i}>
            <button type="button" className="text-left hover:text-app-accent" title={help.clues.copyClue} onClick={() => onCopy(m.clue)}>
              {m.clue}
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
