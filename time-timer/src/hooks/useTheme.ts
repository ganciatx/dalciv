import { useCallback, useState } from "react";
import {
  DEFAULT_THEME_ID,
  getTheme,
  TIMER_THEMES,
  type TimerTheme,
} from "../themes";

const STORAGE_KEY = "time-timer-theme-v1";
const VALID_IDS = new Set(TIMER_THEMES.map((t) => t.id));

function readStoredThemeId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id && VALID_IDS.has(id)) return id;
  } catch {
    /* private mode / blocked storage */
  }
  return DEFAULT_THEME_ID;
}

export function useTheme() {
  const [themeId, setThemeId] = useState(readStoredThemeId);
  const theme = getTheme(themeId);

  const selectTheme = useCallback((id: string) => {
    setThemeId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  return { theme, themeId, selectTheme } satisfies {
    theme: TimerTheme;
    themeId: string;
    selectTheme: (id: string) => void;
  };
}
