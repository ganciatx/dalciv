import { useRef, type DragEvent } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'

export const BLACK_SQUARE_DRAG_TYPE = 'application/x-cc-black-square'

/** Shared drag-and-drop handlers for the toolbar palette and grid drop targets. */
export function useBlackSquareDrag() {
  const beginBlackSquareDrag = usePuzzleStore((s) => s.beginBlackSquareDrag)
  const endBlackSquareDrag = usePuzzleStore((s) => s.endBlackSquareDrag)
  const paintBlackSquare = usePuzzleStore((s) => s.paintBlackSquare)
  const setBlackDragPreview = usePuzzleStore((s) => s.setBlackDragPreview)
  const clearBlackDragPreview = usePuzzleStore((s) => s.clearBlackDragPreview)
  const lastPaintedRef = useRef<string | null>(null)

  function onPaletteDragStart(e: DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData(BLACK_SQUARE_DRAG_TYPE, '1')
    e.dataTransfer.effectAllowed = 'copy'
    lastPaintedRef.current = null
    beginBlackSquareDrag()
  }

  function onPaletteDragEnd() {
    lastPaintedRef.current = null
    endBlackSquareDrag()
  }

  function paintAt(row: number, col: number) {
    const key = `${row},${col}`
    if (lastPaintedRef.current === key) return
    lastPaintedRef.current = key
    setBlackDragPreview(row, col)
    paintBlackSquare(row, col)
  }

  function getCellDropHandlers(row: number, col: number) {
    return {
      onDragOver: (e: DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes(BLACK_SQUARE_DRAG_TYPE)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        paintAt(row, col)
      },
      onDrop: (e: DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes(BLACK_SQUARE_DRAG_TYPE)) return
        e.preventDefault()
        paintAt(row, col)
        endBlackSquareDrag()
      },
      onDragLeave: (e: DragEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        clearBlackDragPreview()
      },
    }
  }

  function onGridDragLeave(e: DragEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    clearBlackDragPreview()
  }

  return {
    onPaletteDragStart,
    onPaletteDragEnd,
    getCellDropHandlers,
    onGridDragLeave,
  }
}
