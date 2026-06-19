import { useGame } from '../../context/GameContext';
import { getGameDefinition } from '../../games/definitions';
import {
  emptyTttBoard,
  evaluateTttBoard,
  nextTttTurn,
  TTT_WIN_LINES,
} from '../../utils/ticTacToe';
import { playerScore } from '../../utils/scoring';
import { PlayerChip } from '../PlayerChip';
import { StandingsPanel } from '../StandingsPanel';
import '../../styles/tic-tac-toe.css';

/** Pass-and-play tic tac toe with session win tracking. */
export function TicTacToeScoring() {
  const { session, updateSession } = useGame();

  if (!session || session.players.length < 2) return null;

  const [playerX, playerO] = session.players;
  const game = getGameDefinition('tic_tac_toe');
  const board = session.tttBoard ?? emptyTttBoard();
  const turnId = session.tttTurnPlayerId ?? playerX.id;
  const roundOver = session.tttRoundOver ?? false;
  const roundWinnerId = session.tttRoundWinnerId;

  const winningLine = (() => {
    if (!roundOver || roundWinnerId === null || roundWinnerId === undefined) {
      return null;
    }
    for (const line of TTT_WIN_LINES) {
      const [a, b, c] = line;
      if (board[a] === roundWinnerId && board[b] === roundWinnerId && board[c] === roundWinnerId) {
        return line;
      }
    }
    return null;
  })();

  const markForPlayer = (playerId: string) => (playerId === playerX.id ? 'X' : 'O');

  const handleCellClick = (index: number) => {
    if (roundOver || board[index]) return;
    if (turnId !== playerX.id && turnId !== playerO.id) return;

    updateSession((prev) => {
      const prevBoard = [...(prev.tttBoard ?? emptyTttBoard())];
      prevBoard[index] = turnId;
      const result = evaluateTttBoard(prevBoard);
      const ids = [playerX.id, playerO.id] as [string, string];

      if (result.status === 'won') {
        return {
          ...prev,
          tttBoard: prevBoard,
          tttRoundOver: true,
          tttRoundWinnerId: result.winnerId,
          players: prev.players.map((p) =>
            p.id === result.winnerId
              ? { ...p, matchWins: (p.matchWins ?? 0) + 1 }
              : p,
          ),
        };
      }

      if (result.status === 'draw') {
        return {
          ...prev,
          tttBoard: prevBoard,
          tttRoundOver: true,
          tttRoundWinnerId: null,
        };
      }

      return {
        ...prev,
        tttBoard: prevBoard,
        tttTurnPlayerId: nextTttTurn(turnId, ids),
      };
    });
  };

  const startNextRound = () => {
    updateSession((prev) => ({
      ...prev,
      tttBoard: emptyTttBoard(),
      tttTurnPlayerId: playerX.id,
      tttRoundOver: false,
      tttRoundWinnerId: null,
    }));
  };

  const turnPlayer = session.players.find((p) => p.id === turnId);
  const roundMessage = roundOver
    ? roundWinnerId
      ? `${session.players.find((p) => p.id === roundWinnerId)?.name} wins the round!`
      : 'Draw — no winner this round'
    : `${turnPlayer?.name}'s turn (${markForPlayer(turnId)})`;

  return (
    <div className="scoring-layout two-pane scoring-readable">
      <div className="ttt-main">
        <p className="ttt-status card">{roundMessage}</p>

        <div className="ttt-board card" role="grid" aria-label="Tic tac toe board">
          {board.map((cell, index) => {
            const onLine = winningLine?.includes(index);
            return (
              <button
                key={index}
                type="button"
                className={`ttt-cell ${cell ? 'filled' : ''} ${onLine ? 'winning' : ''}`}
                disabled={!!cell || roundOver}
                onClick={() => handleCellClick(index)}
                aria-label={`Cell ${index + 1}`}
              >
                {cell ? (
                  <span
                    className={`ttt-mark ttt-mark--${cell === playerX.id ? 'x' : 'o'}`}
                    style={{ color: session.players.find((p) => p.id === cell)?.color }}
                  >
                    {markForPlayer(cell)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="ttt-legend">
          <span>
            <PlayerChip name={playerX.name} color={playerX.color} size="sm" />
            {playerX.name} = X
          </span>
          <span>
            <PlayerChip name={playerO.name} color={playerO.color} size="sm" />
            {playerO.name} = O
          </span>
        </div>

        {roundOver && (
          <button type="button" className="btn btn-primary btn-block" onClick={startNextRound}>
            Next round →
          </button>
        )}

        <div className="ttt-scores card">
          {session.players.map((p) => (
            <div key={p.id} className="ttt-score-row">
              <PlayerChip name={p.name} color={p.color} size="sm" />
              <span>{p.name}</span>
              <strong>{playerScore(p, game, session)} wins</strong>
            </div>
          ))}
        </div>

        <p className="muted ttt-hint">Pass the device between turns · End Game when finished</p>
      </div>

      <div className="two-pane-side hide-mobile">
        <StandingsPanel session={session} />
      </div>
    </div>
  );
}
