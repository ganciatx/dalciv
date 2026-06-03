import { useCallback, useEffect, useId, useRef, useState } from "react";
import { getTheme, themePickerGroups, type TimerTheme } from "../themes";

interface ThemePickerProps {
  themeId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

function Swatch({ theme, selected }: { theme: TimerTheme; selected: boolean }) {
  return (
    <span className="theme-swatch" aria-hidden="true">
      <span className="theme-swatch-frame" style={{ background: theme.frame }} />
      <span className="theme-swatch-face" style={{ background: theme.face }} />
      <span className="theme-swatch-disk" style={{ background: theme.disk }} />
      {selected ? <span className="theme-swatch-check">✓</span> : null}
    </span>
  );
}

function TriggerSwatch({ theme }: { theme: TimerTheme }) {
  return (
    <span className="theme-trigger-swatch" aria-hidden="true">
      <span style={{ background: theme.frame }} />
      <span style={{ background: theme.face }} />
      <span style={{ background: theme.disk }} />
    </span>
  );
}

export function ThemePicker({ themeId, onSelect, disabled }: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const activeTheme = getTheme(themeId);
  const groups = themePickerGroups();

  const close = useCallback(() => setOpen(false), []);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      close();
    },
    [close, onSelect],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [close, open]);

  return (
    <div className="theme-picker-wrap" ref={wrapRef}>
      <button
        type="button"
        className="theme-trigger"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        title={`Color: ${activeTheme.name}`}
      >
        <TriggerSwatch theme={activeTheme} />
        <span className="theme-trigger-label">Color</span>
      </button>

      {open ? (
        <div
          id={panelId}
          className="theme-panel"
          role="dialog"
          aria-label="Choose clock color"
        >
          <div className="theme-panel-head">
            <h2 className="theme-panel-title">Clock color</h2>
            <button
              type="button"
              className="theme-panel-close"
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {disabled ? (
            <p className="theme-panel-hint">Pause the timer to change color.</p>
          ) : null}
          {groups.map((group) => (
            <div key={group.label} className="theme-group">
              <p className="theme-group-label">{group.label}</p>
              <div className="theme-grid" role="list">
                {group.themes.map((theme) => {
                  const selected = theme.id === themeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      role="listitem"
                      className={`theme-option${selected ? " selected" : ""}`}
                      onClick={() => handleSelect(theme.id)}
                      disabled={disabled}
                      aria-pressed={selected}
                      aria-label={`${theme.name}${selected ? ", selected" : ""}`}
                      title={theme.name}
                    >
                      <Swatch theme={theme} selected={selected} />
                      <span className="theme-option-name">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
