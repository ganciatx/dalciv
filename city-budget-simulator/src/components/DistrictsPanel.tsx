import type { DistrictPriority, GameState } from "../simulation/types";

function roadClass(condition: number): string {
  if (condition >= 70) return "road-good";
  if (condition >= 45) return "road-mid";
  return "road-bad";
}

export function DistrictsPanel({
  game,
  draftPriority,
  onPriorityChange,
}: {
  game: GameState;
  draftPriority?: DistrictPriority;
  onPriorityChange?: (p: DistrictPriority) => void;
}) {
  const need = game.districts.reduce((s, d) => s + d.maintenanceNeed, 0);
  const priority = draftPriority ?? "balanced";

  return (
    <div>
      <div className="panel">
        <h2>City districts</h2>
        <p style={{ margin: "0 0 16px", color: "var(--ink-muted)", fontSize: "0.9rem" }}>
          Maintenance is split across three districts. Starving outer wards has
          political consequences — ask Council Member Ortiz.
        </p>
        {onPriorityChange && (
          <div className="slider-row" style={{ marginBottom: 20 }}>
            <label>
              <span>Maintenance priority (FY{game.year} budget)</span>
            </label>
            <select
              value={priority}
              onChange={(e) =>
                onPriorityChange(e.target.value as DistrictPriority)
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
              <option value="balanced">Balanced — equal share</option>
              <option value="core">Prioritize Core (downtown)</option>
              <option value="growth">Prioritize Growth corridors</option>
              <option value="outer">Prioritize Outer suburbs</option>
            </select>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: 6 }}>
              Hold-steady citywide: ${Math.round(need)}M/yr on roads
            </div>
          </div>
        )}
      </div>

      <div className="district-grid">
        {game.districts.map((d) => (
          <div key={d.id} className="district-card panel">
            <h3>{d.label}</h3>
            <p className="district-sub">{d.subtitle}</p>
            <div className="district-stats">
              <div>
                <span className="label">Roads</span>
                <span className={`district-value ${roadClass(d.roadCondition)}`}>
                  {Math.round(d.roadCondition)}
                </span>
              </div>
              <div>
                <span className="label">Crime index</span>
                <span className="district-value">{Math.round(d.crimeIndex)}</span>
              </div>
              <div>
                <span className="label">Tax base share</span>
                <span className="district-value">
                  {(d.taxBaseShare * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="label">Population</span>
                <span className="district-value">
                  {(d.populationShare * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="road-bar-wrap">
              <div
                className="road-bar"
                style={{ width: `${d.roadCondition}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
