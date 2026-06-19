/** Core domain types for the Scorekeeper (Tally) MVP. */

export type ScoringMode = 'categories' | 'rounds' | 'checklist' | 'board';
export type WinCondition = 'highest' | 'lowest';

export type EndCondition =
  | { type: 'all_categories_filled' }
  | { type: 'fixed_rounds'; rounds: number }
  | { type: 'first_to_complete_phase'; phase: number }
  | { type: 'player_count_threshold'; perPlayerRounds: number }
  | { type: 'checklist_complete' }
  | { type: 'manual_only' };

export type YahtzeeCategoryKind = 'sum' | 'fixed';

export type YahtzeeCategory = {
  id: string;
  label: string;
  section: 'upper' | 'lower';
  kind: YahtzeeCategoryKind;
  fixedValue?: number;
  /** Highest legal score (upper: face×5; lower sum boxes: 30). */
  maxScore?: number;
  /** Upper-section face value — score must be a multiple of this (or 0). */
  faceValue?: number;
};

export type Phase10Phase = {
  phase: number;
  requirement: string;
  shortLabel: string;
};

export type LicensePlateRegion = {
  id: string;
  label: string;
  group: 'us' | 'canada';
};

export type GameDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number | null;
  scoringMode: ScoringMode;
  winCondition: WinCondition;
  endCondition: EndCondition;
  /** Yahtzee-only category list. */
  categories?: YahtzeeCategory[];
  /** Phase 10-only phase requirement list. */
  phases?: Phase10Phase[];
};

export type Player = {
  id: string;
  name: string;
  color: string;
  /** Yahtzee: categoryId -> score (null = unfilled). */
  categoryScores?: Record<string, number | null>;
  /** Number of +100 Yahtzee bonus chips earned after first Yahtzee. */
  yahtzeeBonusCount?: number;
  /** Phase 10: current phase attempt (1–10). */
  currentPhase?: number;
  /** Phase 10: per-round score entries. */
  roundScores?: number[];
  /** Phase 10: whether the player completed their phase each round. */
  phaseCompletedPerRound?: boolean[];
  /** Generic: running total ledger. */
  runningTotal?: number;
  /** License plate (competitive): regionId -> spotted. */
  spottedRegions?: Record<string, boolean>;
  /** Tic tac toe: round wins in this session. */
  matchWins?: number;
};

export type GameSession = {
  id: string;
  gameId: string;
  players: Player[];
  status: 'in_progress' | 'completed';
  startedAt: string;
  endedAt?: string;
  winnerPlayerId?: string;
  /** Generic-only override chosen at setup. */
  genericWinCondition?: WinCondition;
  /** Number of rounds entered (rounds-mode games). */
  roundCount?: number;
  /** License plate: one shared checklist for the car. */
  licensePlateCooperative?: boolean;
  /** License plate: include Canadian provinces/territories. */
  includeCanada?: boolean;
  /** License plate (cooperative): shared region checkoffs. */
  sharedSpottedRegions?: Record<string, boolean>;
  /** Tic tac toe: 9 cells — player id or empty. */
  tttBoard?: (string | null)[];
  /** Tic tac toe: whose turn to place a mark. */
  tttTurnPlayerId?: string;
  /** Tic tac toe: round finished — wait for Next round. */
  tttRoundOver?: boolean;
  /** Tic tac toe: round winner id (undefined on draw). */
  tttRoundWinnerId?: string | null;
};

export type HistoryEntry = {
  sessionId: string;
  gameId: string;
  gameName: string;
  playerNames: string[];
  winnerName: string;
  finalScores: Record<string, number>;
  completedAt: string;
};

export type RoundEntry = {
  scores: Record<string, number | null>;
  phaseCompleted: Record<string, boolean>;
};

/** Options passed from player setup into session creation. */
export type StartSessionOptions = {
  genericWinCondition?: WinCondition;
  licensePlateCooperative?: boolean;
  includeCanada?: boolean;
};
