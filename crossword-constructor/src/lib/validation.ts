import type { Puzzle, ValidationIssue, WordEntry } from '@/types'
import {
  checkInterlock,
  extractAllSlots,
  getMaxWordCount,
  getStem,
  hasRotationalSymmetry,
  isChecked,
} from './grid'

function findUncheckedCells(grid: Puzzle['grid']): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid.length; col++) {
      if (grid[row][col].isBlack) continue
      if (!isChecked(grid, row, col)) {
        issues.push({
          id: 'UNCHECKED',
          level: 'error',
          message: `Unchecked square at row ${row + 1}, col ${col + 1}`,
          row,
          col,
        })
      }
    }
  }
  return issues
}

function findMinLengthViolations(grid: Puzzle['grid']): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const slot of extractAllSlots(grid)) {
    if (slot.length < 3) {
      issues.push({
        id: 'MIN_LENGTH',
        level: 'error',
        message: `${slot.direction} ${slot.number}: answer is only ${slot.length} letters`,
        row: slot.row,
        col: slot.col,
        slotNumber: slot.number,
        direction: slot.direction,
      })
    }
  }
  return issues
}

function findWordQualityIssues(
  grid: Puzzle['grid'],
  wordLookup: Map<string, WordEntry>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const complete = extractAllSlots(grid).filter((s) => !s.word.includes('?'))

  for (const slot of complete) {
    const entry = wordLookup.get(slot.word.toUpperCase())
    if (!entry) continue
    if (entry.score < 40) {
      issues.push({
        id: 'LOW_SCORE_WORD',
        level: 'warning',
        message: `${slot.word} scores ${entry.score}/100 — consider replacing`,
        row: slot.row,
        col: slot.col,
        slotNumber: slot.number,
        direction: slot.direction,
      })
    }
    if (entry.tags.includes('crosswordese')) {
      issues.push({
        id: 'CROSSWORDESE',
        level: 'warning',
        message: `${slot.word} is tagged as crosswordese`,
        row: slot.row,
        col: col(slot),
        slotNumber: slot.number,
        direction: slot.direction,
      })
    }
  }
  return issues
}

function col(slot: { row: number; col: number }) {
  return slot.col
}

function findDuplicateAnswers(grid: Puzzle['grid']): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const complete = extractAllSlots(grid).filter((s) => !s.word.includes('?'))
  const seen = new Map<string, typeof complete>()

  for (const slot of complete) {
    const key = slot.word.toUpperCase()
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key)!.push(slot)
  }

  for (const [word, slots] of seen) {
    if (slots.length > 1) {
      issues.push({
        id: 'DUPLICATE_ANSWER',
        level: 'warning',
        message: `"${word}" appears ${slots.length} times in the grid`,
        row: slots[0].row,
        col: slots[0].col,
        slotNumber: slots[0].number,
        direction: slots[0].direction,
      })
    }
  }
  return issues
}

function findNearDuplicates(grid: Puzzle['grid']): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const complete = extractAllSlots(grid).filter((s) => !s.word.includes('?'))
  const stems = new Map<string, string[]>()

  for (const slot of complete) {
    const stem = getStem(slot.word)
    if (!stems.has(stem)) stems.set(stem, [])
    stems.get(stem)!.push(slot.word.toUpperCase())
  }

  for (const [stem, words] of stems) {
    const unique = [...new Set(words)]
    if (unique.length > 1) {
      issues.push({
        id: 'NEAR_DUPLICATE',
        level: 'info',
        message: `Near-duplicate forms: ${unique.join(', ')} (stem: ${stem})`,
      })
    }
  }
  return issues
}

function findRebusIssues(grid: Puzzle['grid']): ValidationIssue[] {
  let count = 0
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isRebus) count++
    }
  }
  if (count === 0) return []
  return [{
    id: 'REBUS_PRESENT',
    level: 'info',
    message: `${count} rebus square(s) present — use sparingly for WSJ`,
  }]
}

function findClueIssues(puzzle: Puzzle): ValidationIssue[] {
  const slots = extractAllSlots(puzzle.grid)
  const issues: ValidationIssue[] = []
  let incomplete = 0

  for (const slot of slots) {
    if (slot.word.includes('?')) continue
    const clueMap = slot.direction === 'across' ? puzzle.clues.across : puzzle.clues.down
    if (!clueMap[slot.number]?.trim()) incomplete++
  }

  if (incomplete > 0) {
    issues.push({
      id: 'CLUE_INCOMPLETE',
      level: 'info',
      message: `${incomplete} clue(s) not yet written`,
    })
  }

  if (puzzle.target === 'WSJ' && !puzzle.title.trim()) {
    issues.push({
      id: 'MISSING_TITLE',
      level: 'info',
      message: 'WSJ puzzles require a title before export',
    })
  }

  return issues
}

function findProperNounCluster(
  grid: Puzzle['grid'],
  wordLookup: Map<string, WordEntry>,
  target: Puzzle['target'],
): ValidationIssue[] {
  if (target !== 'WSJ') return []

  const complete = extractAllSlots(grid).filter((s) => !s.word.includes('?'))
  const properNouns = complete.filter((s) => wordLookup.get(s.word.toUpperCase())?.tags.includes('proper_noun'))
  if (properNouns.length < 3) return []

  const domains = new Map<string, number>()
  for (const slot of properNouns) {
    const entry = wordLookup.get(slot.word.toUpperCase())
    const domain = entry?.tags.find((t) => t.startsWith('domain:'))?.replace('domain:', '') ?? 'general'
    domains.set(domain, (domains.get(domain) ?? 0) + 1)
  }

  for (const [domain, count] of domains) {
    if (count / properNouns.length > 0.2 && count >= 2) {
      return [{
        id: 'PROPER_NOUN_CLUSTER',
        level: 'warning',
        message: `${Math.round((count / properNouns.length) * 100)}% of proper nouns are from "${domain}"`,
      }]
    }
  }
  return []
}

export function validatePuzzle(
  puzzle: Puzzle,
  wordLookup: Map<string, WordEntry>,
): ValidationIssue[] {
  const { grid, target, size } = puzzle
  const issues: ValidationIssue[] = []

  if (!hasRotationalSymmetry(grid)) {
    issues.push({
      id: 'SYMMETRY',
      level: 'error',
      message: 'Grid lacks 180° rotational symmetry',
    })
  }

  if (!checkInterlock(grid)) {
    issues.push({
      id: 'INTERLOCK',
      level: 'error',
      message: 'White cells are not fully connected (broken interlock)',
    })
  }

  issues.push(...findUncheckedCells(grid))
  issues.push(...findMinLengthViolations(grid))

  const complete = extractAllSlots(grid).filter((s) => !s.word.includes('?'))
  const wordCount = complete.length
  const max = getMaxWordCount(target, size)

  if (wordCount > max) {
    issues.push({
      id: 'WORD_COUNT',
      level: 'error',
      message: `Word count ${wordCount} exceeds maximum of ${max}`,
    })
  } else if (wordCount >= max - 3) {
    issues.push({
      id: 'WORD_COUNT_NEAR',
      level: 'warning',
      message: `Word count ${wordCount} is within 3 of the ${max} maximum`,
    })
  }

  const totalCells = grid.length * grid.length
  let blackCount = 0
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isBlack) blackCount++
    }
  }
  const blackPct = (blackCount / totalCells) * 100
  if (blackPct > 17) {
    issues.push({
      id: 'BLACK_DENSITY',
      level: 'warning',
      message: `Black squares at ${blackPct.toFixed(1)}% (typical max ~17%)`,
    })
  }

  issues.push(...findWordQualityIssues(grid, wordLookup))
  issues.push(...findDuplicateAnswers(grid))
  issues.push(...findNearDuplicates(grid))
  issues.push(...findRebusIssues(grid))
  issues.push(...findClueIssues(puzzle))
  issues.push(...findProperNounCluster(grid, wordLookup, target))

  return issues
}

export function getComplianceStatus(issues: ValidationIssue[]): 'ok' | 'warning' | 'error' {
  if (issues.some((i) => i.level === 'error')) return 'error'
  if (issues.some((i) => i.level === 'warning')) return 'warning'
  return 'ok'
}

export function getPuzzlePhase(puzzle: Puzzle): 'empty' | 'partial' | 'complete' | 'clues' {
  const stats = puzzle.grid.flat().filter((c) => !c.isBlack)
  const filled = stats.filter((c) => c.letter || c.isRebus).length
  if (filled === 0) return 'empty'
  const slots = extractAllSlots(puzzle.grid)
  const complete = slots.filter((s) => !s.word.includes('?'))
  if (complete.length === slots.length && slots.length > 0) {
    const clueCount = Object.values(puzzle.clues.across).filter(Boolean).length +
      Object.values(puzzle.clues.down).filter(Boolean).length
    if (clueCount > 0) return 'clues'
    return 'complete'
  }
  return 'partial'
}
