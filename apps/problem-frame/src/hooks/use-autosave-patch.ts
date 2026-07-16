"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Patch = {
  frameTitle?: string;
  problemStatement?: string | null;
  status?: string;
  personaId?: number;
};

type Status = "idle" | "saving" | "saved" | "error";

/**
 * Debounced auto-save (2s idle) plus immediate save on blur, per UX spec.
 */
export function useAutosavePatch(
  frameId: number,
  patchAction: (id: number, p: Patch) => Promise<void>,
  initial: Patch,
) {
  const [status, setStatus] = useState<Status>("idle");
  const draft = useRef<Patch>({ ...initial });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(JSON.stringify(initial));

  const flush = useCallback(async () => {
    const next = draft.current;
    const serialized = JSON.stringify(next);
    if (serialized === lastSaved.current) return;
    setStatus("saving");
    try {
      await patchAction(frameId, next);
      lastSaved.current = serialized;
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
    }
  }, [frameId, patchAction]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 2000);
  }, [flush]);

  const update = useCallback(
    (partial: Partial<Patch>) => {
      draft.current = { ...draft.current, ...partial };
      schedule();
    },
    [schedule],
  );

  const onBlurSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    void flush();
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { status, update, onBlurSave };
}
