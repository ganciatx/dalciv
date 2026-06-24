import { describe, it, expect } from 'vitest'
import { toPuzzleSummary } from '@/lib/puzzleLibrary'
import { createPuzzle } from '@/lib/grid'

describe('toPuzzleSummary', () => {
  it('extracts summary fields from a full puzzle', () => {
    const puzzle = createPuzzle(15, 'NYT')
    puzzle.title = 'Test Theme'
    const summary = toPuzzleSummary(puzzle)
    expect(summary).toEqual({
      id: puzzle.id,
      title: 'Test Theme',
      target: 'NYT',
      size: 15,
      createdAt: puzzle.createdAt,
      updatedAt: puzzle.updatedAt,
    })
  })
})
