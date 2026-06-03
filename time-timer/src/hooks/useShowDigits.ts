import { useCallback, useState } from "react";

const STORAGE_KEY = "time-timer-show-digits-v1";

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Center digital MM:SS; off by default (visual disk only). */
export function useShowDigits() {
  const [showDigits, setShowDigits] = useState(readStored);

  const toggleShowDigits = useCallback(() => {
    setShowDigits((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { showDigits, toggleShowDigits };
}
