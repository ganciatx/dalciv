import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DictionaryInvalidWordError,
  DictionaryRateLimitError,
  lookupWord,
  normalizeLookupWord,
} from '@/lib/dictionaryApi'

const freeDictionaryPayload = {
  word: 'hello',
  entries: [{
    partOfSpeech: 'interjection',
    senses: [{ definition: 'A greeting.', tags: ['colloquial'] }],
  }],
}

const dictionaryApiDevPayload = [{
  word: 'hello',
  meanings: [{
    partOfSpeech: 'noun',
    definitions: [{ definition: '"Hello!" or an equivalent greeting.' }],
  }],
}]

describe('normalizeLookupWord', () => {
  it('accepts valid crossword lemmas', () => {
    expect(normalizeLookupWord('hello')).toBe('HELLO')
    expect(normalizeLookupWord('  abc  ')).toBe('ABC')
  })

  it('rejects invalid input', () => {
    expect(() => normalizeLookupWord('ab')).toThrow(DictionaryInvalidWordError)
    expect(() => normalizeLookupWord('HELLO WORLD')).toThrow(DictionaryInvalidWordError)
    expect(() => normalizeLookupWord('HELLO1')).toThrow(DictionaryInvalidWordError)
  })
})

describe('lookupWord', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns primary API result on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => freeDictionaryPayload,
    } as Response)

    const result = await lookupWord('hello')
    expect(result?.word).toBe('HELLO')
    expect(result?.source).toBe('freedictionaryapi')
    expect(result?.definitions).toContain('A greeting.')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('falls back to dictionaryapi.dev when primary returns 404', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ status: 404, ok: false } as Response)
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => dictionaryApiDevPayload,
      } as Response)

    const result = await lookupWord('hello')
    expect(result?.source).toBe('dictionaryapi.dev')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('returns null when both APIs miss', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ status: 404, ok: false } as Response)
      .mockResolvedValueOnce({ status: 404, ok: false } as Response)

    expect(await lookupWord('zzzzz')).toBeNull()
  })

  it('throws when both APIs rate-limit', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ status: 429, ok: false } as Response)
      .mockResolvedValueOnce({ status: 429, ok: false } as Response)

    await expect(lookupWord('hello')).rejects.toBeInstanceOf(DictionaryRateLimitError)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('falls back when primary rate-limits but secondary succeeds', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ status: 429, ok: false } as Response)
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => dictionaryApiDevPayload,
      } as Response)

    const result = await lookupWord('hello')
    expect(result?.source).toBe('dictionaryapi.dev')
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
