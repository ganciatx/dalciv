import { useEffect, useMemo, useState } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { useCurrentSlot } from '@/hooks/useDerivedPuzzleState'
import { getPuzzlePhase } from '@/lib/validation'
import { extractAllSlots } from '@/lib/grid'
import { searchFillCandidates } from '@/lib/fillAssist'
import { getSymmetricPlacementHint } from '@/lib/themeAssist'
import { generateThemeSuggestions } from '@/lib/assistProvider'
import { loadAssistSettings, saveAssistSettings } from '@/lib/assistSettings'
import { help } from '@/lib/helpContent'
import type { AssistSettings, FillCandidate, ThemeCandidate } from '@/types'

type AssistTab = 'theme' | 'filler'

interface ThemeData {
  concept: string
  results: ThemeCandidate[]
  error: string | null
  rationale: string | null
}

interface FillerData {
  key: string
  results: FillCandidate[]
}

export function AssistPanel() {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const showAssist = usePuzzleStore((s) => s.showAssist)
  const setThemeConcept = usePuzzleStore((s) => s.setThemeConcept)
  const applyThemeWord = usePuzzleStore((s) => s.applyThemeWord)
  const addAnswer = usePuzzleStore((s) => s.addAnswer)
  const fillCurrentWord = usePuzzleStore((s) => s.fillCurrentWord)
  const toggleThemeSlot = usePuzzleStore((s) => s.toggleThemeSlot)
  const jumpToSymmetricPartner = usePuzzleStore((s) => s.jumpToSymmetricPartner)
  const slot = useCurrentSlot()

  const phase = getPuzzlePhase(puzzle)
  const defaultTab: AssistTab = phase === 'empty' || phase === 'partial' ? 'theme' : 'filler'
  const [manualTab, setManualTab] = useState<AssistTab | null>(null)
  const tab = manualTab ?? defaultTab

  const [themeData, setThemeData] = useState<ThemeData>({
    concept: '',
    results: [],
    error: null,
    rationale: null,
  })
  const [fillerData, setFillerData] = useState<FillerData>({ key: '', results: [] })
  const [settings, setSettings] = useState<AssistSettings>(loadAssistSettings)
  const [showSettings, setShowSettings] = useState(false)

  const concept = puzzle.themeConcept ?? puzzle.title
  const themeSlots = puzzle.themeSlotNumbers ?? []
  const themeActive = showAssist && tab === 'theme' && concept.trim().length > 0
  const themeSettingsKey = `${settings.provider}|${settings.apiKey}|${settings.model}`

  const slotKey = slot.cells.length
    ? `${slot.word}|${slot.cells[0].row}|${slot.cells[0].col}|${slot.direction}`
    : ''

  const fillerActive = showAssist && tab === 'filler' && slot.cells.length > 0

  const symmetricHint = useMemo(() => {
    if (!slot.cells.length || !slot.number) return null
    const fullSlot = {
      number: slot.number,
      direction: slot.direction,
      row: slot.cells[0].row,
      col: slot.cells[0].col,
      length: slot.cells.length,
      word: slot.word,
      cells: slot.cells,
    }
    return getSymmetricPlacementHint(puzzle.grid, fullSlot).message
  }, [puzzle.grid, slot])

  useEffect(() => {
    if (!themeActive) return
    let cancelled = false
    const queryConcept = concept.trim()
    void generateThemeSuggestions(queryConcept, puzzle.size).then((result) => {
      if (cancelled) return
      setThemeData({
        concept: queryConcept,
        results: result.candidates,
        error: result.error ?? null,
        rationale: result.aiSuggestion?.rationale ?? null,
      })
    })
    return () => { cancelled = true }
  }, [themeActive, concept, puzzle.size, themeSettingsKey])

  useEffect(() => {
    if (!fillerActive) return
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
    void searchFillCandidates(puzzle.grid, fullSlot, { minScore: 40, limit: 15 }).then((results) => {
      if (cancelled) return
      setFillerData({ key: slotKey, results })
    })
    return () => { cancelled = true }
  }, [fillerActive, puzzle.grid, slotKey, slot])

  if (!showAssist) return null

  function updateSettings(partial: Partial<AssistSettings>) {
    const next = { ...settings, ...partial }
    setSettings(next)
    saveAssistSettings(next)
  }

  const unfilledCount = extractAllSlots(puzzle.grid).filter((s) => s.word.includes('?')).length
  const themeLoading = themeActive && themeData.concept !== concept.trim()
  const themeResults = themeActive && themeData.concept === concept.trim() ? themeData.results : []
  const fillerResults = fillerActive && fillerData.key === slotKey ? fillerData.results : []

  return (
    <div className="app-panel-pad">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="app-heading text-app-accent">Assist</h3>
        <button
          type="button"
          className="text-xs text-app-subtle hover:text-app-muted"
          title={help.grid.assist.settings}
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? 'Hide settings' : 'Settings'}
        </button>
      </div>

      {showSettings && (
        <div className="mb-3 space-y-2 rounded border border-app-border bg-app-warm p-3 text-sm">
          <label className="flex items-center gap-2" title={help.grid.assist.provider}>
            Provider
            <select
              className="flex-1 rounded border border-app-border px-2 py-1"
              title={help.grid.assist.provider}
              value={settings.provider}
              onChange={(e) => updateSettings({ provider: e.target.value as AssistSettings['provider'] })}
            >
              <option value="local">Local word list</option>
              <option value="ai">OpenAI (theme only)</option>
            </select>
          </label>
          {settings.provider === 'ai' && (
            <>
              <label className="block" title={help.grid.assist.apiKey}>
                API key
                <input
                  type="password"
                  className="mt-1 w-full rounded border border-app-border px-2 py-1 font-mono text-xs"
                  title={help.grid.assist.apiKey}
                  value={settings.apiKey}
                  onChange={(e) => updateSettings({ apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </label>
              <label className="block" title={help.grid.assist.model}>
                Model
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-app-border px-2 py-1 text-xs"
                  title={help.grid.assist.model}
                  value={settings.model}
                  onChange={(e) => updateSettings({ model: e.target.value })}
                />
              </label>
            </>
          )}
        </div>
      )}

      <div className="mb-3 flex gap-1 rounded bg-app-warm p-1">
        <button
          type="button"
          className={`flex-1 rounded px-2 py-1 text-sm ${tab === 'theme' ? 'bg-white shadow-sm' : 'text-app-muted'}`}
          title={help.grid.assist.tabTheme}
          onClick={() => setManualTab('theme')}
        >
          Theme
        </button>
        <button
          type="button"
          className={`flex-1 rounded px-2 py-1 text-sm ${tab === 'filler' ? 'bg-white shadow-sm' : 'text-app-muted'}`}
          title={help.grid.assist.tabFiller}
          onClick={() => setManualTab('filler')}
        >
          Filler {unfilledCount > 0 ? `(${unfilledCount})` : ''}
        </button>
      </div>

      {tab === 'theme' && (
        <div className="space-y-3">
          <label className="block text-sm text-app-muted" title={help.grid.assist.themeConcept}>
            Theme concept
            <input
              type="text"
              className="mt-1 w-full rounded border border-app-border px-2 py-1.5 text-sm"
              title={help.grid.assist.themeConcept}
              value={puzzle.themeConcept ?? ''}
              onChange={(e) => setThemeConcept(e.target.value)}
              placeholder={puzzle.title || 'e.g. ocean, music, spring'}
            />
          </label>

          {symmetricHint && (
            <p className="rounded bg-app-tint px-2 py-1.5 text-xs text-app-accent">{symmetricHint}</p>
          )}

          {slot.number && (
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 text-app-muted" title={help.grid.assist.markTheme}>
                <input
                  type="checkbox"
                  title={help.grid.assist.markTheme}
                  checked={themeSlots.includes(slot.number)}
                  onChange={() => toggleThemeSlot(slot.number!)}
                />
                Mark slot {slot.number} as theme
              </label>
              <button
                type="button"
                className="text-app-accent hover:underline"
                title={help.grid.assist.jumpPair}
                onClick={jumpToSymmetricPartner}
              >
                Jump to pair
              </button>
            </div>
          )}

          {themeData.error && themeActive && themeData.concept === concept.trim() && (
            <p className="text-xs text-amber-700">{themeData.error}</p>
          )}

          {themeData.rationale && themeActive && themeData.concept === concept.trim() && (
            <p className="text-xs italic text-app-subtle">{themeData.rationale}</p>
          )}

          {themeLoading ? (
            <p className="text-sm text-app-subtle">Searching theme candidates…</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {themeResults.map((r) => (
                <li key={r.word} className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-app-tint"
                    onClick={() => applyThemeWord(r.word, true)}
                    disabled={!slot.cells.length}
                    title={!slot.cells.length ? 'Select a grid slot first' : help.grid.assist.applyTheme}
                  >
                    <span className="font-mono font-medium">{r.word}</span>
                    <span className="text-xs text-app-subtle">
                      {r.length}L · {r.matchReason}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded px-1.5 py-1 text-xs text-app-accent hover:bg-app-tint"
                    title={help.grid.assist.addToBank}
                    onClick={() => addAnswer(r.word)}
                  >
                    +
                  </button>
                </li>
              ))}
              {!themeResults.length && concept.trim() && (
                <li className="text-sm text-app-subtle">No theme matches — try a different concept.</li>
              )}
              {!concept.trim() && (
                <li className="text-sm text-app-subtle">Enter a theme concept to get suggestions.</li>
              )}
            </ul>
          )}
        </div>
      )}

      {tab === 'filler' && (
        <div className="space-y-2">
          {!slot.cells.length ? (
            <p className="text-sm text-app-subtle">Select a white cell to see filler suggestions.</p>
          ) : (
            <>
              <p className="font-mono text-sm tracking-widest text-app-muted">{slot.word}</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {fillerResults.map((r) => (
                  <li key={r.word}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-app-tint"
                      title={help.grid.assist.applyFiller}
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
                {!fillerResults.length && (
                  <li className="text-sm text-app-subtle">No filler matches for this pattern.</li>
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
