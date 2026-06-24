import { useMemo, useState } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { useValidationIssues } from '@/hooks/useDerivedPuzzleState'
import { getPuzzlePhase } from '@/lib/validation'
import {
  filterGuideByWorkspace,
  filterShortcutsByWorkspace,
  help,
} from '@/lib/helpContent'
import type { PublicationTarget } from '@/types'

const NYT_REQUIREMENTS = [
  '15×15 (Mon–Sat) or 21×21 (Sunday)',
  '180° rotational symmetry',
  'All-over interlock',
  'Every letter checked (Across + Down)',
  'Minimum 3-letter answers',
  'Max 78 words (15×15) / 140 (21×21)',
  'Export: .puz or NYT plain-text',
]

const WSJ_REQUIREMENTS = [
  '15×15 (Mon–Fri) or 21×21 (Saturday)',
  'Max 78 words (15×15) / 140 (21×21)',
  'Title required',
  'Common, lively fill — avoid obscure words',
  'Proper names used sparingly',
  'Export: .puz or WSJ plain-text',
]

const PHASE_TIPS: Record<string, Record<PublicationTarget, string[]>> = {
  empty: {
    NYT: ['Place theme entries symmetrically before filling', 'First theme entry often starts in row 3 of a 15×15', 'Use Assist → Theme to brainstorm entries from your concept'],
    WSJ: ['Define a tight, consistent theme before building', 'Title should not duplicate a theme answer', 'Use Assist → Theme to explore candidate entries'],
  },
  partial: {
    NYT: ['Watch word count — stay under the maximum', 'Limit 3-letter words to ~20% of fill', 'Use Assist → Filler for crossing-aware suggestions'],
    WSJ: ['Prefer common, familiar vocabulary', 'Avoid clusters of proper nouns from one domain', 'Use Assist → Filler to improve fill quality'],
  },
  complete: {
    NYT: ['Review fill scores — replace red/yellow words', 'Verify symmetry and interlock before clues'],
    WSJ: ['Double-check title and theme consistency', 'Review for crosswordese and abbreviations'],
  },
  clues: {
    NYT: ['Use ? for puns and wordplay clues', 'Flag abbreviations with "Abbr." in the clue'],
    WSJ: ['Daily clues: moderately easy to difficult', 'Weekend: medium to difficult'],
  },
}

type GuidanceTab = 'screen' | 'guide' | 'shortcuts'

export function GuidanceSidebar() {
  const show = usePuzzleStore((s) => s.showGuidance)
  const setShow = usePuzzleStore((s) => s.setShowGuidance)
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const workspace = usePuzzleStore((s) => s.workspace)
  const issues = useValidationIssues()
  const [tab, setTab] = useState<GuidanceTab>('screen')
  const [query, setQuery] = useState('')

  const screenSections = useMemo(() => filterGuideByWorkspace(workspace), [workspace])
  const shortcuts = useMemo(() => filterShortcutsByWorkspace(workspace), [workspace])

  if (!show) return null

  const phase = getPuzzlePhase(puzzle)
  const tips = PHASE_TIPS[phase]?.[puzzle.target] ?? []
  const requirements = puzzle.target === 'NYT' ? NYT_REQUIREMENTS : WSJ_REQUIREMENTS
  const errors = issues.filter((i) => i.level === 'error').length
  const warnings = issues.filter((i) => i.level === 'warning').length

  const normalizedQuery = query.trim().toLowerCase()
  const filteredSections = screenSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!normalizedQuery) return true
        return (
          item.label.toLowerCase().includes(normalizedQuery)
          || item.description.toLowerCase().includes(normalizedQuery)
        )
      }),
    }))
    .filter((section) => section.items.length > 0)

  const screenItems = screenSections.flatMap((s) => s.items)

  return (
    <div className="app-drawer">
      <div className="flex items-center justify-between border-b border-app-border px-6 py-4">
        <h2 className="app-title text-lg">Guidance — {puzzle.target}</h2>
        <button
          type="button"
          className="text-app-subtle hover:text-app-muted"
          title={help.guidance.close}
          onClick={() => setShow(false)}
        >
          ✕
        </button>
      </div>

      <div className="border-b border-app-border px-6 py-2">
        <p className="text-xs text-app-subtle">Hover any control for a quick tip. Press F1 to reopen this panel.</p>
      </div>

      <div className="flex gap-1 border-b border-app-border px-4 py-2">
        {([
          ['screen', 'This screen'],
          ['guide', 'Full guide'],
          ['shortcuts', 'Shortcuts'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`flex-1 rounded px-2 py-1 text-xs font-medium ${
              tab === id ? 'bg-app-tint text-app-accent' : 'text-app-muted hover:bg-app-warm'
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tab === 'screen' && (
          <div className="space-y-4">
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase text-app-subtle">Quick Reference</h3>
              <ul className="space-y-1 text-sm text-app-muted">
                {requirements.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-green-600">•</span> {r}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase text-app-subtle">Compliance</h3>
              <p className="text-sm">
                {errors === 0 && warnings === 0
                  ? '✓ No errors or warnings'
                  : `${errors} error(s), ${warnings} warning(s)`}
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase text-app-subtle">
                Tips ({phase} phase)
              </h3>
              <ul className="space-y-2 text-sm text-app-muted">
                {tips.map((t) => (
                  <li key={t} className="rounded bg-app-tint px-3 py-2">{t}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase text-app-subtle">
                Controls on this screen ({screenItems.length})
              </h3>
              <ul className="space-y-2 text-sm">
                {screenSections.flatMap((section) =>
                  section.items.map((item) => (
                    <li key={item.id} className="rounded border border-app-border bg-app-warm px-3 py-2">
                      <span className="font-medium text-app-fg">{item.label}</span>
                      <p className="mt-0.5 text-app-muted">{item.description}</p>
                    </li>
                  )),
                )}
              </ul>
            </section>
          </div>
        )}

        {tab === 'guide' && (
          <div className="space-y-4">
            <input
              type="search"
              className="w-full rounded border border-app-border px-3 py-1.5 text-sm"
              placeholder="Search controls..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              title="Filter the interface guide by control name or description."
            />
            {filteredSections.map((section) => (
              <section key={section.id}>
                <h3 className="mb-2 text-sm font-semibold uppercase text-app-subtle">{section.title}</h3>
                <ul className="space-y-2 text-sm">
                  {section.items.map((item) => (
                    <li key={item.id} className="rounded border border-app-border px-3 py-2">
                      <span className="font-medium text-app-fg">{item.label}</span>
                      <p className="mt-0.5 text-app-muted">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {filteredSections.length === 0 && (
              <p className="text-sm text-app-subtle">No controls match your search.</p>
            )}
          </div>
        )}

        {tab === 'shortcuts' && (
          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase text-app-subtle">Keyboard shortcuts</h3>
            <ul className="space-y-2 text-sm">
              {shortcuts.map((s) => (
                <li key={s.keys} className="flex gap-3 rounded border border-app-border px-3 py-2">
                  <kbd className="shrink-0 rounded bg-app-warm px-1.5 py-0.5 font-mono text-xs text-app-muted">
                    {s.keys}
                  </kbd>
                  <span className="text-app-muted">{s.description}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
