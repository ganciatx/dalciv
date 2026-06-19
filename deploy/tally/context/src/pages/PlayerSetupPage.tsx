import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getGameDefinition } from '../games/definitions';
import type { WinCondition } from '../types';
import { playerColor } from '../utils/colors';
import { GameThemeScope } from '../components/GameThemeScope';
import { PlayerChip } from '../components/PlayerChip';
import '../styles/player-setup.css';

export function PlayerSetupPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { startSession } = useGame();
  const game = getGameDefinition(gameId!);
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: game.minPlayers }, () => ''),
  );
  const [winCondition, setWinCondition] = useState<WinCondition>('highest');
  const [licensePlateCooperative, setLicensePlateCooperative] = useState(false);
  const [includeCanada, setIncludeCanada] = useState(false);
  const [draftName, setDraftName] = useState('');

  const filledNames = names.filter((n) => n.trim().length > 0);
  const canAdd =
    game.maxPlayers === null || names.length < game.maxPlayers;
  const canStart =
    filledNames.length >= game.minPlayers &&
    (game.maxPlayers === null || filledNames.length <= game.maxPlayers);

  const addFromDraft = () => {
    const trimmed = draftName.trim();
    if (!trimmed || !canAdd) return;
    setNames((prev) => [...prev, trimmed]);
    setDraftName('');
  };

  const removePlayer = (index: number) => {
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const handleStart = () => {
    const players = filledNames.map((n) => n.trim());
    startSession(game.id, players, {
      ...(game.id === 'generic' ? { genericWinCondition: winCondition } : {}),
      ...(game.id === 'license_plate'
        ? { licensePlateCooperative, includeCanada }
        : {}),
    });
    navigate('/game');
  };

  const limitLabel =
    game.maxPlayers === null
      ? `${game.minPlayers}+ players · ${filledNames.length} added`
      : `${game.minPlayers}–${game.maxPlayers} players · ${filledNames.length} added`;

  return (
    <GameThemeScope gameId={game.id}>
      <div className="page">
      <header className="page-header">
        <Link to="/pick-game" className="back-btn">
          ‹
        </Link>
        <h1 className="page-title">Add players</h1>
      </header>

      <p className="setup-game-label card">
        <span className="game-icon-inline">{game.icon}</span> {game.name}
      </p>

      <div className="player-list">
        {names.map((name, index) => (
          <div key={index} className="player-row">
            <PlayerChip
              name={name || `Player ${index + 1}`}
              color={playerColor(index)}
              size="md"
            />
            <input
              className="player-input"
              placeholder={`Player ${index + 1}`}
              value={name}
              onChange={(e) => updateName(index, e.target.value)}
            />
            {names.length > game.minPlayers && (
              <button
                type="button"
                className="chip-remove"
                aria-label="Remove player"
                onClick={() => removePlayer(index)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {canAdd && (
        <div className="add-player-row">
          <input
            className="player-input"
            placeholder="Type a name…"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFromDraft()}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={addFromDraft}>
            +
          </button>
        </div>
      )}

      <p className="muted limit-label">{limitLabel}</p>

      {game.id === 'license_plate' && (
        <section className="win-condition-section">
          <p className="landing-section-label">PLAY MODE</p>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${!licensePlateCooperative ? 'active' : ''}`}
              onClick={() => setLicensePlateCooperative(false)}
            >
              Competitive
            </button>
            <button
              type="button"
              className={`toggle-btn ${licensePlateCooperative ? 'active' : ''}`}
              onClick={() => setLicensePlateCooperative(true)}
            >
              Cooperative
            </button>
          </div>
          <p className="muted setup-option-note">
            {licensePlateCooperative
              ? 'One shared checklist for the car.'
              : 'Each player tracks their own spots.'}
          </p>

          <p className="landing-section-label">REGIONS</p>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${!includeCanada ? 'active' : ''}`}
              onClick={() => setIncludeCanada(false)}
            >
              US only
            </button>
            <button
              type="button"
              className={`toggle-btn ${includeCanada ? 'active' : ''}`}
              onClick={() => setIncludeCanada(true)}
            >
              US + Canada
            </button>
          </div>
        </section>
      )}

      {game.id === 'generic' && (
        <section className="win-condition-section">
          <p className="landing-section-label">WIN CONDITION · generic only</p>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${winCondition === 'highest' ? 'active' : ''}`}
              onClick={() => setWinCondition('highest')}
            >
              Highest
            </button>
            <button
              type="button"
              className={`toggle-btn ${winCondition === 'lowest' ? 'active' : ''}`}
              onClick={() => setWinCondition('lowest')}
            >
              Lowest
            </button>
          </div>
        </section>
      )}

      <div className="sticky-footer">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!canStart}
          onClick={handleStart}
        >
          Start Game →
        </button>
      </div>
      </div>
    </GameThemeScope>
  );
}
