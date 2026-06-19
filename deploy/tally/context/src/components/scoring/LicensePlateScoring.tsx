import { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getGameDefinition } from '../../games/definitions';
import { LICENSE_PLATE_REGIONS } from '../../games/licensePlateRegions';
import { checklistCount, resolveActiveRegions } from '../../games/licensePlateUtils';
import { playerScore } from '../../utils/scoring';
import { PlayerChip } from '../PlayerChip';
import { StandingsPanel } from '../StandingsPanel';
import '../../styles/license-plate.css';

type RegionGroup = 'us' | 'canada';

/** Road-trip license plate checklist — competitive per-player or cooperative shared. */
export function LicensePlateScoring() {
  const { session, updateSession } = useGame();
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [confirmReset, setConfirmReset] = useState<RegionGroup | 'all' | null>(null);

  const cooperative = session?.licensePlateCooperative ?? false;
  const includeCanada = session?.includeCanada ?? false;
  const activeRegions = useMemo(
    () => resolveActiveRegions(includeCanada),
    [includeCanada],
  );
  const usRegions = useMemo(
    () => activeRegions.filter((r) => r.group === 'us'),
    [activeRegions],
  );
  const canadaRegions = useMemo(
    () => activeRegions.filter((r) => r.group === 'canada'),
    [activeRegions],
  );

  if (!session) return null;

  const activePlayer = session.players[activePlayerIndex] ?? session.players[0];
  const game = getGameDefinition('license_plate');

  const spottedForView = cooperative
    ? session.sharedSpottedRegions
    : activePlayer?.spottedRegions;

  const progressCount = checklistCount(spottedForView, activeRegions);
  const progressLabel = `${progressCount} / ${activeRegions.length}`;

  const toggleRegion = (regionId: string) => {
    updateSession((prev) => {
      if (prev.licensePlateCooperative) {
        const next = { ...(prev.sharedSpottedRegions ?? {}) };
        next[regionId] = !next[regionId];
        return { ...prev, sharedSpottedRegions: next };
      }
      return {
        ...prev,
        players: prev.players.map((p) => {
          if (p.id !== activePlayer?.id) return p;
          const next = { ...(p.spottedRegions ?? {}) };
          next[regionId] = !next[regionId];
          return { ...p, spottedRegions: next };
        }),
      };
    });
  };

  const resetRegions = (scope: RegionGroup | 'all') => {
    const ids =
      scope === 'all'
        ? activeRegions.map((r) => r.id)
        : activeRegions.filter((r) => r.group === scope).map((r) => r.id);

    updateSession((prev) => {
      const patch = (map: Record<string, boolean> | undefined) => {
        const next = { ...(map ?? {}) };
        for (const id of ids) next[id] = false;
        return next;
      };

      if (prev.licensePlateCooperative) {
        return { ...prev, sharedSpottedRegions: patch(prev.sharedSpottedRegions) };
      }
      return {
        ...prev,
        players: prev.players.map((p) =>
          p.id === activePlayer?.id
            ? { ...p, spottedRegions: patch(p.spottedRegions) }
            : p,
        ),
      };
    });
    setConfirmReset(null);
  };

  const renderSection = (
    title: string,
    regions: typeof LICENSE_PLATE_REGIONS,
    group: RegionGroup,
  ) => {
    if (regions.length === 0) return null;

    return (
      <section className="lp-section card">
        <div className="lp-section-head">
          <h3 className="lp-section-title">{title}</h3>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setConfirmReset(group)}
          >
            Reset
          </button>
        </div>
        <ul className="lp-grid">
          {regions.map((region) => {
            const checked = !!spottedForView?.[region.id];
            const tint = cooperative ? undefined : activePlayer?.color;
            return (
              <li key={region.id}>
                <button
                  type="button"
                  className={`lp-cell ${checked ? 'checked' : ''}`}
                  style={
                    checked && tint
                      ? ({ '--lp-tint': tint } as React.CSSProperties)
                      : undefined
                  }
                  onClick={() => toggleRegion(region.id)}
                  aria-pressed={checked}
                >
                  <span className="lp-check" aria-hidden>
                    {checked ? '✓' : ''}
                  </span>
                  <span className="lp-label">{region.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="scoring-layout two-pane scoring-readable">
      <div className="lp-main">
        <div className="lp-progress card">
          <span className="lp-progress-label">
            {cooperative ? 'Team progress' : `${activePlayer?.name}'s progress`}
          </span>
          <strong className="lp-progress-count">{progressLabel}</strong>
        </div>

        {!cooperative && session.players.length > 1 && (
          <div className="lp-player-tabs">
            {session.players.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`lp-tab ${i === activePlayerIndex ? 'active' : ''}`}
                onClick={() => setActivePlayerIndex(i)}
              >
                <PlayerChip name={p.name} color={p.color} size="sm" />
                {p.name}
                <span className="lp-tab-count">
                  {checklistCount(p.spottedRegions, activeRegions)}
                </span>
              </button>
            ))}
          </div>
        )}

        {renderSection('United States', usRegions, 'us')}
        {includeCanada && renderSection('Canada', canadaRegions, 'canada')}

        <div className="lp-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setConfirmReset('all')}
          >
            Reset all
          </button>
        </div>

        <p className="muted lp-safety">
          Pass the device — don&apos;t use while driving.
        </p>
      </div>

      <div className="two-pane-side hide-mobile">
        <StandingsPanel session={session} />
      </div>

      {!cooperative && (
        <div className="hide-desktop lp-mobile-standings card">
          <p className="lp-standings-label">Standings · highest wins</p>
          <ol className="lp-standings-list">
            {[...session.players]
              .map((p) => ({ p, score: playerScore(p, game, session) }))
              .sort((a, b) => b.score - a.score)
              .map(({ p, score }, i) => (
                <li key={p.id}>
                  <span>{i + 1}.</span>
                  <PlayerChip name={p.name} color={p.color} size="sm" />
                  {p.name}
                  <strong>{score}</strong>
                </li>
              ))}
          </ol>
        </div>
      )}

      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Reset checklist?</h2>
            <p className="muted">
              Clear{' '}
              {confirmReset === 'all'
                ? 'all regions'
                : confirmReset === 'us'
                  ? 'United States'
                  : 'Canada'}{' '}
              {cooperative ? 'for the team' : `for ${activePlayer?.name}`}.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => resetRegions(confirmReset)}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmReset(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
