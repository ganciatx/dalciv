import { formatMillions } from "../simulation/simulate";
import type { YearSummary } from "../simulation/yearSummary";

const END_LABELS: Record<string, string> = {
  fiscal_crisis: "Fiscal crisis — the term ended in insolvency.",
  election_loss: "Lost re-election.",
  state_takeover: "State fiscal takeover.",
  liquidity_trap: "Bond markets closed — liquidity trap.",
  completed: "Full term completed.",
};

export function YearSummaryModal({
  summary,
  onDismiss,
}: {
  summary: YearSummary;
  onDismiss: () => void;
}) {
  return (
    <div
      className="year-summary-overlay"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        className="year-summary-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="year-summary-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onDismiss();
        }}
      >
        <h2 id="year-summary-title">
          FY{summary.closedYear} closed
        </h2>
        <p className="year-summary-subtitle">
          Now planning FY{summary.newYear} · Revenue {formatMillions(summary.revenue)}{" "}
          · Spending {formatMillions(summary.expenditures)}
        </p>

        <p className="year-summary-headline">{summary.headline}</p>

        {summary.gameEnded && summary.endReason && (
          <div className="year-summary-ended">
            Campaign ended: {END_LABELS[summary.endReason] ?? summary.endReason}
          </div>
        )}

        {summary.electionHeld && !summary.gameEnded && (
          <div className="year-summary-callout">Election year — see headline above.</div>
        )}

        {summary.randomEventLabel && (
          <div className="year-summary-callout">
            Random event: {summary.randomEventLabel}
          </div>
        )}

        {summary.highlights.length > 0 && (
          <section className="year-summary-section">
            <h3>Highlights</h3>
            <ul>
              {summary.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        )}

        {summary.fiscalLines.length > 0 && (
          <section className="year-summary-section">
            <h3>Fiscal</h3>
            <ChangeTable lines={summary.fiscalLines} />
          </section>
        )}

        {summary.metricLines.length > 0 && (
          <section className="year-summary-section">
            <h3>City metrics</h3>
            <ChangeTable lines={summary.metricLines} />
          </section>
        )}

        {summary.approvals.length > 0 && (
          <section className="year-summary-section">
            <h3>Approval shifts</h3>
            <ul className="approval-delta-list">
              {summary.approvals.map((a) => (
                <li key={a.factionId}>
                  <span>{a.name}</span>
                  <span>
                    {a.before}% → {a.after}%
                    <span
                      className={
                        a.delta > 0
                          ? "delta-good"
                          : a.delta < 0
                            ? "delta-bad"
                            : ""
                      }
                    >
                      {" "}
                      ({a.delta > 0 ? "+" : ""}
                      {a.delta})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {summary.alerts.length > 0 && (
          <section className="year-summary-section">
            <h3>This year&apos;s notices</h3>
            <ul>
              {summary.alerts.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
        )}

        {summary.achievements.length > 0 && (
          <section className="year-summary-section">
            <h3>Achievements unlocked</h3>
            <ul>
              {summary.achievements.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="year-summary-actions">
          <button type="button" className="btn-primary" onClick={onDismiss}>
            Continue to FY{summary.newYear}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangeTable({ lines }: { lines: YearSummary["fiscalLines"] }) {
  return (
    <table className="year-summary-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Was</th>
          <th>Now</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.label}>
            <td>{line.label}</td>
            <td>{line.before}</td>
            <td>{line.after}</td>
            <td className={`delta-${line.sentiment}`}>{line.deltaText}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
