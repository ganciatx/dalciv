import { electionThreshold } from "../simulation/achievements";
import { FACTION_CHARACTERS } from "../simulation/characters";
import type { FactionId, GameState } from "../simulation/types";

const FACTION_META: Record<
  FactionId,
  { label: string; priority: string }
> = {
  homeowners: { label: "Homeowners", priority: "Low taxes, good roads, safety" },
  renters: { label: "Renters", priority: "Affordability, transit, parks" },
  business: { label: "Business", priority: "Low business taxes, infrastructure" },
  employees: { label: "Public employees", priority: "Wages, pensions, staffing" },
  fiscalHawks: { label: "Fiscal hawks", priority: "Balanced budget, low debt" },
};

export function PoliticalPanel({ game }: { game: GameState }) {
  const threshold = electionThreshold(game);
  const canWin = game.politics.coalitionScore >= threshold;
  const quotes = game.factionQuotes ?? [];

  return (
    <div>
      <div className="panel">
        <h2>Electoral outlook</h2>
        <p style={{ margin: "0 0 8px" }}>
          Next election: <strong>{game.politics.electionYear}</strong> (
          {game.politics.yearsUntilElection} years away)
        </p>
        <p
          style={{
            margin: 0,
            color: canWin ? "var(--good)" : "var(--bad)",
          }}
        >
          Coalition score {game.politics.coalitionScore}% — need {threshold}% to
          win re-election
        </p>
        {game.settings.challengeId === "coalition_builder" && (
          <p style={{ margin: "8px 0 0", fontSize: "0.88rem", color: "var(--warn)" }}>
            Coalition Builder: every faction must stay above 38% approval.
          </p>
        )}
        {game.staff && (
          <p style={{ margin: "10px 0 0", fontSize: "0.88rem", color: "var(--ink-muted)" }}>
            Campaign momentum {game.staff.campaign.momentum}% · strategy{" "}
            {game.staff.campaign.recommendedStrategy.replace("_", " ")} — see Staff
            tab for Jordan Kim&apos;s war room.
          </p>
        )}
      </div>

      {quotes.length > 0 && (
        <div className="panel">
          <h2>Council voices</h2>
          <div className="quote-grid">
            {quotes.map((q) => {
              const char = FACTION_CHARACTERS[q.factionId];
              return (
                <div
                  key={q.factionId}
                  className={`quote-card quote-${q.tone}`}
                >
                  <div className="quote-avatar">{char.initials}</div>
                  <div className="quote-body">
                    <div className="quote-speaker">{q.speakerName}</div>
                    <div className="quote-title">{q.speakerTitle}</div>
                    <p className="quote-text">{q.text}</p>
                    <div className="quote-approval">
                      {FACTION_META[q.factionId].label}:{" "}
                      {game.politics.approvals[q.factionId]}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="panel">
        <h2>Faction approval</h2>
        <div className="faction-grid">
          {(Object.keys(FACTION_META) as FactionId[]).map((id) => {
            const approval = game.politics.approvals[id];
            const meta = FACTION_META[id];
            const char = FACTION_CHARACTERS[id];
            return (
              <div key={id} className="faction-row">
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {char.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--ink-muted)",
                    }}
                  >
                    {meta.priority}
                  </div>
                </div>
                <div className="approval-bar">
                  <div
                    className="approval-fill"
                    style={{ width: `${approval}%` }}
                  />
                </div>
                <div style={{ fontWeight: 700 }}>{approval}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
