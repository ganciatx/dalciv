import { formatMillions } from "../simulation/simulate";
import type { DelayedEvent, GameState } from "../simulation/types";

function severityClass(event: DelayedEvent): string {
  if (event.fiscalImpact >= 20) return "severity-high";
  if (event.fiscalImpact >= 8) return "severity-mid";
  return "severity-low";
}

function yearsUntil(game: GameState, event: DelayedEvent): number {
  return Math.max(0, event.triggerYear - game.year);
}

function progressPct(game: GameState, event: DelayedEvent): number {
  const total = Math.max(1, event.triggerYear - event.createdYear);
  const elapsed = game.year - event.createdYear;
  return Math.min(100, Math.round((elapsed / total) * 100));
}

export function EventTimeline({ game }: { game: GameState }) {
  const events = [...game.eventQueue].sort(
    (a, b) => a.triggerYear - b.triggerYear,
  );

  if (!events.length) {
    return (
      <div className="panel">
        <h2>Event timeline</h2>
        <p style={{ margin: 0, color: "var(--ink-muted)" }}>
          No pending delayed consequences. Your choices this year may add
          events when you close the budget.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Event timeline — grenades in flight</h2>
      <ul className="event-list">
        {events.map((event) => (
          <li key={event.id} className="event-item">
            <div className="event-year">
              <div>Yr {event.triggerYear}</div>
              <div className="event-countdown">
                {yearsUntil(game, event)} yr left
              </div>
            </div>
            <div>
              <div className="event-progress">
                <div
                  className="event-progress-fill"
                  style={{ width: `${progressPct(game, event)}%` }}
                />
              </div>
              <div style={{ fontWeight: 600 }}>{event.description}</div>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "var(--ink-muted)",
                  marginTop: "4px",
                }}
              >
                {event.category}
                {event.sourceDecision
                  ? ` · caused by: ${event.sourceDecision}`
                  : ""}
                {event.canBeMitigated && event.mitigationCondition
                  ? ` · Mitigate: ${event.mitigationCondition}`
                  : ""}
              </div>
            </div>
            <div className={severityClass(event)}>
              {event.fiscalImpact === 0
                ? "Political"
                : formatMillions(event.fiscalImpact, true)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
