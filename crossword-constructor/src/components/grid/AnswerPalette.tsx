import { useState } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { normalizeAnswerWord } from '@/lib/grid'
import { useWordDrag } from '@/hooks/useWordDrag'
import { help } from '@/lib/helpContent'
import type { Direction } from '@/types'

const EMPTY_ANSWER_BANK: string[] = []

export function AnswerPalette() {
  const answerBank = usePuzzleStore((s) => s.puzzle.answerBank ?? EMPTY_ANSWER_BANK)
  const placementDirection = usePuzzleStore((s) => s.placementDirection)
  const addAnswer = usePuzzleStore((s) => s.addAnswer)
  const removeAnswer = usePuzzleStore((s) => s.removeAnswer)
  const setPlacementDirection = usePuzzleStore((s) => s.setPlacementDirection)
  const { onAnswerDragStart, onAnswerDragEnd } = useWordDrag()
  const [draft, setDraft] = useState('')

  function handleAdd() {
    const word = normalizeAnswerWord(draft)
    if (!word) return
    addAnswer(word)
    setDraft('')
  }

  return (
    <aside className="app-panel-pad flex w-56 shrink-0 flex-col gap-3 overflow-y-auto" title={help.grid.answers.dragWord}>
      <div>
        <h3 className="font-semibold text-app-fg">Answers</h3>
        <p className="mt-1 text-xs text-app-subtle">
          Drag onto the grid. Drop cell = first letter. Hold Shift to flip direction.
        </p>
      </div>

      <div className="flex gap-1 rounded bg-app-warm p-1">
        {(['across', 'down'] as Direction[]).map((dir) => (
          <button
            key={dir}
            type="button"
            title={dir === 'across' ? help.grid.answers.across : help.grid.answers.down}
            className={`flex-1 rounded px-2 py-1 text-xs font-medium capitalize ${
              placementDirection === dir ? 'bg-white text-app-fg shadow-sm' : 'text-app-muted'
            }`}
            onClick={() => setPlacementDirection(dir)}
          >
            {dir}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        <input
          type="text"
          className="min-w-0 flex-1 rounded border border-app-border px-2 py-1.5 font-mono text-sm uppercase"
          placeholder="Add word..."
          title={help.grid.answers.addInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <button
          type="button"
          className="rounded bg-app-accent px-2 py-1 text-sm text-white hover:bg-app-accent-hover"
          title={help.grid.answers.addButton}
          onClick={handleAdd}
        >
          Add
        </button>
      </div>

      {answerBank.length === 0 ? (
        <p className="text-sm text-app-subtle">
          No answers yet. Type a word above or add from Assist theme suggestions.
        </p>
      ) : (
        <ul className="max-h-[calc(100vh-280px)] space-y-1 overflow-y-auto">
          {answerBank.map((word) => (
            <li key={word} className="group flex items-center gap-1">
              <div
                draggable
                role="button"
                aria-label={`Drag ${word} onto grid`}
                title={help.grid.answers.dragWord}
                className="flex min-w-0 flex-1 cursor-grab items-center justify-between rounded border border-app-border bg-app-warm px-2 py-1.5 active:cursor-grabbing hover:border-[#bfdbfe] hover:bg-app-tint"
                onDragStart={(e) => onAnswerDragStart(e, word)}
                onDragEnd={onAnswerDragEnd}
              >
                <span className="truncate font-mono text-sm font-medium">{word}</span>
                <span className="ml-2 shrink-0 text-xs text-app-subtle">{word.length}L</span>
              </div>
              <button
                type="button"
                className="shrink-0 rounded px-1.5 py-1 text-xs text-app-subtle opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                aria-label={`Remove ${word}`}
                title={help.grid.answers.removeWord}
                onClick={() => removeAnswer(word)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
