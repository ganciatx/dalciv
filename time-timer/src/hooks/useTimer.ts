import { useCallback, useEffect, useRef, useState } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "complete";

const MAX_MINUTES = 60;
const MIN_MINUTES = 1;

export function clampMinutes(minutes: number): number {
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(minutes)));
}

export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface UseTimerOptions {
  /** Play a short tone when the countdown reaches zero. */
  alertOnComplete?: boolean;
  onComplete?: () => void;
}

export function useTimer({ alertOnComplete = true, onComplete }: UseTimerOptions = {}) {
  const [durationMs, setDurationMs] = useState(10 * 60_000);
  const [remainingMs, setRemainingMs] = useState(10 * 60_000);
  const [status, setStatus] = useState<TimerStatus>("idle");

  const endAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const alertedRef = useRef(false);
  const statusRef = useRef(status);
  const durationMsRef = useRef(durationMs);
  const remainingMsRef = useRef(remainingMs);
  const alertOnCompleteRef = useRef(alertOnComplete);
  const onCompleteRef = useRef(onComplete);

  statusRef.current = status;
  durationMsRef.current = durationMs;
  remainingMsRef.current = remainingMs;
  alertOnCompleteRef.current = alertOnComplete;
  onCompleteRef.current = onComplete;

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const playAlert = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      osc.onended = () => void ctx.close();
    } catch {
      /* Audio may be blocked until user gesture */
    }
  }, []);

  const scheduleTick = useCallback(() => {
    const run = () => {
      const endAt = endAtRef.current;
      if (endAt == null) return;

      const left = Math.max(0, endAt - performance.now());
      remainingMsRef.current = left;
      setRemainingMs(left);

      if (left <= 0) {
        stopLoop();
        endAtRef.current = null;
        setStatus("complete");
        if (!alertedRef.current) {
          alertedRef.current = true;
          if (alertOnCompleteRef.current) playAlert();
          onCompleteRef.current?.();
        }
        return;
      }

      rafRef.current = requestAnimationFrame(run);
    };

    stopLoop();
    rafRef.current = requestAnimationFrame(run);
  }, [playAlert, stopLoop]);

  const start = useCallback(() => {
    if (statusRef.current === "running") return;
    alertedRef.current = false;
    const left =
      statusRef.current === "paused"
        ? remainingMsRef.current
        : durationMsRef.current;
    remainingMsRef.current = left;
    setRemainingMs(left);
    endAtRef.current = performance.now() + left;
    setStatus("running");
    scheduleTick();
  }, [scheduleTick]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    stopLoop();
    endAtRef.current = null;
    setStatus("paused");
  }, [stopLoop]);

  const reset = useCallback(() => {
    stopLoop();
    endAtRef.current = null;
    alertedRef.current = false;
    const ms = durationMsRef.current;
    remainingMsRef.current = ms;
    setRemainingMs(ms);
    setStatus("idle");
  }, [stopLoop]);

  const setDurationMinutes = useCallback(
    (minutes: number) => {
      const clamped = clampMinutes(minutes);
      const ms = clamped * 60_000;
      stopLoop();
      endAtRef.current = null;
      alertedRef.current = false;
      durationMsRef.current = ms;
      remainingMsRef.current = ms;
      setDurationMs(ms);
      setRemainingMs(ms);
      setStatus("idle");
    },
    [stopLoop],
  );

  const adjustMinutes = useCallback(
    (delta: number) => {
      const next = clampMinutes(durationMsRef.current / 60_000 + delta);
      setDurationMinutes(next);
    },
    [setDurationMinutes],
  );

  useEffect(() => () => stopLoop(), [stopLoop]);

  const toggleRun = useCallback(() => {
    if (statusRef.current === "running") pause();
    else start();
  }, [pause, start]);

  /** Red wedge as a fraction of the 60-minute face (Time Timer® dial semantics). */
  const fractionOfDial = Math.min(
    1,
    Math.max(0, remainingMs / (MAX_MINUTES * 60_000)),
  );

  return {
    durationMs,
    remainingMs,
    fractionOfDial,
    status,
    clockLabel: formatClock(remainingMs),
    durationMinutes: durationMs / 60_000,
    start,
    pause,
    reset,
    setDurationMinutes,
    adjustMinutes,
    toggleRun,
  };
}
