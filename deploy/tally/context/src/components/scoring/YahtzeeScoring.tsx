import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { YAHTZEE_CATEGORIES } from '../../games/yahtzeeCategories';
import type { Player, YahtzeeCategory } from '../../types';
import { yahtzeeBreakdown, yahtzeeCategoryFilled } from '../../utils/scoring';
import {
  getYahtzeeQuickPicks,
  validateYahtzeeScore,
  yahtzeeScoreHint,
} from '../../utils/yahtzeeValidation';
import { ScoreKeypad } from '../ScoreKeypad';
import { StandingsPanel } from '../StandingsPanel';
import { PlayerChip } from '../PlayerChip';
import '../../styles/yahtzee.css';

type CellAction = {
  playerId: string;
  category: YahtzeeCategory;
};

export function YahtzeeScoring() {
  const { session, updateSession } = useGame();
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [cellAction, setCellAction] = useState<CellAction | null>(null);
  const [keypadValue, setKeypadValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!session) return null;

  const players = session.players;
  const activePlayer = players[activePlayerIndex];
  const breakdown = yahtzeeBreakdown(activePlayer);

  const setCategoryScore = (playerId: string, categoryId: string, value: number) => {
    updateSession((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              categoryScores: { ...p.categoryScores, [categoryId]: value },
            }
          : p,
      ),
    }));
  };

  const incrementBonus = (playerId: string, delta: number) => {
    updateSession((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              yahtzeeBonusCount: Math.max(0, (p.yahtzeeBonusCount ?? 0) + delta),
            }
          : p,
      ),
    }));
  };

  const openCell = (player: Player, category: YahtzeeCategory) => {
    if (yahtzeeCategoryFilled(player, category.id)) return;
    setCellAction({ playerId: player.id, category });
    setValidationError(null);
    if (category.kind !== 'fixed') {
      setKeypadValue('');
    }
  };

  const submitKeypad = () => {
    if (!cellAction) return;
    const num = parseInt(keypadValue, 10);
    if (Number.isNaN(num)) {
      setValidationError('Enter a valid number.');
      return;
    }
    applySumScore(num);
    setKeypadValue('');
  };

  const closeCellModal = () => {
    setCellAction(null);
    setValidationError(null);
  };

  const applySumScore = (value: number) => {
    if (!cellAction) return;
    const result = validateYahtzeeScore(cellAction.category, value);
    if (!result.valid) {
      setValidationError(result.message);
      return;
    }
    setCategoryScore(cellAction.playerId, cellAction.category.id, value);
    closeCellModal();
  };

  const upperCategories = YAHTZEE_CATEGORIES.filter((c) => c.section === 'upper');
  const lowerCategories = YAHTZEE_CATEGORIES.filter((c) => c.section === 'lower');
  const renderCategoryRow = (category: YahtzeeCategory) => {
    const filled = yahtzeeCategoryFilled(activePlayer, category.id);
    const score = activePlayer.categoryScores?.[category.id];

    return (
      <button
        key={category.id}
        type="button"
        className={`yahtzee-row ${filled ? 'filled' : 'empty'}`}
        onClick={() => openCell(activePlayer, category)}
        disabled={filled}
      >
        <span className="yahtzee-row-label">{category.label}</span>
        <span className="yahtzee-cell-value" aria-hidden={!filled && category.kind !== 'fixed'}>
          {filled ? (
            score
          ) : (
            <span className="yahtzee-add-btn">
              {category.kind === 'fixed' ? 'Set score' : 'Add'}
            </span>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="scoring-layout two-pane">
      <div>
        <div className="yahtzee-player-tabs">
          {players.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`yahtzee-tab ${i === activePlayerIndex ? 'active' : ''}`}
              onClick={() => setActivePlayerIndex(i)}
            >
              <PlayerChip name={p.name} color={p.color} size="sm" />
              {p.name}
            </button>
          ))}
        </div>

        {/* Mobile: one player at a time (wireframe B) */}
        <div className="hide-desktop yahtzee-single scoring-readable">
          <div className="yahtzee-total-bar card">
            <span className="yahtzee-total-label">Total</span>
            <strong className="yahtzee-total-num">{breakdown.grandTotal}</strong>
          </div>

          <div className="yahtzee-upper-progress card">
            <span className="yahtzee-progress-label">
              Upper section: {breakdown.upperSubtotal} of 63
              {breakdown.upperBonus > 0 ? ' (+35 bonus)' : ''}
            </span>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (breakdown.upperSubtotal / 63) * 100)}%` }}
              />
            </div>
          </div>

          <section className="card yahtzee-section-pad">
            <h3 className="yahtzee-section-title">Upper section</h3>
            {upperCategories.map(renderCategoryRow)}
            <div className="yahtzee-auto-row">
              <span>Upper bonus</span>
              <strong>{breakdown.upperBonus}</strong>
            </div>
          </section>

          <section className="card yahtzee-section-pad">
            <h3 className="yahtzee-section-title">Lower section</h3>
            <p className="yahtzee-section-note">Fixed scores use Set score · tap to fill or scratch</p>
            {lowerCategories.map(renderCategoryRow)}
          </section>

          {(activePlayer.categoryScores?.yahtzee === 50 ||
            (activePlayer.yahtzeeBonusCount ?? 0) > 0) && (
            <div className="yahtzee-bonus-chips card">
              <span>Extra Yahtzees (+100 each)</span>
              <div className="bonus-controls">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => incrementBonus(activePlayer.id, -1)}
                >
                  −
                </button>
                <strong>{activePlayer.yahtzeeBonusCount ?? 0}</strong>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => incrementBonus(activePlayer.id, 1)}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <p className="muted yahtzee-hint">Tap a row to enter or change a score</p>

          <div className="yahtzee-nav">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={activePlayerIndex === 0}
              onClick={() => setActivePlayerIndex((i) => i - 1)}
            >
              ‹ {players[activePlayerIndex - 1]?.name ?? ''}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={activePlayerIndex === players.length - 1}
              onClick={() => setActivePlayerIndex((i) => i + 1)}
            >
              {players[activePlayerIndex + 1]?.name ?? ''} ›
            </button>
          </div>
        </div>

        {/* Tablet: full grid (wireframe A / tablet layout) */}
        <div className="hide-mobile yahtzee-grid-wrap score-pad card">
          <table className="yahtzee-grid">
            <thead>
              <tr>
                <th>Category</th>
                {players.map((p) => (
                  <th key={p.id}>
                    <PlayerChip name={p.name} color={p.color} size="sm" /> {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="section-row">
                <td colSpan={players.length + 1}>UPPER</td>
              </tr>
              {upperCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.label}</td>
                  {players.map((p) => {
                    const filled = yahtzeeCategoryFilled(p, cat.id);
                    const val = p.categoryScores?.[cat.id];
                    return (
                      <td key={p.id}>
                        <button
                          type="button"
                          className="grid-cell"
                          onClick={() => openCell(p, cat)}
                          disabled={filled}
                        >
                          {filled ? val : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="auto-row">
                <td>Bonus (auto · 63)</td>
                {players.map((p) => (
                  <td key={p.id}>{yahtzeeBreakdown(p).upperBonus || '0'}</td>
                ))}
              </tr>
              <tr className="section-row">
                <td colSpan={players.length + 1}>LOWER</td>
              </tr>
              {lowerCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.label}</td>
                  {players.map((p) => {
                    const filled = yahtzeeCategoryFilled(p, cat.id);
                    const val = p.categoryScores?.[cat.id];
                    return (
                      <td key={p.id}>
                        <button
                          type="button"
                          className="grid-cell"
                          onClick={() => openCell(p, cat)}
                          disabled={filled}
                        >
                          {filled ? val : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="total-row">
                <td>Total</td>
                {players.map((p) => (
                  <td key={p.id}>
                    <strong>{yahtzeeBreakdown(p).grandTotal}</strong>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="two-pane-side hide-mobile">
        <StandingsPanel session={session} />
      </div>

      {cellAction && (
        <div className="modal-overlay" onClick={closeCellModal}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>
              {cellAction.category.label} —{' '}
              {players.find((p) => p.id === cellAction.playerId)?.name}
            </h2>
            {cellAction.category.kind === 'fixed' ? (
              <>
                <p className="muted">
                  Fixed value: {cellAction.category.fixedValue} (no typos allowed)
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setCategoryScore(
                        cellAction.playerId,
                        cellAction.category.id,
                        cellAction.category.fixedValue!,
                      );
                      closeCellModal();
                    }}
                  >
                    Fill in {cellAction.category.fixedValue}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setCategoryScore(cellAction.playerId, cellAction.category.id, 0);
                      closeCellModal();
                    }}
                  >
                    Scratch — 0
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeCellModal}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              (() => {
                const quickPicks = getYahtzeeQuickPicks(cellAction.category);
                const useQuickSet = quickPicks.length > 0;

                return (
                  <>
                    <p className="muted">
                      {useQuickSet
                        ? 'Tap a score — upper section multiples only'
                        : yahtzeeScoreHint(cellAction.category)}
                    </p>
                    {validationError && (
                      <p className="validation-error" role="alert">
                        {validationError}
                      </p>
                    )}
                    <ScoreKeypad
                      value={keypadValue}
                      onChange={(v) => {
                        setKeypadValue(v);
                        setValidationError(null);
                      }}
                      onSubmit={submitKeypad}
                      quickValues={quickPicks}
                      quickMode={useQuickSet ? 'set' : 'add'}
                      onQuickPick={useQuickSet ? applySumScore : undefined}
                      hideDigitPad={useQuickSet}
                    />
                    {!useQuickSet && (
                      <div className="modal-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => applySumScore(0)}
                        >
                          Scratch — 0
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={closeCellModal}>
                          Cancel
                        </button>
                      </div>
                    )}
                    {useQuickSet && (
                      <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={closeCellModal}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
