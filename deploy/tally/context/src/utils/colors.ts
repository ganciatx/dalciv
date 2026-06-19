/** Player palette — BGCP vintage board-game colors */
export const PLAYER_COLORS = [
  '#5b92b0',
  '#d25c42',
  '#425f6c',
  '#c97840',
  '#3b3251',
  '#7a6888',
  '#b84a32',
  '#4a7d96',
];

export function playerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}
