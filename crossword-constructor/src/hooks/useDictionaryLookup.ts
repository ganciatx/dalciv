import { useCallback, useState } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import {
  DictionaryInvalidWordError,
  DictionaryRateLimitError,
  lookupWord,
  type DictionaryLookupResult,
} from '@/lib/dictionaryApi'
import { importWordFromDictionary } from '@/lib/wordDb'

export type DictionaryLookupStatus =
  | 'idle'
  | 'loading'
  | 'found'
  | 'not_found'
  | 'rate_limited'
  | 'error'

export function useDictionaryLookup() {
  const wordLookup = usePuzzleStore((s) => s.wordLookup)
  const refreshWordLookup = usePuzzleStore((s) => s.refreshWordLookup)

  const [status, setStatus] = useState<DictionaryLookupStatus>('idle')
  const [result, setResult] = useState<DictionaryLookupResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [importing, setImporting] = useState(false)
  const [lastLookupWord, setLastLookupWord] = useState('')

  const isInLocalDictionary = useCallback(
    (word: string) => wordLookup.has(word.trim().toUpperCase()),
    [wordLookup],
  )

  const runLookup = useCallback(async (raw: string) => {
    const word = raw.trim().toUpperCase()
    if (!word) {
      setStatus('idle')
      setResult(null)
      setErrorMessage('')
      return
    }

    setLastLookupWord(word)
    setStatus('loading')
    setResult(null)
    setErrorMessage('')

    try {
      const lookup = await lookupWord(word)
      if (!lookup) {
        setStatus('not_found')
        return
      }
      setResult(lookup)
      setStatus('found')
    } catch (err) {
      if (err instanceof DictionaryRateLimitError) {
        setStatus('rate_limited')
        setErrorMessage(err.message)
        return
      }
      if (err instanceof DictionaryInvalidWordError) {
        setStatus('error')
        setErrorMessage(err.message)
        return
      }
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Lookup failed.')
    }
  }, [])

  const runImport = useCallback(async (raw: string) => {
    const word = raw.trim().toUpperCase()
    if (!word) return null

    setImporting(true)
    setErrorMessage('')
    try {
      const { entry, created } = await importWordFromDictionary(word)
      await refreshWordLookup()
      setLastLookupWord(entry.word)
      if (!result || result.word !== entry.word) {
        setResult({
          word: entry.word,
          definitions: result?.definitions ?? [],
          partsOfSpeech: result?.partsOfSpeech ?? [],
          apiTags: entry.tags,
          source: result?.source ?? 'freedictionaryapi',
        })
      }
      setStatus('found')
      return { entry, created }
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Import failed.')
      return null
    } finally {
      setImporting(false)
    }
  }, [refreshWordLookup, result])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setErrorMessage('')
    setLastLookupWord('')
  }, [])

  return {
    status,
    result,
    errorMessage,
    importing,
    lastLookupWord,
    isInLocalDictionary,
    runLookup,
    runImport,
    reset,
  }
}
