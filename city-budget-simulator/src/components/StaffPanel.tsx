import { electionThreshold } from "../simulation/achievements";
import {
  CAMPAIGN_MANAGER,
  generateStaffAdvice,
  mergeRecommendation,
  POLICY_ADVISORS,
} from "../simulation/staff";
import type {
  AdvisorId,
  CampaignStrategy,
  GameState,
  PlayerDecisions,
  StaffAdvice,
} from "../simulation/types";

const STRATEGY_OPTIONS: { id: CampaignStrategy; label: string }[] = [
  { id: "balanced", label: "Balanced coalition" },
  { id: "neighborhoods", label: "Neighborhood turnout" },
  { id: "business", label: "Business community" },
  { id: "labor", label: "Labor & workforce" },
  { id: "austerity", label: "Fiscal discipline" },
];

function staffMeta(advice: StaffAdvice) {
  if (advice.role === "campaign") {
    return {
      name: CAMPAIGN_MANAGER.name,
      title: CAMPAIGN_MANAGER.title,
      initials: CAMPAIGN_MANAGER.initials,
    };
  }
  const def = POLICY_ADVISORS[advice.staffId as AdvisorId];
  return {
    name: def.name,
    title: def.title,
    initials: def.initials,
  };
}

export function StaffPanel({
  game,
  draft,
  onPatch,
}: {
  game: GameState;
  draft: PlayerDecisions;
  onPatch: (patch: Partial<PlayerDecisions>) => void;
}) {
  const advice = generateStaffAdvice(game, draft);
  const threshold = electionThreshold(game);
  const camp = game.staff.campaign;

  return (
    <div>
      <div className="panel">
        <h2>Mayor&apos;s office</h2>
        <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: "0.9rem" }}>
          Policy advisors analyze your draft budget; Jordan Kim runs the re-election
          war room. Following urgent counsel builds trust and moves approvals.
          Ignoring it has a political cost.
        </p>
      </div>

      <div className="panel staff-campaign-panel">
        <div className="staff-header">
          <div className="quote-avatar staff-avatar-campaign">
            {CAMPAIGN_MANAGER.initials}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{CAMPAIGN_MANAGER.name}</h2>
            <p style={{ margin: "4px 0 0", color: "var(--ink-muted)" }}>
              {CAMPAIGN_MANAGER.title}
            </p>
          </div>
        </div>
        <div className="staff-meters">
          <div>
            <span className="label">Trust</span>
            <div className="approval-bar">
              <div
                className="approval-fill"
                style={{ width: `${camp.trust}%` }}
              />
            </div>
            <span>{camp.trust}%</span>
          </div>
          <div>
            <span className="label">Momentum</span>
            <div className="approval-bar">
              <div
                className="approval-fill momentum-fill"
                style={{ width: `${camp.momentum}%` }}
              />
            </div>
            <span>{camp.momentum}%</span>
          </div>
        </div>
        <p style={{ margin: "12px 0 8px", fontSize: "0.88rem" }}>
          Coalition {game.politics.coalitionScore}% · need {threshold}% · election
          in {game.politics.yearsUntilElection} yr
          {camp.momentum >= 50 && game.politics.yearsUntilElection <= 3
            ? ` · +${Math.round(camp.momentum * 0.06)}% momentum bonus applied at year-end`
            : ""}
        </p>
        <label className="staff-strategy-label">
          <span>Campaign strategy (FY{game.year} draft)</span>
          <select
            value={draft.campaignStrategy}
            onChange={(e) =>
              onPatch({
                campaignStrategy: e.target.value as CampaignStrategy,
              })
            }
            style={{
              width: "100%",
              padding: "8px",
              background: "var(--bg-deep)",
              color: "var(--ink)",
              border: "1px solid var(--hair)",
              borderRadius: "6px",
            }}
          >
            {STRATEGY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
                {camp.recommendedStrategy === o.id ? " (recommended)" : ""}
              </option>
            ))}
          </select>
        </label>
        {advice
          .filter((a) => a.role === "campaign")
          .map((a) => (
            <AdviceCard
              key={a.staffId}
              advice={a}
              trust={camp.trust}
              onApply={
                a.recommendation
                  ? () => onPatch(mergeRecommendation(draft, a))
                  : undefined
              }
            />
          ))}
      </div>

      <div className="panel">
        <h2>Policy advisors</h2>
        <div className="staff-advisor-grid">
          {(Object.keys(POLICY_ADVISORS) as AdvisorId[]).map((id) => {
            const def = POLICY_ADVISORS[id];
            const advisor = game.staff.advisors[id];
            const cardAdvice = advice.find((a) => a.staffId === id);
            return (
              <div key={id} className="staff-advisor-card">
                <div className="staff-header">
                  <div className="quote-avatar">{def.initials}</div>
                  <div>
                    <div className="quote-speaker">{def.name}</div>
                    <div className="quote-title">{def.title}</div>
                    <div className="staff-specialty">{def.specialty}</div>
                  </div>
                </div>
                <div className="staff-trust-row">
                  <span>Trust {advisor.trust}%</span>
                  <span className="staff-heed-count">
                    Followed {advisor.yearsHeeded} · Overrode {advisor.yearsIgnored}
                  </span>
                </div>
                <div className="approval-bar" style={{ marginBottom: "10px" }}>
                  <div
                    className="approval-fill"
                    style={{ width: `${advisor.trust}%` }}
                  />
                </div>
                {cardAdvice && (
                  <AdviceCard
                    advice={cardAdvice}
                    trust={advisor.trust}
                    compact
                    onApply={
                      cardAdvice.recommendation
                        ? () => onPatch(mergeRecommendation(draft, cardAdvice))
                        : undefined
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {game.staff.lastBriefing.length > 0 && (
        <div className="panel">
          <h2>Last year briefing</h2>
          <ul className="staff-briefing-list">
            {game.staff.lastBriefing.map((n) => (
              <li key={n.staffId}>
                <span>{n.title}</span>
                <span className={n.heeded ? "delta-good" : "delta-bad"}>
                  {n.heeded ? "Followed" : "Overrode"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AdviceCard({
  advice,
  trust,
  compact,
  onApply,
}: {
  advice: StaffAdvice;
  trust: number;
  compact?: boolean;
  onApply?: () => void;
}) {
  const meta = staffMeta(advice);
  return (
    <div className={`staff-advice staff-advice-${advice.tone} ${compact ? "compact" : ""}`}>
      {!compact && (
        <div className="staff-advice-meta">
          <span className={`staff-tone staff-tone-${advice.tone}`}>
            {advice.tone}
          </span>
          <span>Trust {trust}%</span>
        </div>
      )}
      <div className="staff-advice-title">{advice.title}</div>
      <p className="staff-advice-detail">{advice.detail}</p>
      {onApply && (
        <button type="button" className="btn staff-apply-btn" onClick={onApply}>
          Apply recommendation to draft
        </button>
      )}
      {!onApply && advice.tone === "steady" && (
        <p className="staff-advice-ok">No change needed this year.</p>
      )}
    </div>
  );
}
