import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import '../styles/history.css';

export function HistoryPage() {
  const { history } = useGame();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/" className="back-btn">
          ‹
        </Link>
        <h1 className="page-title">History</h1>
      </header>

      {history.length === 0 ? (
        <p className="muted">No completed games yet.</p>
      ) : (
        <ul className="history-list">
          {history.map((entry) => {
            const expanded = expandedId === entry.sessionId;
            return (
              <li key={entry.sessionId} className="card history-item">
                <button
                  type="button"
                  className="history-summary"
                  onClick={() =>
                    setExpandedId(expanded ? null : entry.sessionId)
                  }
                >
                  <div>
                    <strong>{entry.gameName}</strong>
                    <p className="muted history-meta">
                      {new Date(entry.completedAt).toLocaleString()} · Winner:{' '}
                      {entry.winnerName}
                    </p>
                  </div>
                  <span>{expanded ? '▾' : '▸'}</span>
                </button>
                {expanded && (
                  <div className="history-scores">
                    {Object.entries(entry.finalScores).map(([name, score]) => (
                      <div key={name} className="history-score-row">
                        <span>{name}</span>
                        <strong>{score}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
