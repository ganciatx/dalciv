import type { GameDefinition } from '../types';
import { PHASE_10_PHASES } from './phase10Phases';
import { YAHTZEE_CATEGORIES } from './yahtzeeCategories';

export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    id: 'yahtzee',
    name: 'Yahtzee',
    description: '13 categories · highest wins · 1–6 players',
    icon: '⚄',
    minPlayers: 1,
    maxPlayers: 6,
    scoringMode: 'categories',
    winCondition: 'highest',
    endCondition: { type: 'all_categories_filled' },
    categories: YAHTZEE_CATEGORIES,
  },
  {
    id: 'phase10',
    name: 'Phase 10',
    description: '10 phases · lowest wins · 2–6 players',
    icon: '🂡',
    minPlayers: 2,
    maxPlayers: 6,
    scoringMode: 'rounds',
    winCondition: 'lowest',
    endCondition: { type: 'first_to_complete_phase', phase: 10 },
    phases: PHASE_10_PHASES,
  },
  {
    id: 'mexican_train',
    name: 'Mexican Train',
    description: 'Pip count · lowest wins · 2–8 players',
    icon: '🁫',
    minPlayers: 2,
    maxPlayers: 8,
    scoringMode: 'rounds',
    winCondition: 'lowest',
    endCondition: { type: 'manual_only' },
  },
  {
    id: 'generic',
    name: 'Generic Scoreboard',
    description: 'Anything else · you pick the rules',
    icon: '∑',
    minPlayers: 1,
    maxPlayers: null,
    scoringMode: 'rounds',
    winCondition: 'highest',
    endCondition: { type: 'manual_only' },
  },
  {
    id: 'license_plate',
    name: 'License Plate Game',
    description: 'Road-trip checklist · spot plates · 1–6 players',
    icon: '🚗',
    minPlayers: 1,
    maxPlayers: 6,
    scoringMode: 'checklist',
    winCondition: 'highest',
    endCondition: { type: 'checklist_complete' },
  },
  {
    id: 'tic_tac_toe',
    name: 'Tic Tac Toe',
    description: 'Pass-and-play · track round wins · 2 players',
    icon: '⊞',
    minPlayers: 2,
    maxPlayers: 2,
    scoringMode: 'board',
    winCondition: 'highest',
    endCondition: { type: 'manual_only' },
  },
];

export function getGameDefinition(gameId: string): GameDefinition {
  const def = GAME_DEFINITIONS.find((g) => g.id === gameId);
  if (!def) {
    throw new Error(`Unknown game: ${gameId}`);
  }
  return def;
}
