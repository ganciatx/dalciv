import { useState } from 'react'
import { useDictionaryLookup } from '@/hooks/useDictionaryLookup'
import { help } from '@/lib/helpContent'

interface DictionaryLookupPanelProps {
  /** Pre-fill the lookup field (e.g. current grid slot word). */
  initialWord?: string
  /** Compact layout for grid sidebar. */
  compact?: boolean
  /** Called after a word is successfully added to the local dictionary. */
  onImported?: (word: string) => void
}

export function DictionaryLookupPanel({
  initialWord = '',
  compact = false,
  onImported,
}: DictionaryLookupPanelProps) {
  const [query, setQuery] = useState(initialWord)
  const {
    status,
    result,
    errorMessage,
    importing,
    lastLookupWord,
    isInLocalDictionary,
    runLookup,
    runImport,
  } = useDictionaryLookup()

  const lookupWord = (query.trim() || initialWord).toUpperCase()
  const alreadyLocal = lookupWord ? isInLocalDictionary(lookupWord) : false
  const showResult = result && lastLookupWord === lookupWord

  async function handleLookup() {
    await runLookup(query.trim() || initialWord)
  }

  async function handleImport() {
    const word = query.trim() || initialWord
    const imported = await runImport(word)
    if (imported?.created || imported?.entry) onImported?.(imported.entry.word)
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <label className={`block font-medium text-app-muted ${compact ? 'text-xs' : 'text-sm'}`} title={help.words.dictionaryLookup}>
        {compact ? 'Online dictionary' : 'Look up word (online)'}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          className={`min-w-0 flex-1 rounded border border-app-border px-3 py-2 font-mono uppercase ${compact ? 'text-sm' : ''}`}
          placeholder="EXACT WORD"
          title={help.words.dictionaryLookup}
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleLookup()
          }}
        />
        <button
          type="button"
          className={`shrink-0 rounded bg-app-fg text-white hover:bg-app-accent-hover disabled:opacity-50 ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
          title={help.words.dictionarySearch}
          disabled={status === 'loading' || !(query.trim() || initialWord)}
          onClick={() => void handleLookup()}
        >
          {status === 'loading' ? '…' : 'Look up'}
        </button>
      </div>

      {status === 'loading' && (
        <p className="text-sm text-app-subtle">Searching online dictionary…</p>
      )}
      {status === 'not_found' && (
        <p className="text-sm text-app-subtle">No dictionary entry found for {lookupWord}.</p>
      )}
      {status === 'rate_limited' && (
        <p className="text-sm text-amber-700">{errorMessage}</p>
      )}
      {status === 'error' && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      {showResult && (
        <div className="rounded border border-app-border bg-app-warm p-3 text-sm">
          <p className="font-mono font-medium text-app-fg">{result.word}</p>
          {result.partsOfSpeech.length > 0 && (
            <p className="mt-1 text-xs text-app-subtle">{result.partsOfSpeech.join(', ')}</p>
          )}
          {result.definitions[0] && (
            <p className="mt-2 text-app-muted">{result.definitions[0]}</p>
          )}
          <button
            type="button"
            className="mt-3 rounded bg-app-accent px-3 py-1.5 text-xs text-white hover:bg-app-accent-hover disabled:opacity-50"
            title={help.words.dictionaryImport}
            disabled={alreadyLocal || importing}
            onClick={() => void handleImport()}
          >
            {alreadyLocal ? 'Already in dictionary' : importing ? 'Adding…' : 'Add to dictionary'}
          </button>
        </div>
      )}

      {!compact && (
        <p className="text-xs text-app-subtle">
          Definitions via{' '}
          <a
            href="https://freedictionaryapi.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-app-accent hover:underline"
          >
            FreeDictionaryAPI.com
          </a>
          {' '}(Wiktionary, CC BY-SA 4.0)
        </p>
      )}
    </div>
  )
}
