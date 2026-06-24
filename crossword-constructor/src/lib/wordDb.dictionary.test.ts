import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WordEntry } from '@/types'

vi.mock('@/lib/dictionaryApi', () => ({
  lookupWord: vi.fn(),
}))

vi.mock('@/lib/appDb', () => ({
  getAppDb: vi.fn(),
  WORDS_STORE: 'words',
}))

import { lookupWord } from '@/lib/dictionaryApi'
import { getAppDb } from '@/lib/appDb'
import { getWordEntry, importWordFromDictionary } from '@/lib/wordDb'

const mockLookupWord = vi.mocked(lookupWord)

function createMockDb(existing: WordEntry | null = null) {
  const put = vi.fn(async () => undefined)
  const get = vi.fn(async (_store: string, key: string) => {
    if (!existing || key !== existing.word) return undefined
    return existing
  })
  vi.mocked(getAppDb).mockResolvedValue({ get, put } as never)
  return { get, put }
}

describe('importWordFromDictionary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns existing entry without calling the API', async () => {
    const existing: WordEntry = {
      word: 'HELLO',
      score: 75,
      tags: [],
      excluded: false,
    }
    createMockDb(existing)

    const result = await importWordFromDictionary('hello')
    expect(result.created).toBe(false)
    expect(result.entry).toEqual(existing)
    expect(mockLookupWord).not.toHaveBeenCalled()
  })

  it('creates a new entry from dictionary lookup', async () => {
    const store = createMockDb(null)
    mockLookupWord.mockResolvedValue({
      word: 'OCEAN',
      definitions: ['A large body of salt water.'],
      partsOfSpeech: ['noun'],
      apiTags: [],
      source: 'freedictionaryapi',
    })

    const result = await importWordFromDictionary('ocean')
    expect(result.created).toBe(true)
    expect(result.entry.word).toBe('OCEAN')
    expect(result.entry.excluded).toBe(false)
    expect(store.put).toHaveBeenCalledWith('words', expect.objectContaining({ word: 'OCEAN' }))
  })

  it('throws when the word is not found online', async () => {
    createMockDb(null)
    mockLookupWord.mockResolvedValue(null)

    await expect(importWordFromDictionary('ZZZZZ')).rejects.toThrow(/not found/)
  })
})

describe('getWordEntry', () => {
  it('loads by uppercase key', async () => {
    const entry: WordEntry = { word: 'CAT', score: 60, tags: [], excluded: false }
    const store = createMockDb(entry)

    const result = await getWordEntry('cat')
    expect(result).toEqual(entry)
    expect(store.get).toHaveBeenCalledWith('words', 'CAT')
  })
})
