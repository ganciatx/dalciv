import { create } from "zustand";
import {
  createInitialRunStats,
  loadGlobalAchievements,
  saveGlobalAchievements,
} from "../simulation/achievements";
import { createInitialCapitalState } from "../simulation/capitalProjects";
import { createDefaultDistricts } from "../simulation/districts";
import { createInitialEconomicDevelopment } from "../simulation/economicDevelopment";
import { createInitialEducation } from "../simulation/education";
import { createInitialStaff } from "../simulation/staff";
import {
  createScenarioState,
  defaultDecisions,
  SCENARIOS,
} from "../simulation/scenarios";
import { simulateTurn } from "../simulation/simulate";
import {
  buildYearSummary,
  captureYearSnapshot,
  type YearSummary,
} from "../simulation/yearSummary";
import type {
  ChallengeId,
  Difficulty,
  GameState,
  PlayerDecisions,
  ScenarioId,
} from "../simulation/types";

const STORAGE_KEY = "city-budget-simulator-save-v4";

export type GameView =
  | "dashboard"
  | "budget"
  | "development"
  | "districts"
  | "timeline"
  | "history"
  | "politics"
  | "staff";

function migrateGame(game: GameState): GameState {
  if (!game.settings) {
    game.settings = {
      difficulty: "standard",
      policyExplainer: false,
      challengeId: "none",
    };
  }
  if (!game.settings.challengeId) game.settings.challengeId = "none";
  if (!game.newspapers) game.newspapers = [];
  if (!game.pensionReforms) {
    game.pensionReforms = {
      colaFreeze: false,
      closedDbNewHires: false,
      raisedEmployeeShare: false,
    };
  }
  if (!game.districts?.length) {
    game.districts = createDefaultDistricts(game.city.scenarioId);
  }
  if (!game.factionQuotes) game.factionQuotes = [];
  if (!game.prevApprovals) {
    game.prevApprovals = { ...game.politics.approvals };
  }
  if (!game.runStats) game.runStats = createInitialRunStats();
  if (!game.systems.education) {
    game.systems.education = createInitialEducation(game.city.scenarioId);
  }
  if (!game.economicDevelopment) {
    game.economicDevelopment = createInitialEconomicDevelopment();
  }
  if (!game.capital) game.capital = createInitialCapitalState();
  const exp = game.expenditures;
  if (exp.education === undefined) exp.education = 150;
  if (exp.economicDevelopment === undefined) exp.economicDevelopment = 28;
  if (exp.capitalProjects === undefined) exp.capitalProjects = 0;
  if (!game.staff) game.staff = createInitialStaff();
  return game;
}

interface GameStore {
  game: GameState;
  draft: PlayerDecisions;
  view: GameView;
  showLandingPage: boolean;
  hasSavedGame: boolean;
  showScenarioPicker: boolean;
  unlockedAchievements: Set<string>;
  lastUnlockedAchievements: string[];
  yearSummary: YearSummary | null;
  dismissYearSummary: () => void;
  initNewGame: (
    scenarioId?: ScenarioId,
    difficulty?: Difficulty,
    challengeId?: ChallengeId,
  ) => void;
  loadSaved: () => boolean;
  continueSavedGame: () => void;
  startNewGameFlow: () => void;
  openLandingPage: () => void;
  saveGame: () => void;
  setView: (view: GameView) => void;
  setShowScenarioPicker: (show: boolean) => void;
  togglePolicyExplainer: () => void;
  patchDraft: (patch: Partial<PlayerDecisions>) => void;
  patchDraftExpenditure: (
    key: keyof PlayerDecisions["expenditures"],
    value: number,
  ) => void;
  advanceYear: () => void;
  resetGame: () => void;
}

function fresh(
  scenarioId: ScenarioId = "sun-belt-boom",
  difficulty: Difficulty = "standard",
  challengeId: ChallengeId = "none",
): { game: GameState; draft: PlayerDecisions } {
  const game = createScenarioState(scenarioId, difficulty, challengeId);
  return { game, draft: defaultDecisions(game) };
}

export const useGameStore = create<GameStore>((set, get) => {
  const initial = fresh();
  return {
    game: initial.game,
    draft: initial.draft,
    view: "dashboard",
    showLandingPage: true,
    hasSavedGame: false,
    showScenarioPicker: false,
    unlockedAchievements: loadGlobalAchievements(),
    lastUnlockedAchievements: [],
    yearSummary: null,

    dismissYearSummary: () => set({ yearSummary: null }),

    initNewGame: (
      scenarioId = "sun-belt-boom",
      difficulty = "standard",
      challengeId = "none",
    ) => {
      const { game, draft } = fresh(scenarioId, difficulty, challengeId);
      set({
        game,
        draft,
        view: "dashboard",
        showLandingPage: false,
        hasSavedGame: true,
        showScenarioPicker: false,
        lastUnlockedAchievements: [],
        yearSummary: null,
      });
      get().saveGame();
    },

    loadSaved: () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as {
          game: GameState;
          draft: PlayerDecisions;
        };
        parsed.game = migrateGame(parsed.game);
        if (!parsed.draft.districtPriority) {
          parsed.draft.districtPriority = "balanced";
        }
        if (!parsed.draft.campaignStrategy) {
          parsed.draft.campaignStrategy = "balanced";
        }
        set({
          game: parsed.game,
          draft: parsed.draft,
          hasSavedGame: true,
          unlockedAchievements: loadGlobalAchievements(),
        });
        return true;
      } catch {
        return false;
      }
    },

    continueSavedGame: () =>
      set({
        showLandingPage: false,
        showScenarioPicker: false,
        view: "dashboard",
      }),

    startNewGameFlow: () =>
      set({
        showLandingPage: false,
        showScenarioPicker: true,
      }),

    openLandingPage: () =>
      set({
        showLandingPage: true,
        showScenarioPicker: false,
      }),

    saveGame: () => {
      const { game, draft } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ game, draft }));
    },

    setView: (view) => set({ view }),

    setShowScenarioPicker: (show) => set({ showScenarioPicker: show }),

    togglePolicyExplainer: () =>
      set((s) => ({
        game: {
          ...s.game,
          settings: {
            ...s.game.settings,
            policyExplainer: !s.game.settings.policyExplainer,
          },
        },
      })),

    patchDraft: (patch) =>
      set((s) => ({ draft: { ...s.draft, ...patch } })),

    patchDraftExpenditure: (key, value) =>
      set((s) => ({
        draft: {
          ...s.draft,
          expenditures: { ...s.draft.expenditures, [key]: value },
        },
      })),

    advanceYear: () => {
      const { game, draft, unlockedAchievements } = get();
      if (game.phase === "ended") return;
      const snapshot = captureYearSnapshot(game);
      const result = simulateTurn(game, draft, unlockedAchievements);
      const merged = new Set(unlockedAchievements);
      const newlyUnlocked = result.newlyUnlockedAchievements ?? [];
      for (const id of newlyUnlocked) {
        merged.add(id);
      }
      if (newlyUnlocked.length) {
        saveGlobalAchievements(merged);
      }
      const yearSummary = buildYearSummary(
        snapshot,
        result.state,
        result,
        newlyUnlocked,
      );
      set({
        game: result.state,
        draft: defaultDecisions(result.state),
        unlockedAchievements: merged,
        lastUnlockedAchievements: newlyUnlocked,
        yearSummary,
      });
      get().saveGame();
    },

    resetGame: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({
        hasSavedGame: false,
        showLandingPage: false,
        showScenarioPicker: true,
        view: "dashboard",
        lastUnlockedAchievements: [],
        yearSummary: null,
      });
    },
  };
});

export { SCENARIOS };
