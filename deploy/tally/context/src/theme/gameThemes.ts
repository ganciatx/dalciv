/** Per-game accent tokens — applied via `data-game-theme` on a scope element. */
export type GameThemeId =
  | 'default'
  | 'yahtzee'
  | 'phase10'
  | 'mexican_train'
  | 'generic'
  | 'license_plate'
  | 'tic_tac_toe';

export const GAME_THEME_IDS: GameThemeId[] = [
  'default',
  'yahtzee',
  'phase10',
  'mexican_train',
  'generic',
  'license_plate',
  'tic_tac_toe',
];

export function resolveGameTheme(gameId?: string | null): GameThemeId {
  if (gameId && GAME_THEME_IDS.includes(gameId as GameThemeId)) {
    return gameId as GameThemeId;
  }
  return 'default';
}
