import type { Cell, GridSize, Puzzle } from '@/types'

export function createEmptyGrid(size: number): Cell[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, (): Cell => ({
      isBlack: false,
      letter: null,
      isRebus: false,
      rebusValue: null,
      number: null,
    })),
  )
}

export function symmetricPosition(row: number, col: number, size: number): { row: number; col: number } {
  return { row: size - 1 - row, col: size - 1 - col }
}

/** Cells affected when placing a black square (includes 180° partner when symmetry is on). */
export function blackSquarePositions(
  row: number,
  col: number,
  size: number,
  useSymmetry: boolean,
): { row: number; col: number }[] {
  const positions = [{ row, col }]
  if (!useSymmetry) return positions

  const sym = symmetricPosition(row, col, size)
  const isCenter = sym.row === row && sym.col === col
  if (!isCenter) positions.push(sym)
  return positions
}

/** Set one or more cells to black or white, clearing letter data when blackened. */
export function setCellsBlack(
  grid: Cell[][],
  positions: { row: number; col: number }[],
  isBlack: boolean,
): Cell[][] {
  const next = cloneGrid(grid)
  for (const { row, col } of positions) {
    const cell = next[row][col]
    cell.isBlack = isBlack
    if (isBlack) {
      cell.letter = null
      cell.isRebus = false
      cell.rebusValue = null
    }
  }
  return next
}

export function cloneGrid(grid: Cell[][]): Cell[][] {
  return grid.map((row) => row.map((cell) => ({ ...cell })))
}

export function createPuzzle(size: GridSize = 15, target: Puzzle['target'] = 'NYT'): Puzzle {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Puzzle',
    target,
    size,
    grid: createEmptyGrid(size),
    clues: { across: {}, down: {} },
    createdAt: now,
    updatedAt: now,
    notes: '',
  }
}

export function getMaxWordCount(target: Puzzle['target'], size: GridSize): number {
  void target
  return size === 15 ? 78 : 140
}

export function recalculateNumbers(grid: Cell[][]): Cell[][] {
  const size = grid.length
  const next = cloneGrid(grid)
  let num = 1

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = next[row][col]
      if (cell.isBlack) {
        cell.number = null
        continue
      }

      const startsAcross =
        (col === 0 || next[row][col - 1].isBlack) &&
        col < size - 1 &&
        !next[row][col + 1].isBlack

      const startsDown =
        (row === 0 || next[row - 1][col].isBlack) &&
        row < size - 1 &&
        !next[row + 1][col].isBlack

      if (startsAcross || startsDown) {
        cell.number = num++
      } else {
        cell.number = null
      }
    }
  }

  return next
}

export function hasRotationalSymmetry(grid: Cell[][]): boolean {
  const size = grid.length
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const sym = symmetricPosition(row, col, size)
      if (grid[row][col].isBlack !== grid[sym.row][sym.col].isBlack) {
        return false
      }
    }
  }
  return true
}

export function getWordAt(
  grid: Cell[][],
  row: number,
  col: number,
  direction: 'across' | 'down',
): { cells: { row: number; col: number }[]; word: string } | null {
  const size = grid.length
  if (row < 0 || col < 0 || row >= size || col >= size || grid[row][col].isBlack) {
    return null
  }

  let startRow = row
  let startCol = col

  if (direction === 'across') {
    while (startCol > 0 && !grid[startRow][startCol - 1].isBlack) startCol--
  } else {
    while (startRow > 0 && !grid[startRow - 1][startCol].isBlack) startRow--
  }

  const cells: { row: number; col: number }[] = []
  let word = ''
  let r = startRow
  let c = startCol

  while (r < size && c < size && !grid[r][c].isBlack) {
    cells.push({ row: r, col: c })
    const val = grid[r][c].isRebus ? grid[r][c].rebusValue : grid[r][c].letter
    word += val ?? '?'
    if (direction === 'across') c++
    else r++
  }

  return { cells, word }
}

export function isChecked(grid: Cell[][], row: number, col: number): boolean {
  if (grid[row][col].isBlack) return true
  const across = getWordAt(grid, row, col, 'across')
  const down = getWordAt(grid, row, col, 'down')
  return (across?.cells.length ?? 0) >= 3 && (down?.cells.length ?? 0) >= 3
}

export function checkInterlock(grid: Cell[][]): boolean {
  const size = grid.length
  const visited = Array.from({ length: size }, () => Array(size).fill(false))
  let start: { row: number; col: number } | null = null

  for (let row = 0; row < size && !start; row++) {
    for (let col = 0; col < size && !start; col++) {
      if (!grid[row][col].isBlack) start = { row, col }
    }
  }

  if (!start) return true

  const stack = [start]
  visited[start.row][start.col] = true
  let count = 0

  while (stack.length) {
    const { row, col } = stack.pop()!
    count++
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ]
    for (const [nr, nc] of neighbors) {
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue
      if (grid[nr][nc].isBlack || visited[nr][nc]) continue
      visited[nr][nc] = true
      stack.push({ row: nr, col: nc })
    }
  }

  let whiteCount = 0
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!grid[row][col].isBlack) whiteCount++
    }
  }

  return count === whiteCount
}

export function moveSelection(
  grid: Cell[][],
  row: number,
  col: number,
  direction: 'across' | 'down',
  delta: number,
): { row: number; col: number } {
  const size = grid.length
  let r = row
  let c = col

  if (direction === 'across') {
    c += delta
    while (c >= 0 && c < size && grid[r][c].isBlack) c += delta > 0 ? 1 : -1
  } else {
    r += delta
    while (r >= 0 && r < size && grid[r][c].isBlack) r += delta > 0 ? 1 : -1
  }

  if (r < 0 || c < 0 || r >= size || c >= size || grid[r][c].isBlack) {
    return { row, col }
  }
  return { row: r, col: c }
}

export function findNextEmptyCell(
  grid: Cell[][],
  row: number,
  col: number,
  direction: 'across' | 'down',
): { row: number; col: number } | null {
  const slot = getWordAt(grid, row, col, direction)
  if (!slot) return null

  const idx = slot.cells.findIndex((c) => c.row === row && c.col === col)
  for (let i = idx + 1; i < slot.cells.length; i++) {
    const { row: r, col: c } = slot.cells[i]
    if (!grid[r][c].letter && !grid[r][c].isRebus) return { row: r, col: c }
  }

  const size = grid.length
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].isBlack || grid[r][c].letter || grid[r][c].isRebus) continue
      const w = getWordAt(grid, r, c, direction)
      if (w && w.cells.length >= 3) return { row: r, col: c }
    }
  }
  return null
}

export function normalizeAnswerWord(word: string): string {
  return word.replace(/\s+/g, '').toUpperCase()
}

/** Cell coordinates for placing a word anchored at (row, col) as the first letter. */
export function getPlacementCells(
  grid: Cell[][],
  row: number,
  col: number,
  direction: 'across' | 'down',
  word: string,
): { row: number; col: number }[] | null {
  const normalized = normalizeAnswerWord(word)
  if (!normalized.length) return null

  const size = grid.length
  const cells: { row: number; col: number }[] = []

  for (let i = 0; i < normalized.length; i++) {
    const r = direction === 'across' ? row : row + i
    const c = direction === 'across' ? col + i : col
    if (r < 0 || c < 0 || r >= size || c >= size) return null
    cells.push({ row: r, col: c })
  }

  return cells
}

export function validatePlacement(
  grid: Cell[][],
  cells: { row: number; col: number }[],
  word: string,
): boolean {
  const normalized = normalizeAnswerWord(word)
  if (cells.length !== normalized.length) return false

  for (let i = 0; i < cells.length; i++) {
    const { row, col } = cells[i]
    const cell = grid[row][col]
    if (cell.isBlack) return false
    const existing = cell.isRebus ? cell.rebusValue : cell.letter
    if (existing && existing.toUpperCase() !== normalized[i]) return false
  }

  return true
}

export function fillWordInGrid(
  grid: Cell[][],
  cells: { row: number; col: number }[],
  word: string,
): Cell[][] {
  const next = cloneGrid(grid)
  for (let i = 0; i < cells.length; i++) {
    const { row, col } = cells[i]
    next[row][col].letter = word[i]?.toUpperCase() ?? null
    next[row][col].isRebus = false
    next[row][col].rebusValue = null
  }
  return next
}

export function clearGridLetters(grid: Cell[][]): Cell[][] {
  return grid.map((row) =>
    row.map((cell) =>
      cell.isBlack
        ? { ...cell }
        : { ...cell, letter: null, isRebus: false, rebusValue: null },
    ),
  )
}

export function resetGridAll(grid: Cell[][]): Cell[][] {
  return createEmptyGrid(grid.length as GridSize)
}

export function computeStats(grid: Cell[][], target: Puzzle['target'], size: GridSize): import('@/types').PuzzleStats {
  const slots = extractAllSlots(grid)
  const complete = slots.filter((s) => !s.word.includes('?'))
  const wordCount = complete.length
  const maxWordCount = getMaxWordCount(target, size)

  let blackCount = 0
  let whiteCount = 0
  let filled = 0

  for (const row of grid) {
    for (const cell of row) {
      if (cell.isBlack) blackCount++
      else {
        whiteCount++
        if (cell.letter || cell.isRebus) filled++
      }
    }
  }

  const totalCells = grid.length * grid.length
  const lengths = complete.map((s) => s.length)
  const avgWordLength = lengths.length
    ? lengths.reduce((a, b) => a + b, 0) / lengths.length
    : 0
  const threeLetterCount = complete.filter((s) => s.length === 3).length

  return {
    wordCount,
    maxWordCount,
    blackCount,
    blackPercent: totalCells ? (blackCount / totalCells) * 100 : 0,
    avgWordLength,
    threeLetterCount,
    fillPercent: whiteCount ? (filled / whiteCount) * 100 : 0,
    whiteCellCount: whiteCount,
    filledCellCount: filled,
  }
}

export function extractAllSlots(grid: Cell[][]): import('@/types').WordSlot[] {
  const size = grid.length
  const slots: import('@/types').WordSlot[] = []
  const seen = new Set<string>()

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = grid[row][col]
      if (cell.isBlack || !cell.number) continue

      for (const direction of ['across', 'down'] as const) {
        const starts =
          direction === 'across'
            ? (col === 0 || grid[row][col - 1].isBlack) && col < size - 1 && !grid[row][col + 1].isBlack
            : (row === 0 || grid[row - 1][col].isBlack) && row < size - 1 && !grid[row + 1][col].isBlack

        if (!starts) continue

        const result = getWordAt(grid, row, col, direction)
        if (!result || result.cells.length < 3) continue

        const key = `${direction}-${row}-${col}`
        if (seen.has(key)) continue
        seen.add(key)

        slots.push({
          number: cell.number,
          direction,
          row,
          col,
          length: result.cells.length,
          word: result.word,
          cells: result.cells,
        })
      }
    }
  }

  return slots.sort((a, b) =>
    a.number !== b.number ? a.number - b.number : a.direction.localeCompare(b.direction),
  )
}

export function wordToPattern(word: string): string {
  return word.replace(/[^A-Z?]/gi, '?').toUpperCase()
}

export function getStem(word: string): string {
  const w = word.toUpperCase()
  if (w.endsWith('S') && w.length >= 4) return w.slice(0, -1)
  if (w.endsWith('ED') && w.length > 5) return w.slice(0, -2)
  if (w.endsWith('ING') && w.length > 6) return w.slice(0, -3)
  return w
}

/** Start cell of the 180°-symmetric partner slot (same direction, same length). */
export function symmetricSlotStart(
  row: number,
  col: number,
  length: number,
  direction: 'across' | 'down',
  size: number,
): { row: number; col: number } {
  if (direction === 'across') {
    return { row: size - 1 - row, col: size - 1 - col - (length - 1) }
  }
  return { row: size - 1 - row - (length - 1), col: size - 1 - col }
}

export function getSymmetricPartnerSlot(
  grid: Cell[][],
  slot: import('@/types').WordSlot,
): import('@/types').WordSlot | null {
  const size = grid.length
  const start = symmetricSlotStart(slot.row, slot.col, slot.length, slot.direction, size)
  if (start.row < 0 || start.col < 0 || start.row >= size || start.col >= size) return null
  if (grid[start.row][start.col].isBlack) return null

  const result = getWordAt(grid, start.row, start.col, slot.direction)
  if (!result || result.cells.length !== slot.length) return null

  const number = grid[start.row][start.col].number
  if (!number) return null

  return {
    number,
    direction: slot.direction,
    row: start.row,
    col: start.col,
    length: result.cells.length,
    word: result.word,
    cells: result.cells,
  }
}

export function collectGridWords(grid: Cell[][]): Set<string> {
  const words = new Set<string>()
  for (const slot of extractAllSlots(grid)) {
    if (!slot.word.includes('?')) words.add(slot.word.toUpperCase())
  }
  return words
}
