import { useEffect, useRef, type DragEvent } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import type { Direction } from '@/types'

export const WORD_DRAG_TYPE = 'application/x-cc-word'

/** Drag-and-drop handlers for the answer palette and grid drop targets. */
export function useWordDrag() {
  const beginWordDrag = usePuzzleStore((s) => s.beginWordDrag)
  const endWordDrag = usePuzzleStore((s) => s.endWordDrag)
  const setWordDragPreview = usePuzzleStore((s) => s.setWordDragPreview)
  const clearWordDragPreview = usePuzzleStore((s) => s.clearWordDragPreview)
  const placeWordAt = usePuzzleStore((s) => s.placeWordAt)
  const shiftHeldRef = useRef(false)
  const previewAnchorRef = useRef<{ row: number; col: number } | null>(null)

  function previewAt(row: number, col: number) {
    previewAnchorRef.current = { row, col }
    const { placementDirection } = usePuzzleStore.getState()
    const dir: Direction = shiftHeldRef.current
      ? (placementDirection === 'across' ? 'down' : 'across')
      : placementDirection
    setWordDragPreview(row, col, dir)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Shift' || shiftHeldRef.current) return
      shiftHeldRef.current = true
      if (previewAnchorRef.current) {
        previewAt(previewAnchorRef.current.row, previewAnchorRef.current.col)
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key !== 'Shift') return
      shiftHeldRef.current = false
      if (previewAnchorRef.current) {
        previewAt(previewAnchorRef.current.row, previewAnchorRef.current.col)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [setWordDragPreview])

  function onAnswerDragStart(e: DragEvent<HTMLElement>, word: string) {
    e.dataTransfer.setData(WORD_DRAG_TYPE, word)
    e.dataTransfer.effectAllowed = 'copy'
    shiftHeldRef.current = false
    previewAnchorRef.current = null
    beginWordDrag(word)
  }

  function onAnswerDragEnd() {
    shiftHeldRef.current = false
    previewAnchorRef.current = null
    endWordDrag()
  }

  function getCellDropHandlers(row: number, col: number) {
    return {
      onDragOver: (e: DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes(WORD_DRAG_TYPE)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        previewAt(row, col)
      },
      onDrop: (e: DragEvent<HTMLDivElement>) => {
        if (!e.dataTransfer.types.includes(WORD_DRAG_TYPE)) return
        e.preventDefault()
        const word = e.dataTransfer.getData(WORD_DRAG_TYPE)
        const preview = usePuzzleStore.getState().wordDragPreview
        const direction = preview?.direction ?? usePuzzleStore.getState().placementDirection
        placeWordAt(row, col, direction, word)
        endWordDrag()
      },
      onDragLeave: (e: DragEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        clearWordDragPreview()
        previewAnchorRef.current = null
      },
    }
  }

  function onGridDragLeave(e: DragEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    clearWordDragPreview()
    previewAnchorRef.current = null
  }

  return {
    onAnswerDragStart,
    onAnswerDragEnd,
    getCellDropHandlers,
    onGridDragLeave,
  }
}
