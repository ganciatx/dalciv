import type { DelayedEvent, GameState, PlayerDecisions } from "./types";

let eventCounter = 0;

export function nextEventId(prefix: string): string {
  eventCounter += 1;
  return `${prefix}-${eventCounter}`;
}

/** Reset counter for deterministic tests. */
export function resetEventCounter(seed = 0): void {
  eventCounter = seed;
}

export function scheduleEvent(
  queue: DelayedEvent[],
  event: Omit<DelayedEvent, "id"> & { id?: string },
): DelayedEvent[] {
  const entry: DelayedEvent = {
    id: event.id ?? nextEventId(event.category),
    ...event,
  };
  if (queue.some((e) => e.id === entry.id)) return queue;
  return [...queue, entry].sort((a, b) => a.triggerYear - b.triggerYear);
}

/** Compare maintenance spend vs hold-steady need; queue delayed failures. */
export function queueMaintenanceConsequences(
  state: GameState,
  decisions: PlayerDecisions,
): DelayedEvent[] {
  let queue = [...state.eventQueue];
  const spend = decisions.expenditures.infrastructureMaintenance;
  const required = state.systems.infrastructure.assets.reduce(
    (sum, a) => sum + a.maintenanceToHold,
    0,
  );
  const gap = required - spend;

  if (gap > 8) {
    const lag = 8 + Math.floor(gap / 15);
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + lag,
      category: "infrastructure",
      description: `Road network crosses failure threshold — emergency repair (~$${18 + Math.round(gap / 4)}M)`,
      fiscalImpact: 18 + Math.round(gap / 4),
      canBeMitigated: true,
      mitigationCondition: "Restore maintenance to hold-steady levels for 3 years",
      sourceDecision: "Cut infrastructure maintenance",
    });
  }

  if (gap > 20) {
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 10,
      category: "infrastructure",
      description: "Water main failures cascade — boil-water advisories and lawsuits",
      fiscalImpact: 28,
      canBeMitigated: false,
      sourceDecision: "Severe maintenance deferral",
    });
  }

  return queue;
}

export function queueTaxRateConsequences(
  state: GameState,
  decisions: PlayerDecisions,
): DelayedEvent[] {
  let queue = [...state.eventQueue];
  const delta =
    decisions.propertyTaxRate - state.budget.propertyTaxRate;

  if (delta > 0.0008) {
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 4,
      category: "economic",
      description:
        "Commercial development slows — property tax hike dampens investment",
      fiscalImpact: -35,
      canBeMitigated: false,
      sourceDecision: "Raise property tax rate",
    });
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 3,
      category: "political",
      description: "Homeowner coalition mobilizes against tax increases",
      fiscalImpact: 0,
      canBeMitigated: true,
      mitigationCondition: "Freeze property tax rate for 2 years",
      sourceDecision: "Raise property tax rate",
    });
  }

  if (delta < -0.0005) {
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 5,
      category: "housing",
      description: "New apartment deliveries ease rent pressure",
      fiscalImpact: -8,
      canBeMitigated: false,
      sourceDecision: "Lower property tax rate",
    });
  }

  return queue;
}

export function queuePensionConsequences(
  state: GameState,
  decisions: PlayerDecisions,
): DelayedEvent[] {
  let queue = [...state.eventQueue];
  const arc = state.systems.pension.annualRequiredContribution;
  const paid = decisions.expenditures.pensionContribution;
  const shortfall = arc - paid;

  if (shortfall > 12) {
    const lag = 10 + Math.min(8, Math.floor(shortfall / 10));
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + lag,
      category: "pension",
      description: `ARC spikes to $${Math.round(arc + shortfall * 1.4)}M/yr as unfunded liability compounds`,
      fiscalImpact: Math.round(shortfall * 1.2),
      canBeMitigated: true,
      mitigationCondition: "Pay full ARC for 5 consecutive years",
      sourceDecision: "Defer pension contributions",
    });
  }

  return queue;
}

export function queueSafetyConsequences(
  state: GameState,
  decisions: PlayerDecisions,
): DelayedEvent[] {
  let queue = [...state.eventQueue];
  const cut =
    state.expenditures.publicSafety - decisions.expenditures.publicSafety;

  if (cut > 25) {
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 3,
      category: "safety",
      description: "Crime rate climbs — slower response times in outer districts",
      fiscalImpact: -22,
      canBeMitigated: true,
      mitigationCondition: "Restore public safety staffing budget",
      sourceDecision: "Cut public safety spending",
    });
  }

  if (
    decisions.expenditures.publicSafety >
    state.expenditures.publicSafety + 30
  ) {
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 2,
      category: "safety",
      description: "Crime falls — property values and sales tax begin to rise",
      fiscalImpact: -18,
      canBeMitigated: false,
      sourceDecision: "Expand public safety spending",
    });
  }

  return queue;
}

export function queueZoningConsequences(
  state: GameState,
  decisions: PlayerDecisions,
): DelayedEvent[] {
  let queue = [...state.eventQueue];
  if (
    decisions.zoningReform === "aggressive" &&
    state.systems.housing.zoningReform !== "aggressive"
  ) {
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 6,
      category: "housing",
      description: "Upzoning delivers 8,200 units — affordability improves",
      fiscalImpact: -12,
      canBeMitigated: false,
      sourceDecision: "Aggressive zoning reform",
    });
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 1,
      category: "political",
      description: "Neighborhood groups protest density — short-term approval hit",
      fiscalImpact: 0,
      canBeMitigated: false,
      sourceDecision: "Aggressive zoning reform",
    });
  }
  return queue;
}

export function queueHousingPolicyConsequences(
  state: GameState,
  decisions: PlayerDecisions,
): DelayedEvent[] {
  let queue = [...state.eventQueue];
  const policy = decisions.housingPolicy;
  if (policy === state.systems.housing.activePolicy) return queue;

  if (policy === "rentControl") {
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 1,
      category: "housing",
      description: "Rent control provides immediate relief — landlords pull units from market",
      fiscalImpact: 0,
      canBeMitigated: false,
      sourceDecision: "Rent control",
    });
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 7,
      category: "housing",
      description: "Housing supply stagnates — affordability worsens long-term",
      fiscalImpact: 15,
      canBeMitigated: false,
      sourceDecision: "Rent control (long-term)",
    });
  }

  if (policy === "inclusionary") {
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 5,
      category: "housing",
      description: "Inclusionary units delivered — moderate affordability gain",
      fiscalImpact: -6,
      canBeMitigated: false,
      sourceDecision: "Inclusionary zoning",
    });
  }

  if (policy === "subsidy") {
    queue = scheduleEvent(queue, {
      createdYear: state.year,
      triggerYear: state.year + 2,
      category: "housing",
      description: "Subsidy program stabilizes vulnerable households",
      fiscalImpact: 14,
      canBeMitigated: false,
      sourceDecision: "Direct housing subsidy",
    });
  }

  return queue;
}
