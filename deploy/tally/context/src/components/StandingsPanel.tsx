import type { GameSession } from '../types';
import { getGameDefinition } from '../games/definitions';
import { effectiveWinCondition, sortedStandings } from '../utils/scoring';
import { PlayerChip } from './PlayerChip';
import '../styles/standings.css';

type Props = {
  session: GameSession;
};

/** Persistent standings sidebar (tablet/desktop two-pane layout). */
export function StandingsPanel({ session }: Props) {
  const game = getGameDefinition(session.gameId);
  const win = effectiveWinCondition(game, session);
  const standings = sortedStandings(session, game);

  return (
    <aside className="card standings-panel score-pad">
      <p className="standings-label">
        Standings · {win === 'highest' ? 'Highest wins' : 'Lowest wins'}
      </p>
      <ol className="standings-compact">
        {standings.map(({ player, score, rank }) => (
          <li key={player.id} className="standings-compact-row">
            <span className="standing-rank">{rank === 1 ? '♛' : rank}</span>
            <PlayerChip name={player.name} color={player.color} size="sm" />
            <span className="standings-compact-name">{player.name}</span>
            <strong>{score}</strong>
          </li>
        ))}
      </ol>
    </aside>
  );
}
