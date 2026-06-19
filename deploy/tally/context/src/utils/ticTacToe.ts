/** Tic-tac-toe board helpers — 3×3 grid indexed 0–8. */

export const TTT_WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export type TttRoundResult =
  | { status: 'playing' }
  | { status: 'won'; winnerId: string }
  | { status: 'draw' };

export function emptyTttBoard(): (string | null)[] {
  return Array.from({ length: 9 }, () => null);
}

/** Resolve winner or draw after a move; returns playing if game continues. */
export function evaluateTttBoard(board: (string | null)[]): TttRoundResult {
  for (const [a, b, c] of TTT_WIN_LINES) {
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) {
      return { status: 'won', winnerId: mark };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { status: 'draw' };
  }
  return { status: 'playing' };
}

/** Next player in a two-player pass-and-play rotation. */
export function nextTttTurn(currentId: string, playerIds: [string, string]): string {
  return currentId === playerIds[0] ? playerIds[1] : playerIds[0];
}
