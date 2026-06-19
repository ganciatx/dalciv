import { Link } from 'react-router-dom';
import { getGameDefinition } from '../games/definitions';
import { sortedStandings } from '../utils/scoring';
import type { GameSession, HistoryEntry } from '../types';
import { GameThemeScope } from '../components/GameThemeScope';
import { PlayerChip } from '../components/PlayerChip';
import '../styles/game-over.css';

type Props = {
  session: GameSession;
  historyEntry: HistoryEntry;
};

export function GameOverPage({ session }: Props) {
  const game = getGameDefinition(session.gameId);
  const standings = sortedStandings(session, game);
  const winnerId = session.winnerPlayerId;

  return (
    <GameThemeScope gameId={session.gameId}>
      <div className="page">
        <header className="game-over-header">
          <p className="game-over-eyebrow">Final standings</p>
          <h1>Game Over</h1>
          <p className="game-over-game">
            <span className="game-icon-inline">{game.icon}</span> {game.name}
          </p>
        </header>

        <ol className="standings-list score-pad">
          {standings.map(({ player, score, rank }) => (
            <li
              key={player.id}
              className={`standing-row ${player.id === winnerId ? 'winner' : ''}`}
            >
              <span className="standing-rank">
                {player.id === winnerId ? '♛' : rank}
              </span>
              <PlayerChip name={player.name} color={player.color} size="md" />
              <span className="standing-name">{player.name}</span>
              <strong className="standing-score">{score}</strong>
            </li>
          ))}
        </ol>

        <div className="game-over-actions sticky-footer">
          <Link
            to={`/setup/${session.gameId}`}
            state={{ fromGameOver: true }}
            className="btn btn-primary btn-block"
          >
            New Game (same game)
          </Link>
          <Link to="/" className="btn btn-secondary btn-block">
            Done
          </Link>
        </div>
      </div>
    </GameThemeScope>
  );
}
