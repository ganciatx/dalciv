import { describe, it, expect } from 'vitest'
import { scoreImportedWord, scoreWordByLength, normalizeCrosswordLemma } from '@/lib/wordScoring'

describe('normalizeCrosswordLemma', () => {
  it('normalizes valid words', () => {
    expect(normalizeCrosswordLemma('Ocean')).toBe('OCEAN')
  })

  it('rejects invalid lemmas', () => {
    expect(normalizeCrosswordLemma('no')).toBeNull()
    expect(normalizeCrosswordLemma('TOO-LONG-WORD-HERE')).toBeNull()
  })
})

describe('scoreWordByLength', () => {
  it('scores by length bands', () => {
    expect(scoreWordByLength('CAT').score).toBe(60)
    expect(scoreWordByLength('HOUSE').score).toBe(75)
    expect(scoreWordByLength('BUILDING').score).toBe(70)
    expect(scoreWordByLength('CONSTRUCTION').score).toBe(65)
  })
})

describe('scoreImportedWord', () => {
  it('merges API proper-noun hints', () => {
    const { score, tags } = scoreImportedWord('PARIS', ['toponym'])
    expect(tags).toContain('proper_noun')
    expect(score).toBeLessThanOrEqual(55)
  })

  it('uses length scoring when no special tags', () => {
    const { score, tags } = scoreImportedWord('OCEAN', [])
    expect(score).toBe(75)
    expect(tags).toEqual([])
  })
})
