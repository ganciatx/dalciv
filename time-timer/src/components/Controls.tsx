import { ThemePicker } from "./ThemePicker";

const PRESETS = [1, 5, 10, 15, 20, 25, 30, 45, 60] as const;

interface ControlsProps {
  className?: string;
  durationMinutes: number;
  status: "idle" | "running" | "paused" | "complete";
  alertEnabled: boolean;
  showDigits: boolean;
  themeId: string;
  onPreset: (minutes: number) => void;
  onAdjust: (delta: number) => void;
  onToggleRun: () => void;
  onReset: () => void;
  onToggleAlert: () => void;
  onToggleShowDigits: () => void;
  onThemeSelect: (id: string) => void;
  onFullscreen: () => void;
}

export function Controls({
  className = "",
  durationMinutes,
  status,
  alertEnabled,
  showDigits,
  themeId,
  onPreset,
  onAdjust,
  onToggleRun,
  onReset,
  onToggleAlert,
  onToggleShowDigits,
  onThemeSelect,
  onFullscreen,
}: ControlsProps) {
  const running = status === "running";
  const runLabel =
    status === "running"
      ? "Pause"
      : status === "paused"
        ? "Resume"
        : status === "complete"
          ? "Restart"
          : "Start";

  return (
    <div className={`controls${className ? ` ${className}` : ""}`}>
      <div className="preset-row" role="group" aria-label="Duration presets">
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            className={`preset-btn${durationMinutes === m ? " active" : ""}`}
            onClick={() => onPreset(m)}
            disabled={running}
            aria-pressed={durationMinutes === m}
          >
            {m}
          </button>
        ))}
        <span className="preset-unit">min</span>
      </div>

      <div className="adjust-row">
        <button
          type="button"
          className="adjust-btn"
          onClick={() => onAdjust(-1)}
          disabled={running || durationMinutes <= 1}
          aria-label="Decrease duration by one minute"
        >
          −1
        </button>
        <span className="duration-readout" aria-live="polite">
          {durationMinutes} minute{durationMinutes === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          className="adjust-btn"
          onClick={() => onAdjust(1)}
          disabled={running || durationMinutes >= 60}
          aria-label="Increase duration by one minute"
        >
          +1
        </button>
      </div>

      <div className="action-row">
        <button type="button" className="primary-btn" onClick={onToggleRun}>
          {runLabel}
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={onReset}
          disabled={status === "idle"}
        >
          Reset
        </button>
      </div>

      <div className="options-row">
        <label className="toggle">
          <input
            type="checkbox"
            checked={showDigits}
            onChange={onToggleShowDigits}
          />
          <span>Countdown digits</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={alertEnabled}
            onChange={onToggleAlert}
          />
          <span>End alert</span>
        </label>
        <ThemePicker
          themeId={themeId}
          onSelect={onThemeSelect}
          disabled={running}
        />
        <button type="button" className="ghost-btn" onClick={onFullscreen}>
          Full screen
        </button>
      </div>
    </div>
  );
}
