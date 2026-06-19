import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getGameDefinition } from '../../games/definitions';
import { sortedStandings } from '../../utils/scoring';
import { ScoreKeypad } from '../ScoreKeypad';
import { StandingsPanel } from '../StandingsPanel';
import { PlayerChip } from '../PlayerChip';

type DraftRound = {
  scores: Record<string, number | null>;
};

/** Mexican Train: round accumulation with pip-count framing; manual end only. */
export function MexicanTrainScoring() {
  const { session, updateSession } = useGame();
  const [draft, setDraft] = useState<DraftRound | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [keypadValue, setKeypadValue] = useState('');

  if (!session) return null;

  const game = getGameDefinition('mexican_train');
  const roundCount = session.roundCount ?? 0;
  const sorted = sortedStandings(session, game);

  const startNewRound = () => {
    const scores: Record<string, number | null> = {};
    session.players.forEach((p) => {
      scores[p.id] = null;
    });
    setDraft({ scores });
  };

  const saveRound = () => {
    if (!draft) return;
    const allScored = session.players.every(
      (p) => draft.scores[p.id] !== null && draft.scores[p.id] !== undefined,
    );
    if (!allScored) return;

    updateSession((prev) => ({
      ...prev,
      roundCount: (prev.roundCount ?? 0) + 1,
      players: prev.players.map((p) => ({
        ...p,
        roundScores: [...(p.roundScores ?? []), draft.scores[p.id] ?? 0],
      })),
    }));
    setDraft(null);
  };

  const openScoreEntry = (playerId: string) => {
    setEditingPlayerId(playerId);
    const existing = draft?.scores[playerId];
    setKeypadValue(existing !== null && existing !== undefined ? String(existing) : '');
  };

  const submitScore = () => {
    if (!draft || !editingPlayerId) return;
    const num = parseInt(keypadValue, 10);
    if (Number.isNaN(num) || num < 0) return;
    setDraft({
      ...draft,
      scores: { ...draft.scores, [editingPlayerId]: num },
    });
    setEditingPlayerId(null);
    setKeypadValue('');
  };

  const editingPlayer = session.players.find((p) => p.id === editingPlayerId);

  return (
    <div className="scoring-layout two-pane">
      <div>
        <p className="muted mexican-hint">
          Enter pips remaining in each player&apos;s hand per round (lower is better).
        </p>

        <div className="leaderboard hide-desktop">
          {sorted.map(({ player, score }, i) => (
            <div key={player.id} className={`leader-chip ${i === 0 ? 'leading' : ''}`}>
              {i === 0 && '♛ '}
              {player.name} <strong>{score}</strong>
            </div>
          ))}
        </div>

        {!draft && (
          <button type="button" className="btn btn-primary btn-block" onClick={startNewRound}>
            + Add Round {roundCount + 1}
          </button>
        )}

        {draft && (
          <div className="card round-card">
            <h2>Round {roundCount + 1} · pip count</h2>
            {session.players.map((p) => (
              <div key={p.id} className="round-player-row">
                <PlayerChip name={p.name} color={p.color} size="sm" />
                <span className="round-player-name">{p.name}</span>
                <button
                  type="button"
                  className="round-score-btn"
                  onClick={() => openScoreEntry(p.id)}
                >
                  {draft.scores[p.id] ?? '—'}
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-primary btn-block" onClick={saveRound}>
              Save round
            </button>
          </div>
        )}

        {roundCount > 0 && (
          <section className="past-rounds">
            <p className="section-label">PAST ROUNDS</p>
            {Array.from({ length: roundCount }, (_, i) => roundCount - i).map((roundNum) => (
              <details key={roundNum} className="card past-round-detail">
                <summary>R{roundNum} ▸</summary>
                <div className="past-round-scores">
                  {session.players.map((p) => (
                    <div key={p.id} className="history-score-row">
                      <span>{p.name}</span>
                      <strong>{p.roundScores?.[roundNum - 1] ?? '—'}</strong>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </section>
        )}
      </div>

      <div className="two-pane-side hide-mobile">
        <StandingsPanel session={session} />
        {!draft && (
          <button
            type="button"
            className="btn btn-primary btn-block scoring-actions"
            onClick={startNewRound}
          >
            + Add round
          </button>
        )}
      </div>

      {editingPlayer && (
        <div className="modal-overlay" onClick={() => setEditingPlayerId(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>
              {editingPlayer.name} · Round {roundCount + 1}
            </h2>
            <p className="muted">Pips left in hand</p>
            <ScoreKeypad
              value={keypadValue}
              onChange={setKeypadValue}
              onSubmit={submitScore}
              quickValues={[]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
