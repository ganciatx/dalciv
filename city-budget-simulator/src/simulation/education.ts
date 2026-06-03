import { scheduleEvent } from "./events";
import type { GameState, PlayerDecisions } from "./types";

/** Millions of annual K–12 spend per 10k enrolled students at hold-steady quality. */
export const HOLD_STEADY_M_PER_10K = 11.2;

/** Annual education spend (millions) needed to hold quality steady at baseline per-pupil rate. */
export function educationHoldSteadySpend(
  enrollment: number,
  millionsPer10k = HOLD_STEADY_M_PER_10K,
): number {
  return Math.round((enrollment / 10_000) * millionsPer10k);
}

export function updateEducation(state: GameState, decisions: PlayerDecisions): void {
  const edu = state.systems.education;
  const spend = decisions.expenditures.education;
  const enrollment = edu.enrollment;
  const holdSteady = educationHoldSteadySpend(enrollment);
  const gap = holdSteady - spend;

  edu.perPupilSpending = spend / Math.max(1, enrollment / 10_000);

  if (gap > 15) {
    edu.qualityIndex = Math.max(35, edu.qualityIndex - gap * 0.12);
    edu.graduationRate = Math.max(0.65, edu.graduationRate - 0.008);
    edu.teacherRetention = Math.max(0.6, edu.teacherRetention - 0.015);
    if (gap > 35 && !state.eventQueue.some((e) => e.description.includes("teacher shortage"))) {
      state.eventQueue = scheduleEvent(state.eventQueue, {
        createdYear: state.year,
        triggerYear: state.year + 3,
        category: "education",
        description: "Teacher shortage — families eyeing suburban districts",
        fiscalImpact: -14,
        canBeMitigated: true,
        mitigationCondition: "Restore education funding to hold-steady levels",
        sourceDecision: "Underfund schools",
      });
    }
  } else {
    const repair = Math.min(5, (-gap / holdSteady) * 8);
    edu.qualityIndex = Math.min(100, edu.qualityIndex + repair);
    edu.graduationRate = Math.min(0.96, edu.graduationRate + 0.004);
    edu.teacherRetention = Math.min(0.95, edu.teacherRetention + 0.006);
  }

  if (edu.qualityIndex > 72) {
    state.taxBase.populationTrend = Math.min(
      0.045,
      state.taxBase.populationTrend + 0.002,
    );
    state.economicDevelopment.attractiveness = Math.min(
      100,
      state.economicDevelopment.attractiveness + 0.8,
    );
  }

  if (edu.qualityIndex < 50) {
    state.politics.approvals.homeowners = Math.max(
      10,
      state.politics.approvals.homeowners - 2,
    );
    state.politics.approvals.renters = Math.max(
      10,
      state.politics.approvals.renters - 1,
    );
  } else if (edu.qualityIndex > 68) {
    state.politics.approvals.homeowners = Math.min(
      95,
      state.politics.approvals.homeowners + 1,
    );
  }

  edu.capacityIndex = Math.min(
    100,
    edu.capacityIndex * 0.98 + edu.qualityIndex * 0.02,
  );
}

export function createInitialEducation(scenarioId: string): GameState["systems"]["education"] {
  const base = {
    qualityIndex: 68,
    capacityIndex: 70,
    perPupilSpending: 11.2,
    enrollment: 185_000,
    graduationRate: 0.86,
    teacherRetention: 0.82,
  };
  if (scenarioId === "rust-belt-reckoning") {
    base.qualityIndex = 58;
    base.graduationRate = 0.78;
    base.teacherRetention = 0.72;
  }
  if (scenarioId === "coastal-squeeze") {
    base.qualityIndex = 72;
    base.capacityIndex = 65;
  }
  if (scenarioId === "fiscal-precipice") {
    base.qualityIndex = 54;
    base.graduationRate = 0.74;
  }
  if (scenarioId === "greenfield") {
    base.qualityIndex = 78;
    base.capacityIndex = 85;
    base.graduationRate = 0.9;
  }
  return base;
}

export function educationGrowthBonus(state: GameState): number {
  const q = state.systems.education.qualityIndex;
  if (q > 75) return 0.006;
  if (q < 52) return -0.005;
  return 0;
}
