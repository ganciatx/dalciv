import { useCallback, useEffect, useRef } from "react";

/**
 * Keeps the booth demo in native monitor fullscreen via the Fullscreen API.
 * Browsers require a user gesture to enter — we retry on every pointer event
 * and after the OS exits fullscreen (e.g. Esc).
 */
export function useKioskFullscreen() {
  const wantsFullscreenRef = useRef(true);

  const enterFullscreen = useCallback(async () => {
    if (!wantsFullscreenRef.current) return;
    if (document.fullscreenElement) return;

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Blocked until the visitor clicks or moves the mouse.
    }
  }, []);

  const armReenterOnGesture = useCallback(() => {
    if (!wantsFullscreenRef.current || document.fullscreenElement) return;

    const reenter = () => {
      void enterFullscreen();
    };

    window.addEventListener("pointerdown", reenter, { once: true });
    window.addEventListener("mousemove", reenter, { once: true });
    window.addEventListener("touchstart", reenter, { once: true, passive: true });
  }, [enterFullscreen]);

  useEffect(() => {
    void enterFullscreen();

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && wantsFullscreenRef.current) {
        armReenterOnGesture();
      }
    };

    const onPointer = () => {
      void enterFullscreen();
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("mousemove", onPointer);
    window.addEventListener("touchstart", onPointer, { passive: true });

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("mousemove", onPointer);
      window.removeEventListener("touchstart", onPointer);
    };
  }, [armReenterOnGesture, enterFullscreen]);

  // Shift+Esc lets booth staff leave fullscreen without fighting auto-reenter.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !event.shiftKey) return;
      wantsFullscreenRef.current = false;
      if (document.fullscreenElement) {
        void document.exitFullscreen?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { ensureFullscreen: enterFullscreen };
}
