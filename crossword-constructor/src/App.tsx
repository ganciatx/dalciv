import { useEffect } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { ensureWordListLoaded, loadAllWords } from '@/lib/wordDb'
import { useAutosave, useKeyboardShortcuts } from '@/hooks/useAppHooks'
import { NavBar } from '@/components/NavBar'
import { HomeScreen } from '@/components/HomeScreen'
import { GridWorkspace } from '@/components/grid/GridWorkspace'
import { WordsWorkspace } from '@/components/words/WordsWorkspace'
import { CluesWorkspace } from '@/components/clues/CluesWorkspace'
import { GuidanceSidebar } from '@/components/GuidanceSidebar'
import { ExportModal } from '@/components/ExportModal'

export default function App() {
  const workspace = usePuzzleStore((s) => s.workspace)
  const setWordLookup = usePuzzleStore((s) => s.setWordLookup)
  const setWordsLoaded = usePuzzleStore((s) => s.setWordsLoaded)
  const wordsLoaded = usePuzzleStore((s) => s.wordsLoaded)

  useAutosave()
  useKeyboardShortcuts()

  useEffect(() => {
    ensureWordListLoaded()
      .then(loadAllWords)
      .then((entries) => {
        setWordLookup(entries)
        setWordsLoaded(true)
      })
      .catch(console.error)
  }, [setWordLookup, setWordsLoaded])

  return (
    <div className="min-h-screen bg-app-bg">
      {workspace !== 'home' && <NavBar />}
      {!wordsLoaded && workspace !== 'home' && (
        <div className="px-4 py-2 text-center text-sm text-app-subtle">Loading word list...</div>
      )}
      {workspace === 'home' && <HomeScreen />}
      {workspace === 'grid' && <GridWorkspace />}
      {workspace === 'words' && <WordsWorkspace />}
      {workspace === 'clues' && <CluesWorkspace />}
      <GuidanceSidebar />
      <ExportModal />
    </div>
  )
}
