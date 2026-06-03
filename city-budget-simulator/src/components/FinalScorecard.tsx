import { computeFinalGrades } from "../simulation/scorecard";
import type { GameState } from "../simulation/types";

export function FinalScorecard({ game }: { game: GameState }) {
  const grades = computeFinalGrades(game);
  if (!grades.length) return null;

  const overall = Math.round(
    grades.reduce((s, g) => s + g.score, 0) / grades.length,
  );

  return (
    <div className="panel scorecard-panel">
      <h2>30-year stewardship report</h2>
      <p className="overall-grade">
        Overall: <strong>{overall}/100</strong>
      </p>
      <div className="grade-grid">
        {grades.map((g) => (
          <div key={g.id} className="grade-card">
            <div className="grade-letter">{g.letter}</div>
            <div className="grade-label">{g.label}</div>
            <div className="grade-score">{g.score}</div>
            <p className="grade-summary">{g.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
