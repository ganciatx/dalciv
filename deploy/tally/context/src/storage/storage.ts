import type { GameSession, HistoryEntry, Player } from '../types';
import { playerColor } from '../utils/colors';

const ACTIVE_SESSION_KEY = 'tally_active_session';
const HISTORY_KEY = 'tally_history';

/** Persistence boundary — swap localStorage for a backend without touching UI. */
export interface StorageAdapter {
  getActiveSession(): GameSession | null;
  saveActiveSession(session: GameSession | null): void;
  getHistory(): HistoryEntry[];
  appendHistory(entry: HistoryEntry): void;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const localStorageAdapter: StorageAdapter = {
  getActiveSession() {
    return readJson<GameSession | null>(ACTIVE_SESSION_KEY, null);
  },

  saveActiveSession(session) {
    if (session === null) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      writeJson(ACTIVE_SESSION_KEY, session);
    }
  },

  getHistory() {
    return readJson<HistoryEntry[]>(HISTORY_KEY, []);
  },

  appendHistory(entry) {
    const history = this.getHistory();
    writeJson(HISTORY_KEY, [entry, ...history]);
  },
};

/** Initialize a new player with game-appropriate default fields. */
export function createPlayer(name: string, index: number): Player {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    color: playerColor(index),
    categoryScores: {},
    yahtzeeBonusCount: 0,
    currentPhase: 1,
    roundScores: [],
    phaseCompletedPerRound: [],
    runningTotal: 0,
  };
}
