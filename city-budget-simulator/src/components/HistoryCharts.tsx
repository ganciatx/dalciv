import { formatMillions } from "../simulation/simulate";
import type { GameState } from "../simulation/types";

function SparkBars({
  values,
  max,
  color,
}: {
  values: number[];
  max: number;
  color: string;
}) {
  if (!values.length) return <p style={{ color: "var(--ink-muted)" }}>No history yet.</p>;
  return (
    <div className="spark-bars" role="img" aria-hidden="true">
      {values.map((v, i) => (
        <div
          key={i}
          className="spark-bar"
          style={{
            height: `${Math.max(4, (v / max) * 100)}%`,
            background: color,
          }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

export function HistoryCharts({ game }: { game: GameState }) {
  const h = game.history;
  const fundBalances = h.map((r) => r.fundBalance);
  const taxBases = h.map((r) => r.taxBase);
  const crime = h.map((r) => r.crimeRate);

  const maxFund = Math.max(...fundBalances, 100);
  const maxTax = Math.max(...taxBases, 1000);
  const maxCrime = 100;

  return (
    <div>
      <div className="panel">
        <h2>10-year history</h2>
        <p style={{ margin: "0 0 16px", color: "var(--ink-muted)", fontSize: "0.9rem" }}>
          {h.length} years recorded · Credit {game.budget.creditRating}
        </p>
        <div className="chart-grid">
          <div className="chart-block">
            <div className="chart-label">Fund balance</div>
            <SparkBars values={fundBalances} max={maxFund} color="var(--accent)" />
            {fundBalances.length > 0 && (
              <div className="chart-foot">
                Latest {formatMillions(fundBalances[fundBalances.length - 1])}
              </div>
            )}
          </div>
          <div className="chart-block">
            <div className="chart-label">Tax base (assessed)</div>
            <SparkBars values={taxBases} max={maxTax} color="var(--blue)" />
            {taxBases.length > 0 && (
              <div className="chart-foot">
                Latest {formatMillions(taxBases[taxBases.length - 1])}
              </div>
            )}
          </div>
          <div className="chart-block">
            <div className="chart-label">Crime index</div>
            <SparkBars values={crime} max={maxCrime} color="var(--bad)" />
            {crime.length > 0 && (
              <div className="chart-foot">Latest {crime[crime.length - 1]}</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Year-by-year</h2>
        <ul className="history-table">
          {[...h].reverse().slice(0, 10).map((r) => (
            <li key={r.year}>
              <span className="hist-year">FY{r.year}</span>
              <span>{formatMillions(r.revenue)} in</span>
              <span>{formatMillions(r.expenditures)} out</span>
              <span className="hist-rating">{r.creditRating}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
