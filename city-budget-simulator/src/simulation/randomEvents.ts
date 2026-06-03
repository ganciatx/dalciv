import { scheduleEvent } from "./events";
import type { DelayedEvent, GameState } from "./types";

/** Deterministic 0..1 from seed (LCG). */
export function seededRandom(seed: number): { value: number; nextSeed: number } {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { value: next / 0xffffffff, nextSeed: next };
}

function preparedness(state: GameState): number {
  const infra =
    state.systems.infrastructure.assets.reduce((s, a) => s + a.condition, 0) /
    Math.max(1, state.systems.infrastructure.assets.length);
  const rainy = state.budget.rainyDayFund / 80;
  const fund = Math.min(1, Math.max(0, state.budget.fundBalance / 100));
  return Math.min(1, (infra / 100) * 0.4 + rainy * 0.35 + fund * 0.25);
}

export interface RandomEventResult {
  state: GameState;
  queue: DelayedEvent[];
  label?: string;
  alert?: string;
}

/**
 * Roll at most one random shock per year. Severity scales inversely with
 * preparedness (rainy day fund, infrastructure, fund balance).
 */
export function applyRandomEvent(state: GameState): RandomEventResult {
  const prep = preparedness(state);
  const roll = seededRandom(state.randomSeed);
  state.randomSeed = roll.nextSeed;

  const badChance = 0.14 - prep * 0.08;
  const goodChance = 0.06 + prep * 0.02;

  let queue = [...state.eventQueue];
  let label: string | undefined;
  let alert: string | undefined;

  if (roll.value < badChance) {
    const pick = seededRandom(state.randomSeed);
    state.randomSeed = pick.nextSeed;
    const severity = 1.1 - prep * 0.5;

    if (pick.value < 0.28) {
      state.economicMultiplier = Math.max(0.82, 1 - 0.12 * severity);
      label = "Recession";
      alert =
        "Regional recession — sales tax and permit activity soften for several years.";
      queue = scheduleEvent(queue, {
        createdYear: state.year,
        triggerYear: state.year + 3,
        category: "economic",
        description: "Recovery begins — consumer spending normalizes",
        fiscalImpact: -8,
        canBeMitigated: false,
        sourceDecision: "Economic recession (random)",
      });
    } else if (pick.value < 0.52) {
      const cost = Math.round(18 + 22 * severity);
      for (const asset of state.systems.infrastructure.assets) {
        asset.condition = Math.max(15, asset.condition - 12 * severity);
      }
      state.budget.fundBalance -= cost;
      label = "Natural disaster";
      alert = `Storm damage across the city — emergency costs $${cost}M.`;
    } else if (pick.value < 0.76) {
      const cut = Math.round(18 + 14 * severity);
      state.budget.transfers = Math.max(
        state.budget.baseTransfers * 0.55,
        state.budget.transfers - cut,
      );
      label = "State budget crisis";
      alert = `State legislature cuts intergovernmental transfers by $${cut}M/yr.`;
    } else {
      state.budget.debtServiceSpike += 0.006 * severity;
      label = "Interest rate spike";
      alert = "Federal rate hike raises borrowing costs on new and rolled debt.";
      queue = scheduleEvent(queue, {
        createdYear: state.year,
        triggerYear: state.year + 4,
        category: "economic",
        description: "Debt service spike eases as rates normalize",
        fiscalImpact: 0,
        canBeMitigated: false,
        sourceDecision: "Interest rate spike (random)",
      });
    }
  } else if (roll.value > 1 - goodChance) {
    state.taxBase.populationTrend = Math.min(
      0.045,
      state.taxBase.populationTrend + 0.012,
    );
    state.taxBase.permitsIssued = Math.round(state.taxBase.permitsIssued * 1.14);
    label = "Population boom";
    alert =
      "Major employer expansion — construction permits and sales tax tick up.";
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 5,
      category: "economic",
      description: "Boom strains roads and fire response — service demand rises",
      fiscalImpact: 12,
      canBeMitigated: true,
      mitigationCondition: "Increase infrastructure and public safety spending",
      sourceDecision: "Population boom (random)",
    });
  }

  return { state, queue, label, alert };
}
