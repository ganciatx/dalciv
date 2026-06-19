import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getGameDefinition } from '../../games/definitions';
import { getPhaseDisplay, phaseAtRoundStart } from '../../games/phase10Phases';
import type { Player } from '../../types';
import { sortedStandings } from '../../utils/scoring';
import { ScoreKeypad } from '../ScoreKeypad';
import { StandingsPanel } from '../StandingsPanel';
import { PhaseGoal } from './PhaseGoal';
import { PlayerChip } from '../PlayerChip';
import '../../styles/phase10.css';

type DraftRound = {
  scores: Record<string, number | null>;
  phaseCompleted: Record<string, boolean>;
};

const POINT_REFERENCE = [
  '1–9: 5 each',
  '10–12: 10 each',
  'Skip: 15 each',
  'Wild: 25 each',
];

export function Phase10Scoring() {
  const { session, updateSession } = useGame();
  const [draft, setDraft] = useState<DraftRound | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [keypadValue, setKeypadValue] = useState('');

  if (!session) return null;

  const game = getGameDefinition('phase10');
  const roundCount = session.roundCount ?? 0;
  const sorted = sortedStandings(session, game);

  const startNewRound = () => {
    const scores: Record<string, number | null> = {};
    const phaseCompleted: Record<string, boolean> = {};
    session.players.forEach((p) => {
      scores[p.id] = null;
      phaseCompleted[p.id] = false;
    });
    setDraft({ scores, phaseCompleted });
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
      players: prev.players.map((p) => {
        const score = draft.scores[p.id] ?? 0;
        const completed = draft.phaseCompleted[p.id] ?? false;
        const nextPhase = completed ? (p.currentPhase ?? 1) + 1 : (p.currentPhase ?? 1);
        return {
          ...p,
          currentPhase: nextPhase,
          roundScores: [...(p.roundScores ?? []), score],
          phaseCompletedPerRound: [...(p.phaseCompletedPerRound ?? []), completed],
        };
      }),
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

  const togglePhase = (playerId: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      phaseCompleted: {
        ...draft.phaseCompleted,
        [playerId]: !draft.phaseCompleted[playerId],
      },
    });
  };

  const editingPlayer = session.players.find((p) => p.id === editingPlayerId);

  return (
    <div className="scoring-layout two-pane">
      <div>
        <div className="leaderboard hide-desktop">
          {sorted.map(({ player, score }, i) => {
            const phase = getPhaseDisplay(player.currentPhase ?? 1);
            return (
              <div key={player.id} className={`leader-chip ${i === 0 ? 'leading' : ''}`}>
                {i === 0 && '♛ '}
                <span className="leader-chip-main">
                  {player.name} <strong>{score}</strong>
                </span>
                {!phase.finished && (
                  <span className="leader-chip-phase muted">P{phase.phaseNumber}</span>
                )}
              </div>
            );
          })}
        </div>

        {!draft && (
          <div className="phase-current-goals card">
            <p className="section-label">CURRENT PHASES</p>
            {session.players.map((p) => (
              <div key={p.id} className="phase-current-row">
                <PlayerChip name={p.name} color={p.color} size="sm" />
                <span className="phase-current-name">{p.name}</span>
                <PhaseGoal phaseNumber={p.currentPhase ?? 1} compact />
              </div>
            ))}
          </div>
        )}

        {!draft && (
          <button type="button" className="btn btn-primary btn-block" onClick={startNewRound}>
            + Add Round {roundCount + 1}
          </button>
        )}

        {draft && (
          <div className="card round-card">
            <h2>Round {roundCount + 1} · enter scores</h2>
            <details className="phase-reference">
              <summary className="muted">Point reference</summary>
              <ul>
                {POINT_REFERENCE.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
            {session.players.map((p) => (
              <div key={p.id} className="round-player-row round-player-row-stacked">
                <div className="round-player-header">
                  <PlayerChip name={p.name} color={p.color} size="sm" />
                  <span className="round-player-name">{p.name}</span>
                </div>
                <PhaseGoal phaseNumber={p.currentPhase ?? 1} />
                <div className="round-player-actions">
                  <button
                    type="button"
                    className={`phase-made-btn ${draft.phaseCompleted[p.id] ? 'active' : ''}`}
                    onClick={() => togglePhase(p.id)}
                    disabled={getPhaseDisplay(p.currentPhase ?? 1).finished}
                    aria-pressed={draft.phaseCompleted[p.id] ?? false}
                  >
                    {draft.phaseCompleted[p.id] ? '✓ Made' : 'Made'}
                  </button>
                  <button
                    type="button"
                    className="round-score-btn"
                    onClick={() => openScoreEntry(p.id)}
                  >
                    {draft.scores[p.id] ?? '—'}
                  </button>
                </div>
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
              <PastRoundSummary
                key={roundNum}
                roundIndex={roundNum - 1}
                roundLabel={`R${roundNum}`}
                players={session.players}
              />
            ))}
          </section>
        )}
      </div>

      <div className="two-pane-side hide-mobile">
        <StandingsPanel session={session} />
        <div className="phase-sidebar-goals card">
          <p className="standings-label">PHASE GOALS</p>
          {session.players.map((p) => (
            <div key={p.id} className="phase-sidebar-row">
              <PlayerChip name={p.name} color={p.color} size="sm" />
              <span className="phase-sidebar-name">{p.name}</span>
              <PhaseGoal phaseNumber={p.currentPhase ?? 1} compact />
            </div>
          ))}
        </div>
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
            <PhaseGoal phaseNumber={editingPlayer.currentPhase ?? 1} />
            <ScoreKeypad
              value={keypadValue}
              onChange={setKeypadValue}
              onSubmit={submitScore}
              quickValues={[5, 10, 15, 25]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PastRoundSummary({
  roundIndex,
  roundLabel,
  players,
}: {
  roundIndex: number;
  roundLabel: string;
  players: Player[];
}) {
  return (
    <details className="card past-round-detail">
      <summary>{roundLabel} ▸</summary>
      <div className="past-round-scores">
        {players.map((p) => {
          const phaseNum = phaseAtRoundStart(p, roundIndex);
          const phase = getPhaseDisplay(phaseNum);
          return (
            <div key={p.id} className="past-round-player">
              <div className="history-score-row">
                <span>
                  {p.name} {p.phaseCompletedPerRound?.[roundIndex] ? '☑' : '☐'}
                </span>
                <strong>{p.roundScores?.[roundIndex] ?? '—'}</strong>
              </div>
              <p className="past-round-phase muted">
                {phase.finished ? 'Finished' : `P${phase.phaseNumber}: ${phase.label}`}
              </p>
            </div>
          );
        })}
      </div>
    </details>
  );
}
