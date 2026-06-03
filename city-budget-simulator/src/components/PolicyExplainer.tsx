import { tipsForDecisions } from "../simulation/policyExplainer";
import { defaultDecisions } from "../simulation/scenarios";
import type { GameState, PlayerDecisions } from "../simulation/types";

export function PolicyExplainer({
  game,
  draft,
}: {
  game: GameState;
  draft: PlayerDecisions;
}) {
  if (!game.settings.policyExplainer) return null;

  const tips = tipsForDecisions(draft, defaultDecisions(game));
  if (!tips.length) {
    return (
      <div className="panel explainer-panel">
        <h2>Policy explainer</h2>
        <p style={{ margin: 0, color: "var(--ink-muted)" }}>
          Adjust taxes, maintenance, or pensions to see real-world parallels.
        </p>
      </div>
    );
  }

  return (
    <div className="panel explainer-panel">
      <h2>Policy explainer</h2>
      {tips.map((t) => (
        <div key={t.title} className="explainer-tip">
          <strong>{t.title}</strong>
          <p>{t.body}</p>
          {t.realWorld && (
            <p className="explainer-real">Real world: {t.realWorld}</p>
          )}
        </div>
      ))}
    </div>
  );
}
