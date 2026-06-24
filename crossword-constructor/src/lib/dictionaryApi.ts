import { normalizeCrosswordLemma } from '@/lib/wordScoring'

const FREE_DICTIONARY_URL = 'https://freedictionaryapi.com/api/v1/entries/en'
const DICTIONARY_API_DEV_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en'

export type DictionarySource = 'freedictionaryapi' | 'dictionaryapi.dev'

export interface DictionaryLookupResult {
  word: string
  definitions: string[]
  partsOfSpeech: string[]
  apiTags: string[]
  source: DictionarySource
}

export class DictionaryRateLimitError extends Error {
  constructor() {
    super('Dictionary API rate limit reached. Try again in a few minutes.')
    this.name = 'DictionaryRateLimitError'
  }
}

export class DictionaryInvalidWordError extends Error {
  constructor(message = 'Word must be 3–15 uppercase letters (A–Z).') {
    super(message)
    this.name = 'DictionaryInvalidWordError'
  }
}

/** Normalize input for lookup; throws DictionaryInvalidWordError when invalid. */
export function normalizeLookupWord(raw: string): string {
  const word = normalizeCrosswordLemma(raw)
  if (!word) throw new DictionaryInvalidWordError()
  return word
}

/**
 * Look up a single English lemma via FreeDictionaryAPI (primary) and dictionaryapi.dev (fallback).
 */
export async function lookupWord(raw: string): Promise<DictionaryLookupResult | null> {
  const word = normalizeLookupWord(raw)
  let sawRateLimit = false

  for (const fetcher of [fetchFreeDictionary, fetchDictionaryApiDev]) {
    try {
      const result = await fetcher(word)
      if (result) return result
    } catch (err) {
      if (err instanceof DictionaryRateLimitError) {
        sawRateLimit = true
        continue
      }
    }
  }

  if (sawRateLimit) throw new DictionaryRateLimitError()
  return null
}

async function fetchFreeDictionary(word: string): Promise<DictionaryLookupResult | null> {
  const res = await fetch(`${FREE_DICTIONARY_URL}/${encodeURIComponent(word.toLowerCase())}`)
  if (res.status === 429) throw new DictionaryRateLimitError()
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`FreeDictionaryAPI error: ${res.status}`)

  const data = await res.json() as FreeDictionaryResponse
  if (!data.entries?.length) return null

  const definitions: string[] = []
  const partsOfSpeech: string[] = []
  const apiTags: string[] = []

  for (const entry of data.entries) {
    if (entry.partOfSpeech) partsOfSpeech.push(entry.partOfSpeech)
    for (const sense of entry.senses ?? []) {
      if (sense.definition) definitions.push(sense.definition)
      for (const tag of sense.tags ?? []) apiTags.push(tag)
    }
  }

  return {
    word,
    definitions: definitions.slice(0, 5),
    partsOfSpeech: [...new Set(partsOfSpeech)],
    apiTags: [...new Set(apiTags)],
    source: 'freedictionaryapi',
  }
}

async function fetchDictionaryApiDev(word: string): Promise<DictionaryLookupResult | null> {
  const res = await fetch(`${DICTIONARY_API_DEV_URL}/${encodeURIComponent(word.toLowerCase())}`)
  if (res.status === 429) throw new DictionaryRateLimitError()
  if (res.status === 404) return null
  if (!res.ok) return null

  const data = await res.json() as DictionaryApiDevEntry[]
  if (!Array.isArray(data) || !data.length) return null

  const definitions: string[] = []
  const partsOfSpeech: string[] = []

  for (const entry of data) {
    for (const meaning of entry.meanings ?? []) {
      if (meaning.partOfSpeech) partsOfSpeech.push(meaning.partOfSpeech)
      for (const def of meaning.definitions ?? []) {
        if (def.definition) definitions.push(def.definition)
      }
    }
  }

  return {
    word,
    definitions: definitions.slice(0, 5),
    partsOfSpeech: [...new Set(partsOfSpeech)],
    apiTags: [],
    source: 'dictionaryapi.dev',
  }
}

interface FreeDictionaryResponse {
  word?: string
  entries?: {
    partOfSpeech?: string
    senses?: { definition?: string; tags?: string[] }[]
  }[]
}

interface DictionaryApiDevEntry {
  word?: string
  meanings?: {
    partOfSpeech?: string
    definitions?: { definition?: string }[]
  }[]
}
