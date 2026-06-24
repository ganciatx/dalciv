import { useState, useEffect, useRef } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { searchWords, parseWordListText, upsertWord } from '@/lib/wordDb'
import { DictionaryLookupPanel } from '@/components/words/DictionaryLookupPanel'
import { help } from '@/lib/helpContent'
import type { WordEntry } from '@/types'

export function WordsWorkspace() {
  const refreshWordLookup = usePuzzleStore((s) => s.refreshWordLookup)
  const [pattern, setPattern] = useState('')
  const [results, setResults] = useState<WordEntry[]>([])
  const [minScore, setMinScore] = useState(40)
  const [excludeProper, setExcludeProper] = useState(false)
  const [excludeAbbr, setExcludeAbbr] = useState(false)
  const [excludeCrosswordese, setExcludeCrosswordese] = useState(true)
  const [maxLength, setMaxLength] = useState(15)
  const [searchTick, setSearchTick] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = pattern.trim() || '???'
    searchWords(q, {
      minScore,
      excludeProperNouns: excludeProper,
      excludeAbbreviations: excludeAbbr,
      excludeCrosswordese: excludeCrosswordese,
      limit: 100,
    }).then((r) => setResults(r.filter((w) => w.word.length <= maxLength)))
  }, [pattern, minScore, excludeProper, excludeAbbr, excludeCrosswordese, maxLength, searchTick])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const entries = parseWordListText(text)
    for (const entry of entries) await upsertWord(entry)
    await refreshWordLookup()
    setSearchTick((n) => n + 1)
  }

  async function handleDictionaryImported() {
    await refreshWordLookup()
    setSearchTick((n) => n + 1)
  }

  return (
    <div className="app-workspace mx-auto max-w-4xl space-y-4 p-6">
      <h2 className="app-title text-xl">Word & Fill Management</h2>

      <div className="app-panel-pad">
        <label className="mb-2 block text-sm font-medium text-app-muted" title={help.words.pattern}>
          Pattern search (? = any letter)
        </label>
        <input
          ref={searchRef}
          type="text"
          className="mb-4 w-full rounded border border-app-border px-3 py-2 font-mono uppercase"
          placeholder="C?OS?W?RD"
          title={help.words.pattern}
          value={pattern}
          onChange={(e) => setPattern(e.target.value.toUpperCase())}
        />

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <label className="flex items-center gap-2" title={help.words.minScore}>
            Min score: {minScore}
            <input type="range" min={1} max={100} value={minScore} title={help.words.minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="flex-1" />
          </label>
          <label className="flex items-center gap-2" title={help.words.maxLength}>
            Max length: {maxLength}
            <input type="range" min={3} max={15} value={maxLength} title={help.words.maxLength} onChange={(e) => setMaxLength(Number(e.target.value))} className="flex-1" />
          </label>
          <label className="flex items-center gap-2" title={help.words.excludeProper}>
            <input type="checkbox" checked={excludeProper} title={help.words.excludeProper} onChange={(e) => setExcludeProper(e.target.checked)} />
            Exclude proper nouns
          </label>
          <label className="flex items-center gap-2" title={help.words.excludeAbbr}>
            <input type="checkbox" checked={excludeAbbr} title={help.words.excludeAbbr} onChange={(e) => setExcludeAbbr(e.target.checked)} />
            Exclude abbreviations
          </label>
          <label className="flex items-center gap-2" title={help.words.excludeCrosswordese}>
            <input type="checkbox" checked={excludeCrosswordese} title={help.words.excludeCrosswordese} onChange={(e) => setExcludeCrosswordese(e.target.checked)} />
            Exclude crosswordese
          </label>
        </div>

        <label className="block text-sm text-app-muted" title={help.words.uploadList}>
          Upload custom word list (CSV/plain text)
          <input type="file" accept=".txt,.csv" className="mt-1 block text-sm" title={help.words.uploadList} onChange={handleUpload} />
        </label>
      </div>

      <div className="app-panel-pad">
        <DictionaryLookupPanel onImported={() => void handleDictionaryImported()} />
      </div>

      <div className="app-panel">
        <div className="border-b border-app-border px-4 py-2 text-sm text-app-subtle">
          {results.length} results (sorted by score)
        </div>
        <ul className="max-h-[calc(100vh-400px)] divide-y divide-app-border overflow-y-auto">
          {results.map((r) => (
            <li key={r.word} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-app-warm">
              <span className="font-mono font-medium">{r.word}</span>
              <span className={`rounded px-2 py-0.5 text-xs ${scoreColor(r.score)}`}>
                {r.score}
              </span>
              {r.tags.length > 0 && (
                <span className="text-xs text-app-subtle">{r.tags.join(', ')}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}
