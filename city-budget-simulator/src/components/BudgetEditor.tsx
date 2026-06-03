import { maintenanceSliderMax } from "../simulation/achievements";
import { maxBondIssuance } from "../simulation/credit";
import {
  formatMillions,
  formatPercent,
  projectTurnBalance,
} from "../simulation/simulate";
import type { GameState, PlayerDecisions } from "../simulation/types";

const EXPENDITURE_LABELS: Record<
  keyof PlayerDecisions["expenditures"],
  { label: string; hint: string; min: number; max: number; step: number }
> = {
  publicSafety: {
    label: "Public safety",
    hint: "Police + fire staffing",
    min: 180,
    max: 480,
    step: 2,
  },
  infrastructureMaintenance: {
    label: "Infrastructure maintenance",
    hint: "Roads, water, buildings",
    min: 25,
    max: 160,
    step: 1,
  },
  pensionContribution: {
    label: "Pension contribution",
    hint: `ARC ${0} — underpay compounds`,
    min: 40,
    max: 220,
    step: 2,
  },
  parksLibraries: {
    label: "Parks & libraries",
    hint: "Quality-of-life services",
    min: 15,
    max: 90,
    step: 1,
  },
  administration: {
    label: "Administration",
    hint: "City operations",
    min: 70,
    max: 180,
    step: 2,
  },
  education: {
    label: "K–12 education",
    hint: "Schools, teachers, facilities",
    min: 60,
    max: 280,
    step: 2,
  },
  economicDevelopment: {
    label: "Economic development",
    hint: "EDC recruitment & incentives",
    min: 0,
    max: 65,
    step: 1,
  },
  capitalProjects: {
    label: "Capital projects",
    hint: "Annual contribution to active build",
    min: 0,
    max: 45,
    step: 1,
  },
};

export function BudgetEditor({
  game,
  draft,
  onPatchExpenditure,
  onPatch,
}: {
  game: GameState;
  draft: PlayerDecisions;
  onPatchExpenditure: (
    key: keyof PlayerDecisions["expenditures"],
    value: number,
  ) => void;
  onPatch: (patch: Partial<PlayerDecisions>) => void;
}) {
  const projected = projectTurnBalance(game, draft);
  const arc = game.systems.pension.annualRequiredContribution;
  const bondCap = maxBondIssuance(game);
  const reforms = game.pensionReforms;

  return (
    <div>
      <div className="panel">
        <h2>FY{game.year} budget proposal</h2>
        <p style={{ margin: "0 0 12px", color: "var(--ink-muted)" }}>
          Projected surplus{" "}
          <strong
            style={{
              color:
                projected.surplus >= 0 ? "var(--good)" : "var(--bad)",
            }}
          >
            {formatMillions(projected.surplus, true)}
          </strong>{" "}
          · Revenue {formatMillions(projected.revenue)} · Spending{" "}
          {formatMillions(projected.expenditures)}
        </p>
      </div>

      <div className="budget-columns">
        <div className="panel">
          <h2>Revenue levers</h2>
          <div className="slider-row">
            <label>
              <span>Property tax rate</span>
              <span>{formatPercent(draft.propertyTaxRate, 2)}</span>
            </label>
            <input
              type="range"
              min={0.009}
              max={0.015}
              step={0.0001}
              value={draft.propertyTaxRate}
              onChange={(e) =>
                onPatch({ propertyTaxRate: Number(e.target.value) })
              }
            />
          </div>
          <div className="slider-row">
            <label>
              <span>Sales tax rate</span>
              <span>{formatPercent(draft.salesTaxRate, 1)}</span>
            </label>
            <input
              type="range"
              min={0.015}
              max={0.025}
              step={0.001}
              value={draft.salesTaxRate}
              onChange={(e) =>
                onPatch({ salesTaxRate: Number(e.target.value) })
              }
            />
          </div>
          <div className="slider-row">
            <label>
              <span>General obligation bonds</span>
              <span>{formatMillions(draft.bondsToIssue)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={bondCap || 1}
              step={5}
              value={Math.min(draft.bondsToIssue, bondCap)}
              disabled={bondCap <= 0}
              onChange={(e) =>
                onPatch({ bondsToIssue: Number(e.target.value) })
              }
            />
            <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
              Cap {formatMillions(bondCap)} at {game.budget.creditRating} rating
            </div>
          </div>
          <div className="slider-row">
            <label>
              <span>Pension assumed return</span>
              <span>{formatPercent(draft.pensionAssumedReturn, 0)}</span>
            </label>
            <input
              type="range"
              min={0.055}
              max={0.085}
              step={0.005}
              value={draft.pensionAssumedReturn}
              onChange={(e) =>
                onPatch({ pensionAssumedReturn: Number(e.target.value) })
              }
            />
          </div>
          <div className="slider-row">
            <label>
              <span>Zoning reform</span>
            </label>
            <select
              value={draft.zoningReform}
              onChange={(e) =>
                onPatch({
                  zoningReform: e.target.value as PlayerDecisions["zoningReform"],
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
              <option value="none">Status quo</option>
              <option value="modest">Modest upzoning</option>
              <option value="aggressive">Aggressive upzoning</option>
            </select>
          </div>
          <div className="slider-row">
            <label>
              <span>Housing policy</span>
            </label>
            <select
              value={draft.housingPolicy}
              onChange={(e) =>
                onPatch({
                  housingPolicy: e.target
                    .value as PlayerDecisions["housingPolicy"],
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
              <option value="none">No housing program</option>
              <option value="rentControl">Rent control</option>
              <option value="inclusionary">Inclusionary zoning</option>
              <option value="subsidy">Direct subsidy (+$22M/yr)</option>
            </select>
          </div>
        </div>

        <div className="panel">
          <h2>Pension reform (one-time)</h2>
          <p style={{ margin: "0 0 10px", color: "var(--ink-muted)", fontSize: "0.88rem" }}>
            Enact at most once per reform type. Political cost applies immediately.
          </p>
          <select
            value={draft.pensionReform}
            onChange={(e) =>
              onPatch({
                pensionReform: e.target
                  .value as PlayerDecisions["pensionReform"],
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
            <option value="none">No reform this year</option>
            <option value="colaFreeze" disabled={reforms.colaFreeze}>
              Freeze COLA {reforms.colaFreeze ? "(done)" : ""}
            </option>
            <option
              value="closeDbNewHires"
              disabled={reforms.closedDbNewHires}
            >
              Close DB to new hires {reforms.closedDbNewHires ? "(done)" : ""}
            </option>
            <option
              value="raiseEmployeeShare"
              disabled={reforms.raisedEmployeeShare}
            >
              Raise employee share {reforms.raisedEmployeeShare ? "(done)" : ""}
            </option>
          </select>
        </div>

        <div className="panel">
          <h2>Expenditures (millions)</h2>
          {(Object.keys(EXPENDITURE_LABELS) as (keyof typeof EXPENDITURE_LABELS)[]).map(
            (key) => {
              const meta = EXPENDITURE_LABELS[key];
              const max =
                key === "infrastructureMaintenance"
                  ? maintenanceSliderMax(game, meta.max)
                  : meta.max;
              const hint =
                key === "pensionContribution"
                  ? `ARC ${formatMillions(arc)}/yr — underpay compounds`
                  : key === "infrastructureMaintenance" &&
                      game.settings.challengeId === "austerity"
                    ? "Austerity challenge — maintenance cap reduced"
                    : meta.hint;
              return (
                <div className="slider-row" key={key}>
                  <label>
                    <span>{meta.label}</span>
                    <span>{formatMillions(draft.expenditures[key])}</span>
                  </label>
                  <input
                    type="range"
                    min={meta.min}
                    max={max}
                    step={meta.step}
                    value={Math.min(draft.expenditures[key], max)}
                    onChange={(e) =>
                      onPatchExpenditure(key, Number(e.target.value))
                    }
                  />
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--ink-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {hint}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="panel">
        <h2>Consequences preview</h2>
        <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: "0.9rem" }}>
          Cutting maintenance schedules delayed road failures (8–12 yr lag).
          Skipping pension ARC raises future required payments (10–20 yr).
          Tax hikes suppress commercial growth in 3–7 years. Pending items
          appear on the Event Timeline after you adopt the budget.
        </p>
      </div>
    </div>
  );
}
