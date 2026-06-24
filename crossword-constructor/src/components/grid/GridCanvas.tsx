import { usePuzzleStore } from '@/stores/puzzleStore'
import { extractAllSlots, getWordAt } from '@/lib/grid'
import { useBlackSquareDrag } from '@/hooks/useBlackSquareDrag'
import { useWordDrag } from '@/hooks/useWordDrag'
import { help } from '@/lib/helpContent'
import type { DragEvent } from 'react'

interface GridCanvasProps {
  cellSize: number
}

function mergeDragHandlers(
  black: ReturnType<ReturnType<typeof useBlackSquareDrag>['getCellDropHandlers']>,
  word: ReturnType<ReturnType<typeof useWordDrag>['getCellDropHandlers']>,
) {
  return {
    onDragOver: (e: DragEvent<HTMLDivElement>) => {
      black.onDragOver(e)
      word.onDragOver(e)
    },
    onDrop: (e: DragEvent<HTMLDivElement>) => {
      black.onDrop(e)
      word.onDrop(e)
    },
    onDragLeave: (e: DragEvent<HTMLDivElement>) => {
      black.onDragLeave(e)
      word.onDragLeave(e)
    },
  }
}

export function GridCanvas({ cellSize }: GridCanvasProps) {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const selection = usePuzzleStore((s) => s.selection)
  const symmetryHighlight = usePuzzleStore((s) => s.symmetryHighlight)
  const blackDragPreview = usePuzzleStore((s) => s.blackDragPreview)
  const blackDragActive = usePuzzleStore((s) => s.blackDragActive)
  const wordDragPreview = usePuzzleStore((s) => s.wordDragPreview)
  const wordDragActive = usePuzzleStore((s) => s.wordDragActive)
  const symmetryEnabled = usePuzzleStore((s) => s.symmetryEnabled)
  const wordLookup = usePuzzleStore((s) => s.wordLookup)
  const themeSlotNumbers = puzzle.themeSlotNumbers ?? []
  const selectCell = usePuzzleStore((s) => s.selectCell)
  const toggleBlack = usePuzzleStore((s) => s.toggleBlack)
  const blackSquareDrag = useBlackSquareDrag()
  const wordDrag = useWordDrag()

  const highlightCells = new Set<string>()
  const slot = getWordAt(puzzle.grid, selection.row, selection.col, selection.direction)
  slot?.cells.forEach((c) => highlightCells.add(`${c.row},${c.col}`))

  const themeCells = new Set<string>()
  if (themeSlotNumbers.length) {
    for (const s of extractAllSlots(puzzle.grid)) {
      if (themeSlotNumbers.includes(s.number)) {
        s.cells.forEach((c) => themeCells.add(`${c.row},${c.col}`))
      }
    }
  }

  const blackPreviewCells = new Set(blackDragPreview?.map((p) => `${p.row},${p.col}`) ?? [])
  const wordPreviewCells = new Map<string, string>()
  if (wordDragPreview) {
    wordDragPreview.cells.forEach((c, i) => {
      wordPreviewCells.set(`${c.row},${c.col}`, wordDragPreview.word[i])
    })
  }

  function getScoreClass(row: number, col: number): string {
    const across = getWordAt(puzzle.grid, row, col, 'across')
    const down = getWordAt(puzzle.grid, row, col, 'down')
    const words = [across?.word, down?.word].filter((w) => w && !w.includes('?')) as string[]
    if (!words.length) return ''

    let minScore = 101
    let found = false
    for (const w of words) {
      const entry = wordLookup.get(w.toUpperCase())
      if (entry) {
        found = true
        minScore = Math.min(minScore, entry.score)
      }
    }
    if (!found) return 'score-gray'
    if (minScore >= 70) return 'score-green'
    if (minScore >= 40) return 'score-yellow'
    return 'score-red'
  }

  function isSymmetryViolation(row: number, col: number): boolean {
    if (symmetryEnabled) return false
    const sym = { row: puzzle.size - 1 - row, col: puzzle.size - 1 - col }
    return puzzle.grid[row][col].isBlack !== puzzle.grid[sym.row][sym.col].isBlack
  }

  function handleGridDragLeave(e: DragEvent<HTMLDivElement>) {
    blackSquareDrag.onGridDragLeave(e)
    wordDrag.onGridDragLeave(e)
  }

  return (
    <div
      className="inline-grid border-2 border-app-fg bg-app-fg"
      title={help.grid.canvas}
      style={{
        gridTemplateColumns: `repeat(${puzzle.size}, ${cellSize}px)`,
        gap: 0,
      }}
      onDragLeave={handleGridDragLeave}
    >
      {puzzle.grid.map((row, ri) =>
        row.map((cell, ci) => {
          const key = `${ri},${ci}`
          const isSelected = selection.row === ri && selection.col === ci
          const isHighlight = highlightCells.has(key)
          const isSymHighlight = symmetryHighlight?.some((p) => p.row === ri && p.col === ci)
          const isBlackDropPreview = blackDragActive && blackPreviewCells.has(key)
          const ghostLetter = wordPreviewCells.get(key)
          const isWordDropPreview = wordDragActive && ghostLetter !== undefined
          const isTheme = themeCells.has(key) && !isSelected
          const scoreClass = !cell.isBlack && !isSelected && !isBlackDropPreview && !isWordDropPreview && !isTheme
            ? getScoreClass(ri, ci)
            : ''
          const dropHandlers = mergeDragHandlers(
            blackSquareDrag.getCellDropHandlers(ri, ci),
            wordDrag.getCellDropHandlers(ri, ci),
          )

          const displayLetter = !cell.isBlack
            ? (cell.isRebus
              ? <span className="rebus-label">{cell.rebusValue}</span>
              : (cell.letter ?? (isWordDropPreview ? <span className="word-ghost-letter">{ghostLetter}</span> : '')))
            : null

          return (
            <div
              key={key}
              className={[
                'grid-cell',
                cell.isBlack ? 'black' : 'white',
                isSelected ? 'selected' : '',
                isHighlight && !isSelected ? 'highlight' : '',
                isSymHighlight ? 'highlight' : '',
                isBlackDropPreview ? 'drop-preview' : '',
                isWordDropPreview
                  ? (wordDragPreview?.valid ? 'word-drop-preview-valid' : 'word-drop-preview-invalid')
                  : '',
                isSymmetryViolation(ri, ci) ? 'symmetry-violation' : '',
                isTheme ? 'theme-slot' : '',
                scoreClass,
              ].filter(Boolean).join(' ')}
              style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.45 }}
              onClick={() => {
                if (cell.isBlack) toggleBlack(ri, ci)
                else selectCell(ri, ci, true)
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                toggleBlack(ri, ci)
              }}
              {...dropHandlers}
            >
              {!cell.isBlack && cell.number && (
                <span className="grid-cell-number">{cell.number}</span>
              )}
              {displayLetter}
            </div>
          )
        }),
      )}
    </div>
  )
}
