export type PublicationTarget = 'NYT' | 'WSJ'
export type GridSize = 15 | 21
export type Workspace = 'home' | 'grid' | 'words' | 'clues'
export type Direction = 'across' | 'down'
export type ValidationLevel = 'error' | 'warning' | 'info'

export interface Cell {
  isBlack: boolean
  letter: string | null
  isRebus: boolean
  rebusValue: string | null
  number: number | null
}

export interface Puzzle {
  id: string
  title: string
  target: PublicationTarget
  size: GridSize
  grid: Cell[][]
  clues: {
    across: Record<number, string>
    down: Record<number, string>
  }
  createdAt: string
  updatedAt: string
  notes: string
  themeConcept?: string
  themeSlotNumbers?: number[]
  answerBank?: string[]
}

export interface WordDragPreview {
  word: string
  row: number
  col: number
  direction: Direction
  cells: { row: number; col: number }[]
  valid: boolean
}

export interface ThemeCandidate {
  word: string
  score: number
  matchReason: string
  length: number
}

export interface FillCandidate extends WordEntry {
  adjustedScore: number
}

export interface AssistSettings {
  provider: 'local' | 'ai'
  apiKey: string
  model: string
}

export interface AiThemeSuggestion {
  entries: string[]
  rationale: string
}

export interface WordEntry {
  word: string
  score: number
  tags: string[]
  excluded: boolean
}

export interface WordSlot {
  number: number
  direction: Direction
  row: number
  col: number
  length: number
  word: string
  cells: { row: number; col: number }[]
}

export type ValidationRuleId =
  | 'SYMMETRY'
  | 'INTERLOCK'
  | 'UNCHECKED'
  | 'MIN_LENGTH'
  | 'WORD_COUNT'
  | 'WORD_COUNT_NEAR'
  | 'BLACK_DENSITY'
  | 'LOW_SCORE_WORD'
  | 'CROSSWORDESE'
  | 'DUPLICATE_ANSWER'
  | 'PROPER_NOUN_CLUSTER'
  | 'REBUS_PRESENT'
  | 'MISSING_TITLE'
  | 'CLUE_INCOMPLETE'
  | 'NEAR_DUPLICATE'

export interface ValidationIssue {
  id: ValidationRuleId
  level: ValidationLevel
  message: string
  row?: number
  col?: number
  slotNumber?: number
  direction?: Direction
}

export interface PuzzleStats {
  wordCount: number
  maxWordCount: number
  blackCount: number
  blackPercent: number
  avgWordLength: number
  threeLetterCount: number
  fillPercent: number
  whiteCellCount: number
  filledCellCount: number
}

export interface PuzzleSummary {
  id: string
  title: string
  target: PublicationTarget
  size: GridSize
  createdAt: string
  updatedAt: string
}

export interface RecentPuzzle {
  id: string
  title: string
  updatedAt: string
}

export interface ClueRecord {
  answer: string
  clue: string
  source?: string
}

export interface ExportFormat {
  id: 'puz' | 'nyt-text' | 'wsj-text' | 'pdf' | 'json'
  label: string
  targets: PublicationTarget[]
}
