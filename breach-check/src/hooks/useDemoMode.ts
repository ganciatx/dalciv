import { useCallback, useEffect, useRef, useState } from "react";

const INACTIVITY_MS = 60_000;

interface UseDemoModeOptions {
  /** Clear form/results when returning to the attract screen. */
  onReturnToAttract: () => void;
  /** Called on pointer activity — used to enter monitor fullscreen. */
  onPointerActivity?: () => void;
}

/**
 * Booth demo mode: fullscreen attract screen by default; wake on pointer
 * activity; sleep after 1 minute idle. Esc toggles between views.
 */
export function useDemoMode({ onReturnToAttract, onPointerActivity }: UseDemoModeOptions) {
  const [isAttract, setIsAttract] = useState(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAttractRef = useRef(isAttract);

  useEffect(() => {
    isAttractRef.current = isAttract;
  }, [isAttract]);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current !== null) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const returnToAttract = useCallback(() => {
    clearInactivityTimer();
    onReturnToAttract();
    isAttractRef.current = true;
    setIsAttract(true);
  }, [clearInactivityTimer, onReturnToAttract]);

  const scheduleInactivityReturn = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(returnToAttract, INACTIVITY_MS);
  }, [clearInactivityTimer, returnToAttract]);

  const wakeInteractive = useCallback(() => {
    if (!isAttractRef.current) return;
    onPointerActivity?.();
    isAttractRef.current = false;
    setIsAttract(false);
    scheduleInactivityReturn();
  }, [onPointerActivity, scheduleInactivityReturn]);

  const registerActivity = useCallback(() => {
    if (isAttractRef.current) return;
    onPointerActivity?.();
    scheduleInactivityReturn();
  }, [onPointerActivity, scheduleInactivityReturn]);

  const toggleDemoMode = useCallback(() => {
    if (isAttractRef.current) {
      onPointerActivity?.();
      isAttractRef.current = false;
      setIsAttract(false);
      scheduleInactivityReturn();
      return;
    }
    clearInactivityTimer();
    onReturnToAttract();
    isAttractRef.current = true;
    setIsAttract(true);
  }, [clearInactivityTimer, onReturnToAttract, scheduleInactivityReturn]);

  // Attract screen: any pointer movement or click wakes the interactive demo.
  useEffect(() => {
    if (!isAttract) return;

    const wake = () => wakeInteractive();

    window.addEventListener("mousemove", wake);
    window.addEventListener("mousedown", wake);
    window.addEventListener("touchstart", wake, { passive: true });

    return () => {
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("mousedown", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, [isAttract, wakeInteractive]);

  // Interactive mode: reset the 1-minute idle timer on activity.
  useEffect(() => {
    if (isAttract) return;

    const onActivity = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") return;
      registerActivity();
    };

    window.addEventListener("mousemove", onActivity);
    window.addEventListener("mousedown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });

    scheduleInactivityReturn();

    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("scroll", onActivity);
      clearInactivityTimer();
    };
  }, [isAttract, registerActivity, scheduleInactivityReturn, clearInactivityTimer]);

  // Esc toggles demo mode for booth staff.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      toggleDemoMode();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleDemoMode]);

  useEffect(() => () => clearInactivityTimer(), [clearInactivityTimer]);

  return { isAttract, wakeInteractive, registerActivity };
}
