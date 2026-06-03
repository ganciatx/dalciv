import { maxBondIssuance } from "../simulation/credit";
import { formatMillions, formatPercent } from "../simulation/simulate";
import type { GameState } from "../simulation/types";
import { NewspaperFeed } from "./NewspaperFeed";
import { Skyline } from "./Skyline";

function avgInfra(state: GameState): number {
  const assets = state.systems.infrastructure.assets;
  return Math.round(
    assets.reduce((s, a) => s + a.condition, 0) / assets.length,
  );
}

export function Dashboard({ game }: { game: GameState }) {
  const infra = avgInfra(game);
  const last = game.history[game.history.length - 1];

  return (
    <div>
      <Skyline infraHealth={infra} crimeRate={game.systems.safety.crimeRate} />

      {game.alerts.length > 0 && (
        <div className="alerts">
          {game.alerts.map((a) => (
            <div key={a} className="alert">
              {a}
            </div>
          ))}
        </div>
      )}

      <div className="headline-bar">{game.lastHeadline}</div>

      {game.staff?.lastBriefing?.some((n) => n.heeded) && (
        <div className="panel council-snippet" style={{ marginBottom: 12 }}>
          <div className="quote-speaker">Mayor&apos;s office</div>
          <p className="quote-text" style={{ margin: "8px 0 0", fontSize: "0.9rem" }}>
            {game.staff.lastBriefing
              .filter((n) => n.heeded)
              .map((n) => n.title)
              .join(" · ")}
          </p>
        </div>
      )}

      {game.factionQuotes?.length > 0 && (
        <div className="panel council-snippet">
          <div className="quote-speaker">
            {game.factionQuotes.find((q) => q.tone === "angry")?.speakerName ??
              game.factionQuotes[0].speakerName}
          </div>
          <p className="quote-text" style={{ margin: "8px 0 0" }}>
            {game.factionQuotes.find((q) => q.tone === "angry")?.text ??
              game.factionQuotes[0].text}
          </p>
        </div>
      )}

      <div className="metric-grid">
        <div className="metric-tile">
          <div className="label">Fiscal year</div>
          <div className="value">{game.year}</div>
          <div className="hint">
            {game.history.length}/{game.maxYears} years played
          </div>
        </div>
        <div className="metric-tile">
          <div className="label">Fund balance</div>
          <div className="value">{formatMillions(game.budget.fundBalance)}</div>
          <div className="hint">Rainy day {formatMillions(game.budget.rainyDayFund)}</div>
        </div>
        <div className="metric-tile">
          <div className="label">Credit rating</div>
          <div className="value">{game.budget.creditRating}</div>
          <div className="hint">
            Bonds up to {formatMillions(maxBondIssuance(game))}/yr
          </div>
        </div>
        <div className="metric-tile">
          <div className="label">Leading indicators</div>
          <div className="value" style={{ fontSize: "1rem" }}>
            {game.taxBase.permitsIssued.toLocaleString()} permits
          </div>
          <div className="hint">
            Pop {(game.taxBase.populationTrend * 100).toFixed(1)}% · Tax base
            forecast {formatMillions(game.taxBase.forecastValue3yr)}
          </div>
        </div>
        <div className="metric-tile">
          <div className="label">Coalition score</div>
          <div className="value">{game.politics.coalitionScore}%</div>
          <div className="hint">Election in {game.politics.yearsUntilElection} yrs</div>
        </div>
        <div className="metric-tile">
          <div className="label">Tax base</div>
          <div className="value">{formatMillions(game.taxBase.totalValue)}</div>
          <div className="hint">{game.taxBase.permitsIssued.toLocaleString()} permits</div>
        </div>
        <div className="metric-tile">
          <div className="label">Infrastructure</div>
          <div className="value">{infra}/100</div>
          <div className="hint">
            Deferred {formatMillions(game.systems.infrastructure.deferredMaintenanceLiability)}
          </div>
        </div>
        <div className="metric-tile">
          <div className="label">Pension funded</div>
          <div className="value">
            {formatPercent(game.systems.pension.fundedRatio, 0)}
          </div>
          <div className="hint">
            ARC {formatMillions(game.systems.pension.annualRequiredContribution)}/yr
          </div>
        </div>
        <div className="metric-tile">
          <div className="label">Affordability</div>
          <div className="value">
            {formatPercent(game.systems.housing.affordabilityIndex, 0)}
          </div>
          <div className="hint">Rent/income ratio</div>
        </div>
        <div className="metric-tile">
          <div className="label">Crime index</div>
          <div className="value">{game.systems.safety.crimeRate}</div>
          <div className="hint">
            Response {game.systems.safety.responseTimeMinutes.toFixed(1)} min
          </div>
        </div>
        <div className="metric-tile">
          <div className="label">School quality</div>
          <div className="value">
            {Math.round(game.systems.education.qualityIndex)}
          </div>
          <div className="hint">
            Grad {(game.systems.education.graduationRate * 100).toFixed(0)}%
          </div>
        </div>
        <div className="metric-tile">
          <div className="label">EDC / employers</div>
          <div className="value">{game.economicDevelopment.employers.length}</div>
          <div className="hint">
            Pipeline {Math.round(game.economicDevelopment.pipelineProgress)}% · Attr{" "}
            {Math.round(game.economicDevelopment.attractiveness)}
          </div>
        </div>
        {game.capital.active && (
          <div className="metric-tile">
            <div className="label">Capital build</div>
            <div className="value" style={{ fontSize: "0.95rem" }}>
              {game.capital.active.progress}%
            </div>
            <div className="hint">{game.capital.active.label}</div>
          </div>
        )}
      </div>

      <NewspaperFeed game={game} />

      {last && (
        <div className="panel">
          <h2>Last closed year (FY{last.year})</h2>
          <p style={{ margin: 0, color: "var(--ink-muted)" }}>
            Revenue {formatMillions(last.revenue)} · Spending{" "}
            {formatMillions(last.expenditures)} · Ending balance{" "}
            {formatMillions(last.fundBalance)}
          </p>
        </div>
      )}

      <div className="panel">
        <h2>Infrastructure assets</h2>
        <div className="metric-grid">
          {game.systems.infrastructure.assets.map((a) => (
            <div key={a.id} className="metric-tile">
              <div className="label">{a.label}</div>
              <div className="value">{Math.round(a.condition)}</div>
              <div className="hint">Hold-steady {formatMillions(a.maintenanceToHold)}/yr</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
