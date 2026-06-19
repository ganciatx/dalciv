import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getGameDefinition } from '../games/definitions';
import { EndGameBanner } from '../components/EndGameBanner';
import { GameThemeScope } from '../components/GameThemeScope';
import { YahtzeeScoring } from '../components/scoring/YahtzeeScoring';
import { Phase10Scoring } from '../components/scoring/Phase10Scoring';
import { MexicanTrainScoring } from '../components/scoring/MexicanTrainScoring';
import { LicensePlateScoring } from '../components/scoring/LicensePlateScoring';
import { TicTacToeScoring } from '../components/scoring/TicTacToeScoring';
import { GenericScoring } from '../components/scoring/GenericScoring';
import { GameOverPage } from './GameOverPage';
import { useEffect, useState } from 'react';
import type { GameSession, HistoryEntry } from '../types';
import '../styles/scoring.css';

export function ScoringPage() {
  const navigate = useNavigate();
  const { session, completeGame } = useGame();
  const [gameOver, setGameOver] = useState<{
    entry: HistoryEntry;
    session: GameSession;
  } | null>(null);

  useEffect(() => {
    if (!session && !gameOver) {
      navigate('/');
    }
  }, [session, gameOver, navigate]);

  const handleEndGame = () => {
    const result = completeGame();
    if (result) {
      setGameOver(result);
    }
  };

  if (gameOver) {
    return (
      <GameOverPage session={gameOver.session} historyEntry={gameOver.entry} />
    );
  }

  if (!session) return null;

  const game = getGameDefinition(session.gameId);
  const roundLabel =
    game.scoringMode === 'rounds' && session.roundCount
      ? ` · Round ${session.roundCount}`
      : '';

  const ScoringView = {
    yahtzee: YahtzeeScoring,
    phase10: Phase10Scoring,
    mexican_train: MexicanTrainScoring,
    generic: GenericScoring,
    license_plate: LicensePlateScoring,
    tic_tac_toe: TicTacToeScoring,
  }[session.gameId];

  if (!ScoringView) return null;

  return (
    <GameThemeScope gameId={session.gameId}>
      <div className="page page-wide">
        <header className="scoring-header card scoring-header-bar">
          <div className="scoring-header-text">
            <span className="scoring-game-icon">{game.icon}</span>
            <div>
              <h1 className="scoring-title">
                {game.name}
                {roundLabel}
              </h1>
              <p className="scoring-meta muted">
                Started{' '}
                {new Date(session.startedAt).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            onClick={handleEndGame}
          >
            End Game
          </button>
        </header>

        <EndGameBanner onConfirmEnd={handleEndGame} />

        <ScoringView />
      </div>
    </GameThemeScope>
  );
}
