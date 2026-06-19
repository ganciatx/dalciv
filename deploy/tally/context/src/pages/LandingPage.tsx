import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GAME_DEFINITIONS, getGameDefinition } from '../games/definitions';
import type { HistoryEntry } from '../types';
import '../styles/landing.css';
import '../styles/game-picker.css';

function lastPlayedEntry(
  history: HistoryEntry[],
  gameId: string,
): HistoryEntry | undefined {
  return history.find((entry) => entry.gameId === gameId);
}

function formatGameTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function gameTimeLabel(
  gameId: string,
  history: HistoryEntry[],
  inProgressGameId?: string,
  startedAt?: string,
): string {
  if (inProgressGameId === gameId && startedAt) {
    return `In progress · ${formatGameTime(startedAt)}`;
  }
  const last = lastPlayedEntry(history, gameId);
  if (last) {
    return `Last played ${formatGameTime(last.completedAt)}`;
  }
  return 'Not played yet';
}

export function LandingPage() {
  const { session, history } = useGame();
  const inProgress =
    session?.status === 'in_progress' ? getGameDefinition(session.gameId) : null;

  return (
    <div className="page landing-page">
      <header className="landing-hero">
        <h1 className="landing-title">Tally</h1>
        <p className="landing-tagline">No account · saved on this device</p>
      </header>

      {inProgress && session && (
        <section className="card landing-resume">
          <p className="landing-section-label">IN PROGRESS</p>
          <h2>{inProgress.name}</h2>
          <p className="muted landing-resume-players">
            {session.players.map((p) => p.name).join(' · ')}
          </p>
          <p className="landing-game-time landing-game-time--active">
            Started {formatGameTime(session.startedAt)}
          </p>
          <Link to="/game" className="btn btn-primary btn-block">
            Resume →
          </Link>
        </section>
      )}

      <section className="landing-games">
        <p className="landing-section-label landing-section-label--on-dark">Start a game</p>
        <div className="landing-game-grid">
          {GAME_DEFINITIONS.map((game) => (
            <Link
              key={game.id}
              to={`/setup/${game.id}`}
              className="game-card landing-game-tile"
              data-game-theme={game.id}
            >
              <div className="game-card-edge">
                <div className="game-card-face landing-game-face">
                  <span className="game-card-accent-bar" aria-hidden />
                  <div className="game-card-medallion landing-game-medallion">
                    <span className="game-icon">{game.icon}</span>
                  </div>
                  <div className="game-card-copy">
                    <span className="game-name">{game.name}</span>
                    <p className="landing-game-time">
                      {gameTimeLabel(
                        game.id,
                        history,
                        session?.status === 'in_progress' ? session.gameId : undefined,
                        session?.startedAt,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="landing-actions sticky-footer">
        <Link to="/history" className="btn btn-secondary btn-block">
          History
        </Link>
      </div>
    </div>
  );
}
