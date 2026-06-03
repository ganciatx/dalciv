import {
  ACHIEVEMENTS,
  CHALLENGES,
} from "../simulation/achievements";

export function AchievementsPanel({
  unlocked,
  newlyUnlocked = [],
}: {
  unlocked: Set<string>;
  newlyUnlocked?: string[];
}) {
  const newSet = new Set(newlyUnlocked);

  return (
    <div className="panel achievements-panel">
      <h2>Achievements</h2>
      <p style={{ margin: "0 0 12px", color: "var(--ink-muted)", fontSize: "0.9rem" }}>
        {unlocked.size} of {ACHIEVEMENTS.length} unlocked
      </p>
      <ul className="achievement-list">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.has(a.id);
          const isNew = newSet.has(a.id);
          return (
            <li
              key={a.id}
              className={`achievement-item ${isUnlocked ? "unlocked" : "locked"} ${isNew ? "new" : ""}`}
            >
              <span className="achievement-badge">{isUnlocked ? "✓" : "·"}</span>
              <div>
                <strong>{a.title}</strong>
                {isNew && <span className="achievement-new-tag"> New!</span>}
                <p>{a.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ChallengeLegend({ challengeId }: { challengeId: string }) {
  const c = CHALLENGES.find((x) => x.id === challengeId);
  if (!c || challengeId === "none") return null;
  return (
    <p className="challenge-active">
      Challenge: <strong>{c.title}</strong> — {c.ruleHint}
    </p>
  );
}
