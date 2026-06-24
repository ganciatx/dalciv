import type { GameView } from "../store/gameStore";

/** Simple inline icons for each room (no external assets). */
function RoomIcon({ id }: { id: GameView }) {
  const props = { width: 20, height: 20, fill: "currentColor", "aria-hidden": true as const };
  switch (id) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2L4 7v2h2v11h12V9h2V7l-8-5zm-1 14H9v-5h2v5zm4 0h-2v-5h2v5z" />
        </svg>
      );
    case "budget":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" />
        </svg>
      );
    case "politics":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4z" />
        </svg>
      );
    case "staff":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z" />
        </svg>
      );
    case "development":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M22 19V5H2v14h20zM4 7h16v10H4V7zm2 2v2h4V9H6zm6 0v2h6V9h-6z" />
        </svg>
      );
    case "districts":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2C8 2 5 5 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        </svg>
      );
    case "timeline":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
        </svg>
      );
    case "history":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
        </svg>
      );
  }
}

/** Room metadata: label shown on the floorplan and grid placement. */
type RoomDef = {
  id: GameView;
  label: string;
  hint: string;
  gridArea: string;
};

/**
 * City Hall floorplan — each room maps to a game view.
 * Grid areas match `grid-template-areas` in index.css (`.city-hall-map`).
 */
const ROOMS: RoomDef[] = [
  {
    id: "dashboard",
    label: "Mayor's Office",
    hint: "City overview & headlines",
    gridArea: "mayor",
  },
  {
    id: "budget",
    label: "Budget Office",
    hint: "Revenue, spending & bonds",
    gridArea: "finance",
  },
  {
    id: "politics",
    label: "Council Chambers",
    hint: "Approvals & factions",
    gridArea: "politics",
  },
  {
    id: "staff",
    label: "Staff Desks",
    hint: "Advisors & campaign",
    gridArea: "staff",
  },
  {
    id: "development",
    label: "Planning Dept",
    hint: "Housing & economic dev",
    gridArea: "planning",
  },
  {
    id: "districts",
    label: "District Affairs",
    hint: "Neighborhood priorities",
    gridArea: "districts",
  },
  {
    id: "timeline",
    label: "Events Desk",
    hint: "Scheduled crises",
    gridArea: "events",
  },
  {
    id: "history",
    label: "City Archives",
    hint: "Trends & newspapers",
    gridArea: "archives",
  },
];

/** Views locked after the campaign ends (read-only areas remain open). */
const END_LOCKED: GameView[] = [
  "budget",
  "development",
  "districts",
  "staff",
];

export function CityHallFloorplan({
  activeView,
  gameEnded,
  onSelect,
}: {
  activeView: GameView;
  gameEnded: boolean;
  onSelect: (view: GameView) => void;
}) {
  const activeRoom = ROOMS.find((r) => r.id === activeView);

  return (
    <nav className="city-hall-nav" aria-label="City Hall floorplan">
      <div className="city-hall-nav-header">
        <h2 className="city-hall-nav-title">City Hall</h2>
        <p className="city-hall-nav-sub">
          {activeRoom
            ? `You are in: ${activeRoom.label}`
            : "Tap a room to move"}
        </p>
      </div>

      <div className="city-hall-map" role="list">
        {/* Central corridor — decorative, not a destination */}
        <div className="city-hall-corridor" aria-hidden="true">
          <span className="corridor-label">Main Hall</span>
        </div>

        {ROOMS.map((room) => {
          const locked = gameEnded && END_LOCKED.includes(room.id);
          const active = activeView === room.id;
          return (
            <button
              key={room.id}
              type="button"
              role="listitem"
              className={`city-hall-room ${active ? "active" : ""} ${locked ? "locked" : ""}`}
              style={{ gridArea: room.gridArea }}
              onClick={() => !locked && onSelect(room.id)}
              disabled={locked}
              aria-current={active ? "page" : undefined}
              aria-label={`${room.label} — ${room.hint}${locked ? " (locked)" : ""}`}
              title={locked ? "Campaign ended — view scorecard only" : room.hint}
            >
              <span className="city-hall-room-icon">
                <RoomIcon id={room.id} />
              </span>
              <span className="city-hall-room-label">{room.label}</span>
            </button>
          );
        })}
      </div>

      <p className="city-hall-legend">
        Walk the building to manage your term. Locked rooms close when the campaign
        ends.
      </p>
    </nav>
  );
}
