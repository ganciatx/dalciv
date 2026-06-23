import { useState } from "react";
import { CHALLENGES } from "../simulation/achievements";
import { AchievementsPanel } from "./AchievementsPanel";
import { SCENARIOS } from "../store/gameStore";
import type { ChallengeId, Difficulty, ScenarioId } from "../simulation/types";

export function ScenarioPicker({
  onStart,
  unlockedAchievements,
  onBack,
}: {
  onStart: (
    scenarioId: ScenarioId,
    difficulty: Difficulty,
    challengeId: ChallengeId,
  ) => void;
  unlockedAchievements: Set<string>;
  onBack?: () => void;
}) {
  const [challengeId, setChallengeId] = useState<ChallengeId>("none");

  return (
    <div className="scenario-overlay">
      <div className="scenario-modal panel">
        {onBack && (
          <button type="button" className="link-btn scenario-back" onClick={onBack}>
            ← Back to home
          </button>
        )}
        <h2 className="scenario-heading">Choose your city</h2>
        <p className="scenario-intro">
          Each scenario starts from a different fiscal and political reality. Pick
          the challenge that fits your style.
        </p>

        <div className="challenge-picker">
          <label htmlFor="challenge-select">Challenge modifier</label>
          <select
            id="challenge-select"
            className="challenge-select"
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value as ChallengeId)}
          >
            {CHALLENGES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} — {c.ruleHint}
              </option>
            ))}
          </select>
        </div>

        <div className="scenario-grid">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="scenario-card"
              onClick={() => onStart(s.id, "standard", challengeId)}
            >
              <h3>{s.title}</h3>
              <p className="scenario-city">{s.cityName}</p>
              <p>{s.description}</p>
              <span className="scenario-challenge">{s.challenge}</span>
            </button>
          ))}
        </div>

        <div className="difficulty-row">
          <span>Quick mode:</span>
          <button
            type="button"
            className="btn"
            onClick={() => onStart("sun-belt-boom", "sandbox", challengeId)}
          >
            Sandbox (15 years)
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onStart("sun-belt-boom", "hard", challengeId)}
          >
            Hard mode
          </button>
        </div>

        <AchievementsPanel unlocked={unlockedAchievements} />
      </div>
    </div>
  );
}
