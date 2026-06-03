import type {
  ChallengeId,
  EndReason,
  GameState,
  PlayerDecisions,
  ScenarioId,
} from "./types";
import { totalMaintenanceNeed } from "./districts";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
}

export interface ChallengeDef {
  id: ChallengeId;
  title: string;
  description: string;
  ruleHint: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "bond_free_decade",
    title: "Bond-Free Decade",
    description: "Complete a term without issuing bonds for 10 consecutive years.",
  },
  {
    id: "precipice_survivor",
    title: "Fiscal Tightrope",
    description: "Finish Fiscal Precipice without state takeover or fiscal collapse.",
  },
  {
    id: "rent_relief_coastal",
    title: "Rent Relief",
    description: "Complete Coastal Squeeze with rent control active at term end.",
  },
  {
    id: "aaa_finisher",
    title: "AAA Steward",
    description: "End a completed term with AAA credit rating.",
  },
  {
    id: "smooth_roads",
    title: "Pavement Prophet",
    description: "End with citywide district roads averaging 75+.",
  },
  {
    id: "pension_saint",
    title: "Pension Saint",
    description: "Pay full ARC five years in a row.",
  },
  {
    id: "coalition_master",
    title: "Coalition Master",
    description: "Win an election with every faction above 50% approval.",
  },
  {
    id: "greenfield_guru",
    title: "Greenfield Guru",
    description: "Complete Greenfield scenario with overall score A or higher.",
  },
];

export const CHALLENGES: ChallengeDef[] = [
  {
    id: "none",
    title: "Standard rules",
    description: "Normal bond limits and election thresholds.",
    ruleHint: "No modifiers.",
  },
  {
    id: "no_bonds",
    title: "No New Debt",
    description: "Bond markets are closed — balance the budget without issuance.",
    ruleHint: "Bond slider locked at $0.",
  },
  {
    id: "austerity",
    title: "Austerity Mandate",
    description: "Voters demand lean government — maintenance capped lower.",
    ruleHint: "Infrastructure maintenance max −25%.",
  },
  {
    id: "coalition_builder",
    title: "Coalition Builder",
    description: "Lower win threshold, but no faction can fall below 38%.",
    ruleHint: "Win at 45% coalition; lose if any faction < 38%.",
  },
];

export function createInitialRunStats(): GameState["runStats"] {
  return {
    yearsWithoutBonds: 0,
    totalBondsIssued: 0,
    consecutiveFullArcYears: 0,
    maintenanceBelowHoldYears: 0,
    lowestDistrictRoads: 100,
    hadRentControlWin: false,
  };
}

export function applyChallengeToState(state: GameState): void {
  state.settings.challengeId = state.settings.challengeId ?? "none";
  if (state.settings.challengeId === "coalition_builder") {
    state.politics.factionWeights.renters *= 1.15;
    state.politics.factionWeights.fiscalHawks *= 0.9;
  }
}

export function updateRunStats(
  state: GameState,
  decisions: PlayerDecisions,
): void {
  const stats = state.runStats;
  const arc = state.systems.pension.annualRequiredContribution;

  if (decisions.bondsToIssue > 0) {
    stats.totalBondsIssued += decisions.bondsToIssue;
    stats.yearsWithoutBonds = 0;
  } else {
    stats.yearsWithoutBonds += 1;
  }

  if (decisions.expenditures.pensionContribution >= arc - 1) {
    stats.consecutiveFullArcYears += 1;
  } else {
    stats.consecutiveFullArcYears = 0;
  }

  if (state.systems.housing.activePolicy === "rentControl") {
    stats.hadRentControlWin = true;
  }
}

export function checkAchievements(
  state: GameState,
  alreadyUnlocked: Set<string>,
): string[] {
  const unlocked: string[] = [];
  const end = state.phase === "ended";
  const completed = state.endReason === "completed";
  const badEnd =
    state.endReason === "state_takeover" ||
    state.endReason === "fiscal_crisis" ||
    state.endReason === "liquidity_trap";

  const tryUnlock = (id: string, condition: boolean) => {
    if (condition && !alreadyUnlocked.has(id) && !unlocked.includes(id)) {
      unlocked.push(id);
    }
  };

  tryUnlock(
    "bond_free_decade",
    end && completed && state.runStats.yearsWithoutBonds >= 10,
  );

  tryUnlock(
    "precipice_survivor",
    end &&
      completed &&
      state.city.scenarioId === "fiscal-precipice",
  );

  tryUnlock(
    "rent_relief_coastal",
    end &&
      completed &&
      state.city.scenarioId === "coastal-squeeze" &&
      state.runStats.hadRentControlWin,
  );

  tryUnlock(
    "aaa_finisher",
    end && completed && state.budget.creditRating === "AAA",
  );

  const avgRoad =
    state.districts.reduce((s, d) => s + d.roadCondition, 0) /
    Math.max(1, state.districts.length);
  tryUnlock("smooth_roads", end && completed && avgRoad >= 75);

  tryUnlock(
    "pension_saint",
    state.runStats.consecutiveFullArcYears >= 5,
  );

  if (end && completed) {
    const allAbove50 = (
      Object.values(state.politics.approvals) as number[]
    ).every((a) => a >= 50);
    tryUnlock("coalition_master", allAbove50);
  }

  if (end && completed && state.city.scenarioId === "greenfield") {
    const last = state.history[state.history.length - 1];
    if (last && last.fundBalance > 80 && avgRoad >= 70) {
      tryUnlock("greenfield_guru", true);
    }
  }

  void badEnd;
  return unlocked;
}

/** Challenge-specific election loss check. */
export function checkCoalitionBuilderLoss(state: GameState): boolean {
  if (state.settings.challengeId !== "coalition_builder") return false;
  return (Object.values(state.politics.approvals) as number[]).some(
    (a) => a < 38,
  );
}

export function electionThreshold(state: GameState): number {
  if (state.settings.challengeId === "coalition_builder") return 45;
  if (state.settings.difficulty === "hard") return 52;
  return 48;
}

export function loadGlobalAchievements(): Set<string> {
  try {
    const raw = localStorage.getItem("city-budget-simulator-achievements-v1");
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveGlobalAchievements(ids: Set<string>): void {
  localStorage.setItem(
    "city-budget-simulator-achievements-v1",
    JSON.stringify([...ids]),
  );
}

export function maintenanceSliderMax(
  state: GameState,
  baseMax: number,
): number {
  if (state.settings.challengeId === "austerity") {
    return Math.round(baseMax * 0.75);
  }
  return baseMax;
}
