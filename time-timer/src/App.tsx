import { useCallback, useEffect, useState } from "react";
import { Controls } from "./components/Controls";
import { TimeTimerFace } from "./components/TimeTimerFace";
import { useShowDigits } from "./hooks/useShowDigits";
import { useTheme } from "./hooks/useTheme";
import { useTimer } from "./hooks/useTimer";

function statusCaption(status: ReturnType<typeof useTimer>["status"]): string {
  switch (status) {
    case "running":
      return "Running";
    case "paused":
      return "Paused";
    case "complete":
      return "Time's up";
    default:
      return "Ready";
  }
}

export default function App() {
  const [alertEnabled, setAlertEnabled] = useState(true);
  const { showDigits, toggleShowDigits } = useShowDigits();
  const { theme, themeId, selectTheme } = useTheme();

  const timer = useTimer({
    alertOnComplete: alertEnabled,
    onComplete: () => {
      document.title = "Time's up · Time Timer";
    },
  });

  useEffect(() => {
    if (timer.status === "running" || timer.status === "paused") {
      document.title = `${timer.clockLabel} · Time Timer`;
    } else if (timer.status !== "complete") {
      document.title = "Time Timer";
    }
  }, [timer.clockLabel, timer.status]);

  const handleFullscreen = useCallback(() => {
    const el = document.querySelector(".timer-stage");
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  }, []);

  const { toggleRun, reset, pause } = timer;
  const focusMode = timer.status === "running";

  useEffect(() => {
    document.body.classList.toggle("timer-focus-active", focusMode);
    return () => document.body.classList.remove("timer-focus-active");
  }, [focusMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggleRun();
      } else if (e.key === "r" || e.key === "R") {
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleRun, reset]);

  const handleClockPointer = useCallback(() => {
    if (timer.status === "running") pause();
  }, [pause, timer.status]);

  return (
    <div className={`app${focusMode ? " app--focus" : ""}`}>
      {focusMode ? (
        <p className="sr-only" aria-live="polite">
          Focus mode. Tap the clock or press Space to pause.
        </p>
      ) : null}
      <header className="top-bar app-chrome">
        <a className="home-link" href="/">
          ← Portal
        </a>
        <div className="brand">
          <h1>Time Timer</h1>
          <p>60-minute visual countdown</p>
        </div>
      </header>

      <main className="main">
        <div
          className={`timer-stage${focusMode ? " timer-stage--focus" : ""}`}
          style={{ "--timer-accent": theme.disk } as React.CSSProperties}
          onClick={focusMode ? handleClockPointer : undefined}
          onKeyDown={
            focusMode
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClockPointer();
                  }
                }
              : undefined
          }
          role={focusMode ? "button" : undefined}
          tabIndex={focusMode ? 0 : undefined}
          aria-label={focusMode ? "Pause timer" : undefined}
        >
          <TimeTimerFace
            theme={theme}
            fractionRemaining={timer.fractionOfDial}
            clockLabel={timer.clockLabel}
            statusLabel={statusCaption(timer.status)}
            minimalCenter={focusMode}
            showDigits={showDigits}
          />
        </div>
        <Controls
          className="app-chrome"
          durationMinutes={timer.durationMinutes}
          status={timer.status}
          alertEnabled={alertEnabled}
          showDigits={showDigits}
          themeId={themeId}
          onPreset={timer.setDurationMinutes}
          onAdjust={timer.adjustMinutes}
          onToggleRun={timer.toggleRun}
          onReset={timer.reset}
          onToggleAlert={() => setAlertEnabled((v) => !v)}
          onToggleShowDigits={toggleShowDigits}
          onThemeSelect={selectTheme}
          onFullscreen={handleFullscreen}
        />
      </main>

      <footer className="footer app-chrome">
        Inspired by the{" "}
        <a
          href="https://www.timetimer.com/collections/all-1/products/time-timer-12-inch"
          target="_blank"
          rel="noopener noreferrer"
        >
          Time Timer® Original 12″
        </a>
        . Silent while running; optional tone at zero. Space to start/pause, R to
        reset.
      </footer>
    </div>
  );
}
