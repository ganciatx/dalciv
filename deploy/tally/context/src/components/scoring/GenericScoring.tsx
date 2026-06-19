import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getGameDefinition } from '../../games/definitions';
import { effectiveWinCondition, genericTotal } from '../../utils/scoring';
import { ScoreKeypad } from '../ScoreKeypad';
import { StandingsPanel } from '../StandingsPanel';
import { PlayerChip } from '../PlayerChip';

/** Free-form ledger with +/- deltas (wireframe: generic swaps quick chips for +/−). */
export function GenericScoring() {
  const { session, updateSession } = useGame();
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [keypadValue, setKeypadValue] = useState('');

  if (!session) return null;

  const game = getGameDefinition('generic');
  const win = effectiveWinCondition(game, session);

  const applyDelta = (playerId: string, delta: number) => {
    updateSession((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId
          ? { ...p, runningTotal: (p.runningTotal ?? 0) + delta }
          : p,
      ),
    }));
  };

  const submitDelta = () => {
    if (!editingPlayerId) return;
    const num = parseInt(keypadValue, 10);
    if (Number.isNaN(num) || num === 0) return;
    applyDelta(editingPlayerId, num);
    setEditingPlayerId(null);
    setKeypadValue('');
  };

  const editingPlayer = session.players.find((p) => p.id === editingPlayerId);

  return (
    <div className="scoring-layout two-pane">
      <div>
        <p className="muted generic-hint">
          Tap a player to add a score change · {win === 'highest' ? 'Highest' : 'Lowest'} wins
        </p>

        <ul className="generic-list">
          {session.players.map((p) => (
            <li key={p.id} className="card generic-row">
              <PlayerChip name={p.name} color={p.color} size="md" />
              <span className="generic-name">{p.name}</span>
              <strong className="generic-score">{genericTotal(p)}</strong>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setEditingPlayerId(p.id);
                  setKeypadValue('');
                }}
              >
                +/−
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="two-pane-side hide-mobile">
        <StandingsPanel session={session} />
      </div>

      {editingPlayer && (
        <div className="modal-overlay" onClick={() => setEditingPlayerId(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>{editingPlayer.name}</h2>
            <p className="muted">Enter +20 or -5 (include sign)</p>
            <ScoreKeypad
              value={keypadValue}
              onChange={setKeypadValue}
              onSubmit={submitDelta}
              quickValues={[5, 10, 20, 50]}
              showSignToggle
            />
          </div>
        </div>
      )}
    </div>
  );
}
