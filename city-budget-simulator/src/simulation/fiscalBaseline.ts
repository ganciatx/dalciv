import { educationHoldSteadySpend } from "./education";
import { projectTurnBalance } from "./simulate";
import type {
  Difficulty,
  ExpenditureBudget,
  GameState,
  PlayerDecisions,
  ScenarioId,
} from "./types";

const EXPENDITURE_FLOORS: Partial<Record<keyof ExpenditureBudget, number>> = {
  publicSafety: 140,
  infrastructureMaintenance: 20,
  pensionContribution: 0,
  parksLibraries: 12,
  administration: 50,
  education: 55,
  economicDevelopment: 6,
  capitalProjects: 0,
};

function sumOperatingExpenditures(exp: ExpenditureBudget): number {
  return (
    exp.publicSafety +
    exp.infrastructureMaintenance +
    exp.pensionContribution +
    exp.parksLibraries +
    exp.administration +
    (exp.education ?? 0) +
    (exp.economicDevelopment ?? 0) +
    (exp.capitalProjects ?? 0)
  );
}

function draftAtDefaults(state: GameState): PlayerDecisions {
  return {
    expenditures: { ...state.expenditures },
    propertyTaxRate: state.budget.propertyTaxRate,
    salesTaxRate: state.budget.salesTaxRate,
    bondsToIssue: 0,
    pensionAssumedReturn: state.systems.pension.assumedReturn,
    zoningReform: state.systems.housing.zoningReform,
    housingPolicy: state.systems.housing.activePolicy,
    pensionReform: "none",
    districtPriority: "balanced",
    recruitmentFocus: "none",
    newCapitalProjectId: "none",
    campaignStrategy: "balanced",
  };
}

function targetSurplusFor(
  scenarioId: ScenarioId,
  difficulty: Difficulty,
): number {
  if (scenarioId === "greenfield") return difficulty === "hard" ? 0 : 8;
  if (scenarioId === "fiscal-precipice") {
    return difficulty === "sandbox" ? -22 : difficulty === "hard" ? -48 : -38;
  }
  if (scenarioId === "rust-belt-reckoning") {
    return difficulty === "sandbox" ? -8 : difficulty === "hard" ? -38 : -25;
  }
  if (scenarioId === "coastal-squeeze") {
    return difficulty === "sandbox" ? -5 : difficulty === "hard" ? -32 : -18;
  }
  // sun-belt-boom
  return difficulty === "sandbox" ? -5 : difficulty === "hard" ? -32 : -12;
}

function scaleExpendituresFrom(
  state: GameState,
  base: ExpenditureBudget,
  ratio: number,
): void {
  const arc = state.systems.pension.annualRequiredContribution;
  const pensionFloor = Math.round(arc * 0.88);

  for (const key of Object.keys(base) as (keyof ExpenditureBudget)[]) {
    const floor =
      key === "pensionContribution"
        ? pensionFloor
        : (EXPENDITURE_FLOORS[key] ?? 0);
    state.expenditures[key] = Math.max(
      floor,
      Math.round(base[key] * ratio),
    );
  }
}

/**
 * Scale starting appropriations so default tax/spend is survivable (small gap, not ~$180M).
 * Legacy line items were set above what the revenue model funds.
 */
export function alignStartingBudget(
  state: GameState,
  scenarioId: ScenarioId,
  difficulty: Difficulty,
): void {
  const target = targetSurplusFor(scenarioId, difficulty);
  const baseExp = { ...state.expenditures };
  let projected = projectTurnBalance(state, draftAtDefaults(state));
  if (projected.surplus >= target - 6 && projected.surplus <= target + 18) {
    return;
  }

  let lo = 0.62;
  let hi = 1;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    scaleExpendituresFrom(state, baseExp, mid);
    projected = projectTurnBalance(state, draftAtDefaults(state));
    if (projected.surplus > target) lo = mid;
    else hi = mid;
  }
  scaleExpendituresFrom(state, baseExp, hi);
  projected = projectTurnBalance(state, draftAtDefaults(state));

  const eduFloor = Math.max(
    EXPENDITURE_FLOORS.education ?? 55,
    educationHoldSteadySpend(state.systems.education.enrollment) - 12,
  );
  if ((state.expenditures.education ?? 0) < eduFloor) {
    state.expenditures.education = eduFloor;
    projected = projectTurnBalance(state, draftAtDefaults(state));
  }

  if (projected.surplus > target + 10) {
    const trim = Math.max(
      0.9,
      1 - (projected.surplus - target) / Math.max(400, sumOperatingExpenditures(state.expenditures)),
    );
    for (const key of Object.keys(state.expenditures) as (keyof ExpenditureBudget)[]) {
      if (key === "education") continue;
      const floor = EXPENDITURE_FLOORS[key] ?? 0;
      state.expenditures[key] = Math.max(
        floor,
        Math.round(state.expenditures[key] * trim),
      );
    }
    projected = projectTurnBalance(state, draftAtDefaults(state));
  }

  if (projected.surplus < target - 12) {
    const aid = Math.round((target - projected.surplus) * 0.55);
    state.budget.transfers += aid;
    state.budget.baseTransfers = state.budget.transfers;
  }

  if (projectTurnBalance(state, draftAtDefaults(state)).surplus < target - 20) {
    state.budget.fundBalance += Math.round(
      Math.min(35, (target - projected.surplus) * 0.35),
    );
  }
}

/** @internal test helper */
export function operatingExpenditureTotal(exp: ExpenditureBudget): number {
  return sumOperatingExpenditures(exp);
}
