import type { WordEntry } from '@/types'
import { getAppDb, WORDS_STORE } from '@/lib/appDb'
import { lookupWord } from '@/lib/dictionaryApi'
import { scoreImportedWord } from '@/lib/wordScoring'

export async function getWordCount(): Promise<number> {
  const db = await getAppDb()
  return db.count(WORDS_STORE)
}

export async function seedWordList(entries: WordEntry[]): Promise<void> {
  const db = await getAppDb()
  const tx = db.transaction(WORDS_STORE, 'readwrite')
  await Promise.all([
    ...entries.map((e) => tx.store.put(e)),
    tx.done,
  ])
}

export async function loadAllWords(): Promise<WordEntry[]> {
  const db = await getAppDb()
  return db.getAll(WORDS_STORE)
}

export async function upsertWord(entry: WordEntry): Promise<void> {
  const db = await getAppDb()
  await db.put(WORDS_STORE, entry)
}

export async function getWordEntry(word: string): Promise<WordEntry | null> {
  const db = await getAppDb()
  return (await db.get(WORDS_STORE, word.toUpperCase())) ?? null
}

export interface DictionaryImportResult {
  entry: WordEntry
  /** false when the word was already in the local dictionary */
  created: boolean
}

/**
 * Look up a word online and add it to IndexedDB when not already present.
 * Returns the local entry (existing or newly created).
 */
export async function importWordFromDictionary(raw: string): Promise<DictionaryImportResult> {
  const normalized = raw.trim().toUpperCase()
  const existing = await getWordEntry(normalized)
  if (existing) return { entry: existing, created: false }

  const lookup = await lookupWord(normalized)
  if (!lookup) throw new Error(`"${normalized}" was not found in the online dictionary.`)

  const { score, tags } = scoreImportedWord(lookup.word, lookup.apiTags)
  const entry: WordEntry = {
    word: lookup.word,
    score,
    tags,
    excluded: false,
  }
  await upsertWord(entry)
  return { entry, created: true }
}

export async function searchWords(
  pattern: string,
  options: {
    length?: number
    minScore?: number
    excludeProperNouns?: boolean
    excludeAbbreviations?: boolean
    excludeCrosswordese?: boolean
    limit?: number
  } = {},
): Promise<WordEntry[]> {
  const all = await loadAllWords()
  const regex = patternToRegex(pattern)
  const limit = options.limit ?? 50

  return all
    .filter((e) => {
      if (e.excluded) return false
      if (options.length && e.word.length !== options.length) return false
      if (options.minScore && e.score < options.minScore) return false
      if (options.excludeProperNouns && e.tags.includes('proper_noun')) return false
      if (options.excludeAbbreviations && e.tags.includes('abbreviation')) return false
      if (options.excludeCrosswordese && e.tags.includes('crosswordese')) return false
      return regex.test(e.word)
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.toUpperCase().replace(/[.*+^${}()|[\]\\]/g, '\\$&')
  const body = escaped.replace(/\?/g, '.')
  return new RegExp(`^${body}$`)
}

export function buildWordLookup(entries: WordEntry[]): Map<string, WordEntry> {
  return new Map(entries.map((e) => [e.word.toUpperCase(), e]))
}

export function parseWordListText(text: string): WordEntry[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim())
      const word = parts[0].toUpperCase()
      const score = parts[1] ? parseInt(parts[1], 10) : 50
      const tags = parts[2] ? parts[2].split('|').map((t) => t.trim()) : []
      return { word, score: Number.isFinite(score) ? score : 50, tags, excluded: false }
    })
}

export async function ensureWordListLoaded(): Promise<void> {
  const count = await getWordCount()
  if (count > 0) return

  const res = await fetch(`${import.meta.env.BASE_URL}data/words.json`)
  if (!res.ok) throw new Error('Failed to load default word list')
  const entries: WordEntry[] = await res.json()
  await seedWordList(entries)
}
