import { useEffect, useCallback } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { saveAutosave } from '@/lib/persistence'

export function useAutosave() {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const workspace = usePuzzleStore((s) => s.workspace)

  const save = useCallback(() => {
    if (workspace === 'home') return
    saveAutosave(puzzle)
  }, [puzzle, workspace])

  useEffect(() => {
    if (workspace === 'home') return
    const interval = setInterval(save, 30000)
    return () => clearInterval(interval)
  }, [save, workspace])

  useEffect(() => {
    save()
  }, [puzzle.grid, puzzle.clues, puzzle.title, puzzle.target, puzzle.themeConcept, puzzle.themeSlotNumbers, puzzle.answerBank, save])
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const store = usePuzzleStore.getState()
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        store.redo()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        import('@/lib/persistence').then(({ savePuzzleFile }) => savePuzzleFile(store.puzzle))
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        store.setShowExport(true)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        store.setShowAssist(!store.showAssist)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '?') {
        e.preventDefault()
        store.setShowGuidance(!store.showGuidance)
        return
      }
      if (e.key === 'F1') {
        e.preventDefault()
        store.setShowGuidance(!store.showGuidance)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && isInput) {
        e.preventDefault()
        store.setWorkspace('grid')
        return
      }

      if (store.workspace !== 'grid' || isInput) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          store.moveCursor(-1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          store.moveCursor(1, 0)
          break
        case 'ArrowLeft':
          e.preventDefault()
          store.moveCursor(0, -1)
          break
        case 'ArrowRight':
          e.preventDefault()
          store.moveCursor(0, 1)
          break
        case 'Tab':
          e.preventDefault()
          store.tabToNext(e.shiftKey)
          break
        case 'Backspace':
          e.preventDefault()
          store.clearLetter(true)
          break
        case 'Delete':
          e.preventDefault()
          store.clearLetter(false)
          break
        case ' ':
          e.preventDefault()
          store.toggleBlack(store.selection.row, store.selection.col)
          break
        default:
          if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
            e.preventDefault()
            store.setLetter(e.key)
          }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
