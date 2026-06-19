import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GAME_DEFINITIONS } from '../games/definitions';
import '../styles/game-picker.css';

function descriptionParts(description: string): string[] {
  return description.split(' · ').map((part) => part.trim()).filter(Boolean);
}

export function GamePickerPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="page game-picker-page">
      <header className="page-header">
        <Link to="/" className="back-btn" aria-label="Back">
          ‹
        </Link>
        <div className="page-header-copy">
          <h1 className="page-title">Pick a game</h1>
          <p className="page-subtitle">Choose a score pad for the table</p>
        </div>
      </header>

      <div className="game-grid">
        {GAME_DEFINITIONS.map((game) => {
          const selected = selectedId === game.id;
          const meta = descriptionParts(game.description);

          return (
            <button
              key={game.id}
              type="button"
              className={`game-card ${selected ? 'selected' : ''}`}
              data-game-theme={game.id}
              aria-pressed={selected}
              onClick={() => setSelectedId(game.id)}
            >
              <div className="game-card-edge">
                <div className="game-card-face">
                  <span className="game-card-accent-bar" aria-hidden />

                  <div className="game-card-medallion">
                    <span className="game-icon">{game.icon}</span>
                  </div>

                  <div className="game-card-copy">
                    <span className="game-name">{game.name}</span>
                    <ul className="game-card-meta">
                      {meta.map((part) => (
                        <li key={part}>{part}</li>
                      ))}
                    </ul>
                  </div>

                  <span className="game-card-selected-mark" aria-hidden>
                    {selected ? '✓' : ''}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="sticky-footer game-picker-footer">
        <button
          type="button"
          className="btn btn-primary btn-block game-picker-continue"
          disabled={!selectedId}
          onClick={() => selectedId && navigate(`/setup/${selectedId}`)}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
