import { useRef } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { useComplianceStatus, useValidationIssues } from '@/hooks/useDerivedPuzzleState'
import { savePuzzleFile } from '@/lib/persistence'
import { importJson, importPuz } from '@/lib/export'
import { help } from '@/lib/helpContent'
import { AuthButton } from '@/components/AuthButton'
import { LandingLogo } from '@/components/landing/LandingLogo'
import type { Workspace } from '@/types'

const tabs: { id: Workspace; label: string }[] = [
  { id: 'grid', label: 'Grid' },
  { id: 'words', label: 'Words' },
  { id: 'clues', label: 'Clues' },
]

export function NavBar() {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const workspace = usePuzzleStore((s) => s.workspace)
  const compliance = useComplianceStatus()
  const issues = useValidationIssues()
  const setWorkspace = usePuzzleStore((s) => s.setWorkspace)
  const setTitle = usePuzzleStore((s) => s.setTitle)
  const setTarget = usePuzzleStore((s) => s.setTarget)
  const setShowExport = usePuzzleStore((s) => s.setShowExport)
  const setShowGuidance = usePuzzleStore((s) => s.setShowGuidance)
  const newPuzzle = usePuzzleStore((s) => s.newPuzzle)
  const setPuzzle = usePuzzleStore((s) => s.setPuzzle)
  const fileRef = useRef<HTMLInputElement>(null)

  const badge = {
    ok: { className: 'app-badge-ok', label: '✓ Compliant' },
    warning: {
      className: 'app-badge-warn',
      label: `⚠ ${issues.filter((i) => i.level === 'warning').length} warnings`,
    },
    error: {
      className: 'app-badge-error',
      label: `✕ ${issues.filter((i) => i.level === 'error').length} errors`,
    },
  }[compliance]

  async function handleOpen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text()
        setPuzzle(importJson(text))
      } else if (file.name.endsWith('.puz')) {
        const buf = await file.arrayBuffer()
        setPuzzle(await importPuz(buf))
      }
    } catch (err) {
      alert(`Failed to open file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    e.target.value = ''
  }

  return (
    <header className="app-nav">
      <button type="button" className="app-nav-logo" title={help.nav.home} onClick={() => setWorkspace('home')}>
        <LandingLogo />
      </button>

      <nav className="app-nav-tabs" aria-label="Workspace">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.id === 'grid' ? help.nav.tabGrid : t.id === 'words' ? help.nav.tabWords : help.nav.tabClues}
            className={`app-nav-tab${workspace === t.id ? ' app-nav-tab-active' : ''}`}
            onClick={() => setWorkspace(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <input
        type="text"
        className="app-input min-w-0 flex-1"
        value={puzzle.title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Puzzle title"
        title={help.nav.title}
      />

      <select
        className="app-select"
        value={puzzle.target}
        onChange={(e) => setTarget(e.target.value as 'NYT' | 'WSJ')}
        title={help.nav.target}
      >
        <option value="NYT">NYT</option>
        <option value="WSJ">WSJ</option>
      </select>

      <span className={badge.className} title={help.nav.complianceBadge}>
        {badge.label}
      </span>

      <button type="button" className="app-btn-ghost" onClick={() => setShowGuidance(true)} title={help.nav.guidance}>
        ?
      </button>

      <button type="button" className="app-btn-primary" title={help.nav.export} onClick={() => setShowExport(true)}>
        Export
      </button>

      <button
        type="button"
        className="app-btn-secondary"
        title={help.nav.newPuzzle}
        onClick={() => newPuzzle(puzzle.size, puzzle.target)}
      >
        New
      </button>
      <button type="button" className="app-btn-secondary" title={help.nav.openFile} onClick={() => fileRef.current?.click()}>
        Open
      </button>
      <button type="button" className="app-btn-secondary" title={help.nav.saveFile} onClick={() => savePuzzleFile(puzzle)}>
        Save
      </button>
      <AuthButton compact />
      <input ref={fileRef} type="file" accept=".json,.puz" className="hidden" onChange={handleOpen} />
    </header>
  )
}
