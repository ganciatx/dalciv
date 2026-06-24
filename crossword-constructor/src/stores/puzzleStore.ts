import { create } from 'zustand'
import type {
  Direction,
  GridSize,
  PublicationTarget,
  Puzzle,
  ValidationIssue,
  WordDragPreview,
  WordEntry,
  Workspace,
} from '@/types'
import {
  blackSquarePositions,
  clearGridLetters,
  cloneGrid,
  computeStats,
  createPuzzle,
  extractAllSlots,
  fillWordInGrid,
  findNextEmptyCell,
  getPlacementCells,
  getWordAt,
  moveSelection,
  normalizeAnswerWord,
  recalculateNumbers,
  resetGridAll,
  setCellsBlack,
  getSymmetricPartnerSlot,
  validatePlacement,
} from '@/lib/grid'
import { validatePuzzle, getComplianceStatus } from '@/lib/validation'
import { buildWordLookup, loadAllWords } from '@/lib/wordDb'
import { savePuzzleToLibrary } from '@/lib/puzzleLibrary'

const MAX_HISTORY = 50

interface Selection {
  row: number
  col: number
  direction: Direction
}

interface PuzzleState {
  puzzle: Puzzle
  workspace: Workspace
  selection: Selection
  symmetryEnabled: boolean
  rebusMode: boolean
  zoom: number
  symmetryHighlight: { row: number; col: number }[] | null
  blackDragActive: boolean
  blackDragPreview: { row: number; col: number }[] | null
  blackDragHistoryRecorded: boolean
  wordDragActive: boolean
  wordDragWord: string | null
  wordDragPreview: WordDragPreview | null
  placementDirection: Direction
  showGuidance: boolean
  showAssist: boolean
  showExport: boolean
  wordLookup: Map<string, WordEntry>
  history: Puzzle[]
  future: Puzzle[]
  wordsLoaded: boolean

  setWorkspace: (ws: Workspace) => void
  setPuzzle: (puzzle: Puzzle) => void
  newPuzzle: (size?: GridSize, target?: PublicationTarget) => void
  setTitle: (title: string) => void
  setTarget: (target: PublicationTarget) => void
  setNotes: (notes: string) => void
  setWordLookup: (entries: WordEntry[]) => void
  refreshWordLookup: () => Promise<void>
  setWordsLoaded: (v: boolean) => void
  selectCell: (row: number, col: number, toggleDirection?: boolean) => void
  setDirection: (direction: Direction) => void
  toggleBlack: (row: number, col: number) => void
  beginBlackSquareDrag: () => void
  endBlackSquareDrag: () => void
  setBlackDragPreview: (row: number, col: number) => void
  clearBlackDragPreview: () => void
  paintBlackSquare: (row: number, col: number) => void
  beginWordDrag: (word: string) => void
  endWordDrag: () => void
  setWordDragPreview: (row: number, col: number, direction?: Direction) => void
  clearWordDragPreview: () => void
  placeWordAt: (row: number, col: number, direction: Direction, word: string) => boolean
  addAnswer: (word: string) => void
  removeAnswer: (word: string) => void
  setPlacementDirection: (direction: Direction) => void
  setLetter: (letter: string) => void
  clearLetter: (moveBack?: boolean) => void
  fillCurrentWord: (word: string) => void
  clearGrid: () => void
  resetGrid: () => void
  resizeGrid: (size: GridSize) => void
  setSymmetryEnabled: (v: boolean) => void
  setRebusMode: (v: boolean) => void
  setZoom: (zoom: number) => void
  setClue: (direction: Direction, number: number, text: string) => void
  moveCursor: (dr: number, dc: number) => void
  tabToNext: (reverse?: boolean) => void
  undo: () => void
  redo: () => void
  setShowGuidance: (v: boolean) => void
  setShowAssist: (v: boolean) => void
  setShowExport: (v: boolean) => void
  setThemeConcept: (concept: string) => void
  toggleThemeSlot: (slotNumber: number) => void
  applyThemeWord: (word: string, markTheme?: boolean) => void
  jumpToSlot: (row: number, col: number, direction: Direction) => void
  jumpToSymmetricPartner: () => void
  navigateToIssue: (issue: ValidationIssue) => void
  getIssues: () => ValidationIssue[]
  getCompliance: () => 'ok' | 'warning' | 'error'
  getStats: () => ReturnType<typeof computeStats>
  getCurrentSlot: () => ReturnType<typeof getWordAt> & { direction: Direction; number: number | null }
  pushHistory: () => void
}

function touch(puzzle: Puzzle): Puzzle {
  return { ...puzzle, updatedAt: new Date().toISOString() }
}

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  puzzle: createPuzzle(),
  workspace: 'home',
  selection: { row: 0, col: 0, direction: 'across' },
  symmetryEnabled: true,
  rebusMode: false,
  zoom: 100,
  symmetryHighlight: null,
  blackDragActive: false,
  blackDragPreview: null,
  blackDragHistoryRecorded: false,
  wordDragActive: false,
  wordDragWord: null,
  wordDragPreview: null,
  placementDirection: 'across',
  showGuidance: false,
  showAssist: true,
  showExport: false,
  wordLookup: new Map(),
  history: [],
  future: [],
  wordsLoaded: false,

  setWorkspace: (workspace) => set({ workspace }),

  setPuzzle: (puzzle) => {
    void savePuzzleToLibrary(puzzle)
    set({
      puzzle,
      selection: { row: 0, col: 0, direction: 'across' },
      history: [],
      future: [],
      workspace: 'grid',
    })
  },

  newPuzzle: (size = 15, target = 'NYT') => {
    const puzzle = createPuzzle(size, target)
    void savePuzzleToLibrary(puzzle)
    set({
      puzzle,
      selection: { row: 0, col: 0, direction: 'across' },
      history: [],
      future: [],
      workspace: 'grid',
    })
  },

  setTitle: (title) => set((s) => ({ puzzle: touch({ ...s.puzzle, title }) })),

  setTarget: (target) => set((s) => ({ puzzle: touch({ ...s.puzzle, target }) })),

  setNotes: (notes) => set((s) => ({ puzzle: touch({ ...s.puzzle, notes }) })),

  setWordLookup: (entries) => set({ wordLookup: buildWordLookup(entries) }),

  refreshWordLookup: async () => {
    const entries = await loadAllWords()
    get().setWordLookup(entries)
  },

  setWordsLoaded: (wordsLoaded) => set({ wordsLoaded }),

  pushHistory: () => {
    const { puzzle, history } = get()
    set({
      history: [...history.slice(-MAX_HISTORY + 1), structuredClone(puzzle)],
      future: [],
    })
  },

  selectCell: (row, col, toggleDirection = false) => {
    const { puzzle, selection } = get()
    if (puzzle.grid[row][col].isBlack) return

    const sameCell = selection.row === row && selection.col === col
    const direction = sameCell && toggleDirection
      ? selection.direction === 'across' ? 'down' : 'across'
      : selection.direction
    set({
      selection: { row, col, direction },
      placementDirection: direction,
    })
  },

  setDirection: (direction) =>
    set((s) => ({ selection: { ...s.selection, direction }, placementDirection: direction })),

  toggleBlack: (row, col) => {
    const { puzzle, symmetryEnabled, pushHistory } = get()
    pushHistory()

    const positions = blackSquarePositions(row, col, puzzle.size, symmetryEnabled)
    const allBlack = positions.every((p) => puzzle.grid[p.row][p.col].isBlack)
    let grid = setCellsBlack(cloneGrid(puzzle.grid), positions, !allBlack)
    grid = recalculateNumbers(grid)

    set({
      puzzle: touch({ ...puzzle, grid }),
      symmetryHighlight: positions,
    })
    setTimeout(() => set({ symmetryHighlight: null }), 400)
  },

  beginBlackSquareDrag: () =>
    set({ blackDragActive: true, blackDragPreview: null, blackDragHistoryRecorded: false }),

  endBlackSquareDrag: () =>
    set({ blackDragActive: false, blackDragPreview: null, blackDragHistoryRecorded: false }),

  setBlackDragPreview: (row, col) => {
    const { puzzle, symmetryEnabled } = get()
    set({ blackDragPreview: blackSquarePositions(row, col, puzzle.size, symmetryEnabled) })
  },

  clearBlackDragPreview: () => set({ blackDragPreview: null }),

  paintBlackSquare: (row, col) => {
    const state = get()
    if (!state.blackDragActive) return

    const positions = blackSquarePositions(row, col, state.puzzle.size, state.symmetryEnabled)
    const needsUpdate = positions.some((p) => !state.puzzle.grid[p.row][p.col].isBlack)
    if (!needsUpdate) {
      set({ blackDragPreview: positions })
      return
    }

    if (!state.blackDragHistoryRecorded) {
      get().pushHistory()
    }

    let grid = setCellsBlack(cloneGrid(state.puzzle.grid), positions, true)
    grid = recalculateNumbers(grid)

    set({
      puzzle: touch({ ...state.puzzle, grid }),
      blackDragPreview: positions,
      symmetryHighlight: positions,
      blackDragActive: true,
      blackDragHistoryRecorded: true,
    })
    setTimeout(() => set({ symmetryHighlight: null }), 400)
  },

  beginWordDrag: (word) =>
    set({ wordDragActive: true, wordDragWord: word, wordDragPreview: null }),

  endWordDrag: () =>
    set({ wordDragActive: false, wordDragWord: null, wordDragPreview: null }),

  setWordDragPreview: (row, col, direction) => {
    const { puzzle, wordDragWord, placementDirection } = get()
    if (!wordDragWord) return

    const dir = direction ?? placementDirection
    const normalized = normalizeAnswerWord(wordDragWord)
    const cells = getPlacementCells(puzzle.grid, row, col, dir, normalized)
    const valid = cells !== null && validatePlacement(puzzle.grid, cells, normalized)

    set({
      wordDragPreview: {
        word: normalized,
        row,
        col,
        direction: dir,
        cells: cells ?? [],
        valid,
      },
    })
  },

  clearWordDragPreview: () => set({ wordDragPreview: null }),

  placeWordAt: (row, col, direction, word) => {
    const { puzzle, pushHistory } = get()
    const normalized = normalizeAnswerWord(word)
    const cells = getPlacementCells(puzzle.grid, row, col, direction, normalized)
    if (!cells || !validatePlacement(puzzle.grid, cells, normalized)) return false

    pushHistory()
    let grid = fillWordInGrid(puzzle.grid, cells, normalized)
    grid = recalculateNumbers(grid)
    set({
      puzzle: touch({ ...puzzle, grid }),
      selection: { row, col, direction },
      placementDirection: direction,
    })
    return true
  },

  addAnswer: (word) => {
    const normalized = normalizeAnswerWord(word)
    if (!normalized) return
    set((s) => {
      const bank = s.puzzle.answerBank ?? []
      if (bank.includes(normalized)) return s
      return { puzzle: touch({ ...s.puzzle, answerBank: [...bank, normalized] }) }
    })
  },

  removeAnswer: (word) => {
    set((s) => ({
      puzzle: touch({
        ...s.puzzle,
        answerBank: (s.puzzle.answerBank ?? []).filter((w) => w !== word),
      }),
    }))
  },

  setPlacementDirection: (placementDirection) => set({ placementDirection }),

  setLetter: (letter) => {
    const { puzzle, selection, rebusMode, pushHistory } = get()
    const { row, col, direction } = selection
    const cell = puzzle.grid[row][col]
    if (cell.isBlack) return

    pushHistory()
    const grid = cloneGrid(puzzle.grid)

    if (rebusMode) {
      grid[row][col].isRebus = true
      grid[row][col].rebusValue = (cell.rebusValue ?? '') + letter.toUpperCase()
      grid[row][col].letter = null
    } else {
      grid[row][col].letter = letter.toUpperCase()
      grid[row][col].isRebus = false
      grid[row][col].rebusValue = null
    }

    const next = moveSelection(grid, row, col, direction, 1)
    set({
      puzzle: touch({ ...puzzle, grid }),
      selection: { row: next.row, col: next.col, direction },
    })
  },

  clearLetter: (moveBack = true) => {
    const { puzzle, selection, pushHistory } = get()
    const { row, col, direction } = selection
    pushHistory()

    const grid = cloneGrid(puzzle.grid)
    let r = row
    let c = col

    if (moveBack) {
      const prev = moveSelection(grid, row, col, direction, -1)
      r = prev.row
      c = prev.col
    }

    grid[r][c].letter = null
    grid[r][c].isRebus = false
    grid[r][c].rebusValue = null

    set({
      puzzle: touch({ ...puzzle, grid }),
      selection: { row: r, col: c, direction },
    })
  },

  fillCurrentWord: (word) => {
    const { puzzle, selection, pushHistory } = get()
    const slot = getWordAt(puzzle.grid, selection.row, selection.col, selection.direction)
    if (!slot) return
    pushHistory()
    const grid = fillWordInGrid(puzzle.grid, slot.cells, word)
    set({ puzzle: touch({ ...puzzle, grid }) })
  },

  clearGrid: () => {
    const { puzzle, pushHistory } = get()
    pushHistory()
    set({ puzzle: touch({ ...puzzle, grid: recalculateNumbers(clearGridLetters(puzzle.grid)) }) })
  },

  resetGrid: () => {
    const { puzzle, pushHistory } = get()
    pushHistory()
    set({ puzzle: touch({ ...puzzle, grid: resetGridAll(puzzle.grid), clues: { across: {}, down: {} } }) })
  },

  resizeGrid: (size) => {
    get().pushHistory()
    set({ puzzle: createPuzzle(size, get().puzzle.target) })
  },

  setSymmetryEnabled: (symmetryEnabled) => set({ symmetryEnabled }),
  setRebusMode: (rebusMode) => set({ rebusMode }),
  setZoom: (zoom) => set({ zoom }),

  setClue: (direction, number, text) => {
    set((s) => ({
      puzzle: touch({
        ...s.puzzle,
        clues: {
          ...s.puzzle.clues,
          [direction]: { ...s.puzzle.clues[direction], [number]: text },
        },
      }),
    }))
  },

  moveCursor: (dr, dc) => {
    const { puzzle, selection } = get()
    const nr = selection.row + dr
    const nc = selection.col + dc
    if (nr < 0 || nc < 0 || nr >= puzzle.size || nc >= puzzle.size) return
    if (puzzle.grid[nr][nc].isBlack) return
    set({ selection: { ...selection, row: nr, col: nc } })
  },

  tabToNext: (reverse = false) => {
    const { puzzle, selection } = get()
    const slots = extractAllSlots(puzzle.grid).filter((s) => s.direction === selection.direction)
    const currentIdx = slots.findIndex(
      (s) => s.cells.some((c) => c.row === selection.row && c.col === selection.col),
    )
    const nextIdx = reverse ? currentIdx - 1 : currentIdx + 1
    if (nextIdx >= 0 && nextIdx < slots.length) {
      const next = slots[nextIdx]
      set({ selection: { row: next.row, col: next.col, direction: selection.direction } })
      return
    }
    const empty = findNextEmptyCell(puzzle.grid, selection.row, selection.col, selection.direction)
    if (empty) set({ selection: { ...selection, ...empty } })
  },

  undo: () => {
    const { history, puzzle, future } = get()
    if (!history.length) return
    const prev = history[history.length - 1]
    set({
      history: history.slice(0, -1),
      future: [structuredClone(puzzle), ...future],
      puzzle: prev,
    })
  },

  redo: () => {
    const { future, puzzle, history } = get()
    if (!future.length) return
    const next = future[0]
    set({
      future: future.slice(1),
      history: [...history, structuredClone(puzzle)],
      puzzle: next,
    })
  },

  setShowGuidance: (showGuidance) => set({ showGuidance }),
  setShowAssist: (showAssist) => set({ showAssist }),
  setShowExport: (showExport) => set({ showExport }),

  setThemeConcept: (themeConcept) =>
    set((s) => ({ puzzle: touch({ ...s.puzzle, themeConcept }) })),

  toggleThemeSlot: (slotNumber) =>
    set((s) => {
      const current = s.puzzle.themeSlotNumbers ?? []
      const exists = current.includes(slotNumber)
      const themeSlotNumbers = exists
        ? current.filter((n) => n !== slotNumber)
        : [...current, slotNumber].sort((a, b) => a - b)
      return { puzzle: touch({ ...s.puzzle, themeSlotNumbers }) }
    }),

  applyThemeWord: (word, markTheme = true) => {
    const { puzzle, selection, pushHistory } = get()
    const slot = getWordAt(puzzle.grid, selection.row, selection.col, selection.direction)
    if (!slot) return
    pushHistory()
    const grid = fillWordInGrid(puzzle.grid, slot.cells, word)
    const num = puzzle.grid[selection.row]?.[selection.col]?.number
    let themeSlotNumbers = puzzle.themeSlotNumbers ?? []
    if (markTheme && num && !themeSlotNumbers.includes(num)) {
      themeSlotNumbers = [...themeSlotNumbers, num].sort((a, b) => a - b)
    }
    set({ puzzle: touch({ ...puzzle, grid, themeSlotNumbers }) })
  },

  jumpToSlot: (row, col, direction) =>
    set({ selection: { row, col, direction } }),

  jumpToSymmetricPartner: () => {
    const { puzzle, selection } = get()
    const slot = getWordAt(puzzle.grid, selection.row, selection.col, selection.direction)
    if (!slot) return
    const num = puzzle.grid[selection.row]?.[selection.col]?.number
    if (!num) return
    const fullSlot = {
      number: num,
      direction: selection.direction,
      row: selection.row,
      col: selection.col,
      length: slot.cells.length,
      word: slot.word,
      cells: slot.cells,
    }
    const partner = getSymmetricPartnerSlot(puzzle.grid, fullSlot)
    if (!partner) return
    set({ selection: { row: partner.row, col: partner.col, direction: partner.direction } })
  },

  navigateToIssue: (issue) => {
    if (issue.row !== undefined && issue.col !== undefined) {
      set({
        workspace: 'grid',
        selection: {
          row: issue.row,
          col: issue.col,
          direction: issue.direction ?? 'across',
        },
      })
    }
  },

  getIssues: () => validatePuzzle(get().puzzle, get().wordLookup),
  getCompliance: () => getComplianceStatus(get().getIssues()),
  getStats: () => computeStats(get().puzzle.grid, get().puzzle.target, get().puzzle.size),

  getCurrentSlot: () => {
    const { puzzle, selection } = get()
    const slot = getWordAt(puzzle.grid, selection.row, selection.col, selection.direction)
    const num = puzzle.grid[selection.row]?.[selection.col]?.number ?? null
    return slot ? { ...slot, direction: selection.direction, number: num } : {
      cells: [],
      word: '',
      direction: selection.direction,
      number: null,
    }
  },
}))
