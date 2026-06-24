import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyGrid,
  createPuzzle,
  fillWordInGrid,
  getPlacementCells,
  normalizeAnswerWord,
  recalculateNumbers,
  validatePlacement,
} from '@/lib/grid'
import { exportJson, importJson } from '@/lib/export'
import { usePuzzleStore } from '@/stores/puzzleStore'

describe('word placement utilities', () => {
  it('normalizes answers by stripping spaces and uppercasing', () => {
    expect(normalizeAnswerWord('  ice tea ')).toBe('ICETEA')
  })

  it('returns across cells anchored at first letter', () => {
    const grid = createEmptyGrid(5)
    const cells = getPlacementCells(grid, 1, 1, 'across', 'CAT')
    expect(cells).toEqual([
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
    ])
  })

  it('returns down cells anchored at first letter', () => {
    const grid = createEmptyGrid(5)
    const cells = getPlacementCells(grid, 0, 2, 'down', 'DOG')
    expect(cells).toEqual([
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ])
  })

  it('returns null when word extends past grid edge', () => {
    const grid = createEmptyGrid(5)
    expect(getPlacementCells(grid, 0, 3, 'across', 'HELLO')).toBeNull()
  })

  it('rejects placement over black squares', () => {
    const grid = createEmptyGrid(5)
    grid[1][2].isBlack = true
    const cells = getPlacementCells(grid, 1, 1, 'across', 'CAT')!
    expect(validatePlacement(grid, cells, 'CAT')).toBe(false)
  })

  it('rejects placement when crossing letters conflict', () => {
    const grid = createEmptyGrid(5)
    grid[1][1].letter = 'X'
    const cells = getPlacementCells(grid, 1, 1, 'across', 'CAT')!
    expect(validatePlacement(grid, cells, 'CAT')).toBe(false)
  })

  it('allows placement when crossing letters match', () => {
    const grid = createEmptyGrid(5)
    grid[1][1].letter = 'C'
    const cells = getPlacementCells(grid, 1, 1, 'across', 'CAT')!
    expect(validatePlacement(grid, cells, 'CAT')).toBe(true)
  })
})

describe('placeWordAt store action', () => {
  beforeEach(() => {
    usePuzzleStore.setState({
      puzzle: createPuzzle(15),
      selection: { row: 0, col: 0, direction: 'across' },
      history: [],
      future: [],
      placementDirection: 'across',
      wordDragActive: false,
      wordDragWord: null,
      wordDragPreview: null,
    })
  })

  it('places a word across from the anchor cell', () => {
    const placed = usePuzzleStore.getState().placeWordAt(0, 0, 'across', 'HELLO')
    expect(placed).toBe(true)
    const grid = usePuzzleStore.getState().puzzle.grid
    expect(grid[0][0].letter).toBe('H')
    expect(grid[0][4].letter).toBe('O')
  })

  it('places a word down from the anchor cell', () => {
    const placed = usePuzzleStore.getState().placeWordAt(0, 1, 'down', 'CAT')
    expect(placed).toBe(true)
    const grid = usePuzzleStore.getState().puzzle.grid
    expect(grid[0][1].letter).toBe('C')
    expect(grid[2][1].letter).toBe('T')
  })

  it('rejects invalid placement without mutating grid', () => {
    const store = usePuzzleStore.getState()
    let grid = store.puzzle.grid
    grid[0][2].isBlack = true
    usePuzzleStore.setState({ puzzle: { ...store.puzzle, grid } })

    const placed = usePuzzleStore.getState().placeWordAt(0, 0, 'across', 'CAT')
    expect(placed).toBe(false)
    expect(usePuzzleStore.getState().puzzle.grid[0][0].letter).toBeNull()
  })
})

describe('answer bank persistence', () => {
  it('round-trips answerBank through JSON export', () => {
    const puzzle = createPuzzle()
    puzzle.answerBank = ['OCEAN', 'CORAL']
    const restored = importJson(exportJson(puzzle))
    expect(restored.answerBank).toEqual(['OCEAN', 'CORAL'])
  })

  it('adds and removes answers without duplicates', () => {
    usePuzzleStore.setState({ puzzle: createPuzzle() })
    const store = usePuzzleStore.getState()
    store.addAnswer('theme')
    store.addAnswer('theme')
    store.addAnswer('  filler ')
    expect(usePuzzleStore.getState().puzzle.answerBank).toEqual(['THEME', 'FILLER'])
    store.removeAnswer('THEME')
    expect(usePuzzleStore.getState().puzzle.answerBank).toEqual(['FILLER'])
  })
})

describe('fillWordInGrid with placement cells', () => {
  it('fills only the targeted slot cells', () => {
    let grid = createEmptyGrid(5)
    const cells = getPlacementCells(grid, 2, 0, 'across', 'ABC')!
    grid = fillWordInGrid(grid, cells, 'ABC')
    grid = recalculateNumbers(grid)
    expect(grid[2][0].letter).toBe('A')
    expect(grid[2][2].letter).toBe('C')
    expect(grid[2][3].letter).toBeNull()
  })
})
