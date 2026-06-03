import { CAPITAL_PROJECT_CATALOG } from "../simulation/capitalProjects";
import { formatMillions } from "../simulation/simulate";
import type { GameState, PlayerDecisions, RecruitmentFocus } from "../simulation/types";

const FOCUS_LABELS: Record<RecruitmentFocus, string> = {
  none: "No active recruitment",
  tech: "Technology & R&D",
  logistics: "Logistics & distribution",
  manufacturing: "Advanced manufacturing",
  hq: "Corporate headquarters",
};

export function DevelopmentPanel({
  game,
  draft,
  onPatch,
  onPatchExpenditure,
}: {
  game: GameState;
  draft: PlayerDecisions;
  onPatch: (patch: Partial<PlayerDecisions>) => void;
  onPatchExpenditure: (
    key: keyof PlayerDecisions["expenditures"],
    value: number,
  ) => void;
}) {
  const edu = game.systems.education;
  const ed = game.economicDevelopment;
  const active = game.capital.active;
  const completed = new Set(game.capital.completedIds);

  return (
    <div className="budget-columns">
      <div className="panel">
        <h2>Education system</h2>
        <p style={{ margin: "0 0 12px", color: "var(--ink-muted)", fontSize: "0.9rem" }}>
          K–12 funding drives quality, graduation, and teacher retention. Strong schools
          boost population growth and employer recruitment.
        </p>
        <div className="metric-grid" style={{ marginBottom: "16px" }}>
          <div className="metric-tile">
            <div className="label">Quality index</div>
            <div className="value">{Math.round(edu.qualityIndex)}</div>
          </div>
          <div className="metric-tile">
            <div className="label">Graduation</div>
            <div className="value">{(edu.graduationRate * 100).toFixed(0)}%</div>
          </div>
          <div className="metric-tile">
            <div className="label">Teacher retention</div>
            <div className="value">{(edu.teacherRetention * 100).toFixed(0)}%</div>
          </div>
          <div className="metric-tile">
            <div className="label">Enrollment</div>
            <div className="value">{(edu.enrollment / 1000).toFixed(0)}k</div>
          </div>
        </div>
        <div className="slider-row">
          <label>
            <span>Education budget (FY{game.year})</span>
            <span>{formatMillions(draft.expenditures.education)}</span>
          </label>
          <input
            type="range"
            min={60}
            max={280}
            step={2}
            value={draft.expenditures.education}
            onChange={(e) =>
              onPatchExpenditure("education", Number(e.target.value))
            }
          />
          <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
            Current spend {formatMillions(game.expenditures.education)} · Capacity{" "}
            {Math.round(edu.capacityIndex)}/100
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Economic development</h2>
        <p style={{ margin: "0 0 12px", color: "var(--ink-muted)", fontSize: "0.9rem" }}>
          Court employers with EDC spending and a recruitment focus. Pipeline fills when
          schools, safety, and infrastructure stay competitive.
        </p>
        <div className="metric-grid" style={{ marginBottom: "12px" }}>
          <div className="metric-tile">
            <div className="label">Attractiveness</div>
            <div className="value">{Math.round(ed.attractiveness)}</div>
          </div>
          <div className="metric-tile">
            <div className="label">Pipeline</div>
            <div className="value">{Math.round(ed.pipelineProgress)}%</div>
          </div>
          <div className="metric-tile">
            <div className="label">Employers</div>
            <div className="value">{ed.employers.length}</div>
          </div>
        </div>
        <div className="slider-row">
          <label>
            <span>EDC budget</span>
            <span>{formatMillions(draft.expenditures.economicDevelopment)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={65}
            step={1}
            value={draft.expenditures.economicDevelopment}
            onChange={(e) =>
              onPatchExpenditure("economicDevelopment", Number(e.target.value))
            }
          />
        </div>
        <div className="slider-row">
          <label>
            <span>Recruitment focus</span>
          </label>
          <select
            value={draft.recruitmentFocus}
            onChange={(e) =>
              onPatch({
                recruitmentFocus: e.target.value as RecruitmentFocus,
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
            {(Object.keys(FOCUS_LABELS) as RecruitmentFocus[]).map((id) => (
              <option key={id} value={id}>
                {FOCUS_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
        {ed.employers.length > 0 && (
          <ul style={{ margin: "12px 0 0", paddingLeft: "18px", fontSize: "0.88rem" }}>
            {[...ed.employers].reverse().slice(0, 5).map((emp) => (
              <li key={emp.id}>
                <strong>{emp.name}</strong> — {emp.jobs.toLocaleString()} jobs, +
                {formatMillions(emp.taxBaseAdded)} tax base
                {emp.landedYear ? ` (FY${emp.landedYear})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <h2>Capital projects</h2>
        <p style={{ margin: "0 0 12px", color: "var(--ink-muted)", fontSize: "0.9rem" }}>
          Multi-year investments. Fund annually at or above the suggested contribution or
          the schedule slips. One active project at a time.
        </p>
        {active ? (
          <div className="metric-grid" style={{ marginBottom: "12px" }}>
            <div className="metric-tile" style={{ gridColumn: "1 / -1" }}>
              <div className="label">In progress</div>
              <div className="value" style={{ fontSize: "1rem" }}>
                {active.label}
              </div>
              <div className="hint">
                {active.progress}% complete · {active.yearsRemaining} years left ·{" "}
                {formatMillions(active.spent)} of {formatMillions(active.totalCost)}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ margin: "0 0 12px", color: "var(--ink-muted)" }}>
            No active capital project — authorize one below.
          </p>
        )}
        <div className="slider-row">
          <label>
            <span>Annual capital contribution</span>
            <span>{formatMillions(draft.expenditures.capitalProjects)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={45}
            step={1}
            value={draft.expenditures.capitalProjects}
            onChange={(e) =>
              onPatchExpenditure("capitalProjects", Number(e.target.value))
            }
          />
        </div>
        {!active && (
          <div className="slider-row">
            <label>
              <span>Authorize new project</span>
            </label>
            <select
              value={draft.newCapitalProjectId}
              onChange={(e) =>
                onPatch({ newCapitalProjectId: e.target.value })
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
              <option value="none">None this year</option>
              {CAPITAL_PROJECT_CATALOG.filter((p) => !completed.has(p.id)).map(
                (p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({formatMillions(p.totalCost)}, {p.durationYears} yr)
                  </option>
                ),
              )}
            </select>
          </div>
        )}
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ fontSize: "0.95rem", margin: "0 0 8px" }}>Project catalog</h3>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.85rem" }}>
            {CAPITAL_PROJECT_CATALOG.map((p) => (
              <li
                key={p.id}
                style={{
                  marginBottom: "6px",
                  opacity: completed.has(p.id) ? 0.55 : 1,
                }}
              >
                <strong>{p.label}</strong>
                {completed.has(p.id) ? " (completed)" : ""} — {p.description}. Suggested{" "}
                {formatMillions(p.annualContribution)}/yr.
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
