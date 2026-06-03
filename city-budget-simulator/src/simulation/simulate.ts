import {
  clampBondIssuance,
  effectiveDebtServiceRate,
  maxBondIssuance,
} from "./credit";
import {
  checkAchievements,
  checkCoalitionBuilderLoss,
  electionThreshold,
  updateRunStats,
} from "./achievements";
import {
  generateFactionQuotes,
} from "./characters";
import { updateCapitalProjects } from "./capitalProjects";
import { updateDistricts } from "./districts";
import {
  employerTaxBonus,
  updateEconomicDevelopment,
} from "./economicDevelopment";
import { educationGrowthBonus, updateEducation } from "./education";
import { generateStaffAdvice, updateStaffAfterTurn } from "./staff";
import {
  queueHousingPolicyConsequences,
  queueMaintenanceConsequences,
  queuePensionConsequences,
  queueSafetyConsequences,
  queueTaxRateConsequences,
  queueZoningConsequences,
} from "./events";
import { applyRandomEvent } from "./randomEvents";
import type {
  CreditRating,
  DelayedEvent,
  FactionId,
  GameState,
  PlayerDecisions,
  TurnResult,
  YearRecord,
} from "./types";

const FACTIONS: FactionId[] = [
  "homeowners",
  "renters",
  "business",
  "employees",
  "fiscalHawks",
];

function avgInfrastructureCondition(state: GameState): number {
  const assets = state.systems.infrastructure.assets;
  if (!assets.length) return 0;
  return assets.reduce((s, a) => s + a.condition, 0) / assets.length;
}

function totalTaxBaseValue(state: GameState): number {
  return state.taxBase.zones.reduce((s, z) => s + z.assessedValue, 0);
}

function calculateRevenue(
  state: GameState,
  decisions: PlayerDecisions,
): number {
  const taxBase = totalTaxBaseValue(state);
  const propertyTax = taxBase * decisions.propertyTaxRate;
  const salesTax =
    state.budget.consumerSpending *
    1000 *
    decisions.salesTaxRate *
    state.economicMultiplier;
  const bond = clampBondIssuance(state, decisions.bondsToIssue);
  const employerBonus = employerTaxBonus(state) * taxBase;
  return (
    propertyTax +
    salesTax +
    state.budget.transfers +
    state.budget.fees +
    employerBonus +
    bond.allowed * 0.85
  );
}

function calculateExpenditures(
  state: GameState,
  decisions: PlayerDecisions,
): number {
  const debtService =
    state.budget.bondDebt * effectiveDebtServiceRate(state) * 0.01;
  const exp = decisions.expenditures;
  let total =
    exp.publicSafety +
    exp.infrastructureMaintenance +
    exp.pensionContribution +
    exp.parksLibraries +
    exp.administration +
    (exp.education ?? 0) +
    (exp.economicDevelopment ?? 0) +
    (exp.capitalProjects ?? 0) +
    debtService;

  if (decisions.housingPolicy === "subsidy") total += 22;
  return total;
}

function deriveCreditRating(state: GameState, revenue: number): CreditRating {
  const debtPct =
    revenue > 0
      ? (state.budget.bondDebt * effectiveDebtServiceRate(state) * 0.01) /
        revenue
      : 1;
  const pension = state.systems.pension.fundedRatio;
  const fund = state.budget.fundBalance;
  const deficits = state.budget.consecutiveDeficitYears;

  if (fund < -55 || pension < 0.4 || debtPct > 0.24 || deficits >= 5) {
    return "junk";
  }
  if (fund < -20 && deficits >= 3) return "junk";
  if (pension < 0.55 || debtPct > 0.18 || deficits >= 4) return "B";
  if (pension < 0.65 || debtPct > 0.15 || deficits >= 3) return "BBB";
  if (pension < 0.72 || debtPct > 0.12) return "A";
  if (pension < 0.78 || fund < 30) return "AA";
  return "AAA";
}

function applyPensionReform(state: GameState, decisions: PlayerDecisions): void {
  const choice = decisions.pensionReform;
  if (choice === "none") return;

  const pension = state.systems.pension;
  const politics = state.politics;

  if (choice === "colaFreeze" && !state.pensionReforms.colaFreeze) {
    state.pensionReforms.colaFreeze = true;
    pension.liabilities *= 0.92;
    pension.annualRequiredContribution = Math.round(
      pension.annualRequiredContribution * 0.88,
    );
    politics.approvals.employees -= 12;
    politics.approvals.fiscalHawks += 8;
    state.alerts.push("COLA freeze enacted — retirees protest at City Hall.");
  }

  if (choice === "closeDbNewHires" && !state.pensionReforms.closedDbNewHires) {
    state.pensionReforms.closedDbNewHires = true;
    pension.annualRequiredContribution = Math.round(
      pension.annualRequiredContribution * 0.82,
    );
    politics.approvals.employees -= 18;
    politics.approvals.fiscalHawks += 10;
    politics.approvals.business += 4;
    state.alerts.push("Defined-benefit plan closed to new hires — union opposition intense.");
  }

  if (choice === "raiseEmployeeShare" && !state.pensionReforms.raisedEmployeeShare) {
    state.pensionReforms.raisedEmployeeShare = true;
    pension.annualRequiredContribution = Math.round(
      pension.annualRequiredContribution * 0.94,
    );
    politics.approvals.employees -= 8;
    politics.approvals.fiscalHawks += 5;
    state.alerts.push("Employee pension contributions increased.");
  }

  pension.fundedRatio = Math.min(
    1,
    Math.max(0.2, pension.assets / pension.liabilities),
  );
}

function tickEventQueue(
  state: GameState,
  fired: DelayedEvent[],
): { queue: DelayedEvent[]; balanceDelta: number; alerts: string[] } {
  const alerts: string[] = [];
  let balanceDelta = 0;
  const remaining: DelayedEvent[] = [];

  for (const event of state.eventQueue) {
    if (event.triggerYear <= state.year + 1) {
      fired.push(event);
      balanceDelta += event.fiscalImpact;
      if (event.fiscalImpact > 0) {
        alerts.push(event.description);
      }
      if (event.description.includes("rates normalize")) {
        state.budget.debtServiceSpike = Math.max(
          0,
          state.budget.debtServiceSpike - 0.004,
        );
      }
      if (event.description.includes("consumer spending normalizes")) {
        state.economicMultiplier = Math.min(1, state.economicMultiplier + 0.06);
      }
    } else {
      remaining.push(event);
    }
  }

  return { queue: remaining, balanceDelta, alerts };
}

function updateInfrastructure(
  state: GameState,
  decisions: PlayerDecisions,
  fired: DelayedEvent[],
): void {
  const infra = state.systems.infrastructure;
  let liability = infra.deferredMaintenanceLiability;
  const totalHold = infra.assets.reduce((s, a) => s + a.maintenanceToHold, 0);

  for (const asset of infra.assets) {
    const hold = asset.maintenanceToHold;
    const share = hold / totalHold;
    const allocated = decisions.expenditures.infrastructureMaintenance * share;
    const gap = hold - allocated;

    if (gap > 0) {
      const extraDecay = (gap / hold) * asset.decayPerYear * 1.4;
      asset.condition = Math.max(
        0,
        asset.condition - asset.decayPerYear - extraDecay,
      );
      liability += gap * 1.8;
    } else {
      const repair = Math.min(4, (-gap / hold) * 2);
      asset.condition = Math.min(
        100,
        asset.condition + repair - asset.decayPerYear * 0.3,
      );
    }

    if (
      asset.condition < asset.failureThreshold &&
      !fired.some((e) => e.description.includes(asset.label))
    ) {
      fired.push({
        id: `fail-${asset.id}-${state.year}`,
        createdYear: state.year,
        triggerYear: state.year + 1,
        category: "infrastructure",
        description: `${asset.label} emergency repairs — $${asset.failureCost}M`,
        fiscalImpact: asset.failureCost,
        canBeMitigated: false,
      });
      asset.condition = asset.failureThreshold + 5;
    }
  }

  infra.deferredMaintenanceLiability = Math.round(liability);
}

function updatePension(state: GameState, decisions: PlayerDecisions): void {
  const pension = state.systems.pension;
  pension.assumedReturn = decisions.pensionAssumedReturn;
  const paid = decisions.expenditures.pensionContribution;
  const arc = pension.annualRequiredContribution;
  const shortfall = Math.max(0, arc - paid);

  if (shortfall > 0) {
    pension.underpaymentStreak += 1;
    pension.liabilities += shortfall * 1.15;
    pension.fundedRatio = Math.max(
      0.25,
      pension.assets / pension.liabilities,
    );
    pension.annualRequiredContribution = Math.round(
      arc + shortfall * 0.35,
    );
  } else {
    pension.underpaymentStreak = 0;
    pension.assets += paid * 0.92;
    pension.fundedRatio = Math.min(
      1,
      pension.assets / pension.liabilities,
    );
    pension.annualRequiredContribution = Math.round(
      arc * 0.98 + pension.liabilities * 0.002,
    );
  }

  const returnDelta = (pension.assumedReturn - 0.07) * 0.4;
  pension.fundedRatio = Math.min(
    1,
    Math.max(0.2, pension.fundedRatio + returnDelta * 0.02),
  );
}

function qualityGrowthMultiplier(state: GameState): number {
  const roads = state.systems.infrastructure.assets[0]?.condition ?? 50;
  const crime = state.systems.safety.crimeRate;
  const afford = state.systems.housing.affordabilityIndex;
  let m = 1;
  if (roads > 70) m += 0.008;
  if (roads < 50) m -= 0.012;
  if (crime < 35) m += 0.01;
  if (crime > 55) m -= 0.015;
  if (afford < 0.33) m += 0.006;
  if (afford > 0.45) m -= 0.01;
  if (state.systems.housing.zoningReform === "aggressive") m += 0.012;
  if (state.systems.housing.activePolicy === "rentControl") m -= 0.014;
  if (state.budget.propertyTaxRate > 0.0135) m -= 0.01;
  m += educationGrowthBonus(state);
  if (state.economicDevelopment?.employers?.length) {
    m += Math.min(0.012, state.economicDevelopment.employers.length * 0.002);
  }
  return m * state.economicMultiplier;
}

function updateTaxBase(state: GameState): void {
  const mult = qualityGrowthMultiplier(state);
  for (const zone of state.taxBase.zones) {
    const growth = zone.growthRate * mult;
    zone.assessedValue = Math.round(zone.assessedValue * (1 + growth));
    zone.developmentPressure = Math.min(
      1,
      zone.developmentPressure + (growth - zone.growthRate) * 2,
    );
  }
  state.taxBase.totalValue = totalTaxBaseValue(state);
  state.taxBase.permitsIssued = Math.round(
    state.taxBase.permitsIssued * (0.92 + mult * 0.08),
  );
  state.taxBase.populationTrend = Math.min(
    0.04,
    Math.max(-0.02, state.taxBase.populationTrend + (mult - 1) * 0.5),
  );

  const avgGrowth =
    state.taxBase.zones.reduce((s, z) => s + z.growthRate, 0) /
    state.taxBase.zones.length;
  state.taxBase.forecastValue3yr = Math.round(
    state.taxBase.totalValue * Math.pow(1 + avgGrowth * mult, 3),
  );

  state.economicMultiplier += (1 - state.economicMultiplier) * 0.12;
  state.budget.debtServiceSpike = Math.max(0, state.budget.debtServiceSpike * 0.92);
}

function updateSafety(state: GameState, decisions: PlayerDecisions): void {
  const safety = state.systems.safety;
  const spend = decisions.expenditures.publicSafety;
  const baseline = state.expenditures.publicSafety;
  const delta = (spend - baseline) / Math.max(1, baseline);

  safety.policeStaffing = Math.max(
    1.2,
    Math.min(2.4, safety.policeStaffing + delta * 0.08),
  );
  safety.responseTimeMinutes = Math.max(
    4.5,
    Math.min(12, safety.responseTimeMinutes - delta * 0.6),
  );

  const infra = avgInfrastructureCondition(state);
  const afford = state.systems.housing.affordabilityIndex;
  let crime = safety.crimeRate;
  crime += (2.2 - safety.policeStaffing) * 2.5;
  crime += (70 - infra) * 0.04;
  crime += (afford - 0.3) * 18;
  if (decisions.housingPolicy === "rentControl") crime += 2;
  safety.crimeRate = Math.round(Math.max(18, Math.min(85, crime)));
}

function updateHousing(state: GameState, decisions: PlayerDecisions): void {
  const housing = state.systems.housing;
  housing.zoningReform = decisions.zoningReform;
  housing.activePolicy = decisions.housingPolicy;

  let rentPressure =
    state.taxBase.populationTrend * 0.4 -
    (decisions.zoningReform === "aggressive" ? 0.015 : 0) -
    (decisions.zoningReform === "modest" ? 0.006 : 0);

  if (decisions.housingPolicy === "rentControl") {
    rentPressure -= 0.02;
    housing.medianRent = Math.round(housing.medianRent * 0.97);
  }
  if (decisions.housingPolicy === "inclusionary") rentPressure -= 0.004;
  if (decisions.housingPolicy === "subsidy") {
    rentPressure -= 0.008;
    housing.medianIncome = Math.round(housing.medianIncome * 1.005);
  }

  housing.medianRent = Math.round(
    housing.medianRent * (1 + rentPressure * 0.03),
  );
  housing.affordabilityIndex =
    housing.medianRent / (housing.medianIncome / 12);
}

function weightedCoalitionScore(state: GameState): number {
  const w = state.politics.factionWeights;
  let score = 0;
  for (const id of FACTIONS) {
    score += state.politics.approvals[id] * (w[id] ?? 0.2);
  }
  return Math.round(score);
}

function runElection(state: GameState): { held: boolean; won: boolean; headline: string } {
  const p = state.politics;
  p.coalitionScore = weightedCoalitionScore(state);
  const threshold = electionThreshold(state);
  const coalitionFail = checkCoalitionBuilderLoss(state);
  const won = p.coalitionScore >= threshold && !coalitionFail;

  let headline: string;
  if (won) {
    headline = `Mayor wins re-election with ${p.coalitionScore}% coalition support — four more years.`;
    p.yearsUntilElection = 4;
    p.electionYear = state.year + 4;
  } else {
    headline = coalitionFail
      ? `Coalition fractured — a faction fell below 38% approval. Election lost.`
      : `Election night upset — coalition at ${p.coalitionScore}% falls short of ${threshold}% needed.`;
    state.phase = "ended";
    state.endReason = "election_loss";
  }

  return { held: true, won, headline };
}

function updatePolitics(
  state: GameState,
  surplus: number,
): { electionHeld: boolean; electionHeadline?: string } {
  const p = state.politics;
  const infra = avgInfrastructureCondition(state);
  const crime = state.systems.safety.crimeRate;
  const afford = state.systems.housing.affordabilityIndex;
  const pension = state.systems.pension.fundedRatio;
  const outerRoad =
    state.districts.find((d) => d.id === "outer")?.roadCondition ?? 60;

  const deltas: Record<FactionId, number> = {
    homeowners:
      (infra - 65) * 0.15 -
      (state.budget.propertyTaxRate - 0.012) * 800 +
      (crime < 40 ? 2 : -2),
    renters:
      (0.33 - afford) * 40 +
      (state.expenditures.parksLibraries > 45 ? 1 : -1) +
      (state.systems.housing.activePolicy === "rentControl" ? 6 : 0) +
      (state.systems.housing.activePolicy === "subsidy" ? 4 : 0) +
      (outerRoad < 45 ? -4 : outerRoad > 65 ? 2 : 0),
    business:
      (infra - 60) * 0.12 -
      (state.budget.salesTaxRate - 0.02) * 600 +
      (surplus > 0 ? 1 : -3) +
      (state.economicDevelopment?.attractiveness > 65 ? 2 : 0) +
      (state.economicDevelopment?.employers?.length
        ? state.economicDevelopment.employers.length * 0.5
        : 0),
    employees:
      (state.expenditures.publicSafety >= 380 ? 1 : -4) +
      (pension > 0.7 ? 1 : -5),
    fiscalHawks:
      (surplus >= 0 ? 3 : -6) -
      state.budget.consecutiveDeficitYears * 4 +
      (state.budget.bondDebt > 950 ? -3 : 1),
  };

  for (const id of FACTIONS) {
    p.approvals[id] = Math.round(
      Math.max(10, Math.min(95, p.approvals[id] + deltas[id])),
    );
  }

  p.coalitionScore = weightedCoalitionScore(state);
  p.yearsUntilElection -= 1;

  if (p.yearsUntilElection <= 0) {
    const result = runElection(state);
    return { electionHeld: true, electionHeadline: result.headline };
  }
  return { electionHeld: false };
}

function generateHeadline(
  state: GameState,
  surplus: number,
  fired: DelayedEvent[],
  randomLabel?: string,
): string {
  if (randomLabel) {
    return `${randomLabel} — ${state.city.name} Gazette`;
  }
  if (fired.length > 0 && fired[0].fiscalImpact > 10) {
    return fired[0].description;
  }
  if (surplus < -40) {
    return `Structural deficit deepens — bond markets watch ${state.city.name} closely.`;
  }
  if (surplus > 25) {
    return "Surplus year — council debates whether to rebuild reserves or cut taxes.";
  }
  const crime = state.systems.safety.crimeRate;
  if (crime < 32) {
    return "Crime falls to decade low — developers pitch infill projects.";
  }
  const afford = state.systems.housing.affordabilityIndex;
  if (afford > 0.38) {
    return "Rent burden climbs — service workers commute from suburbs.";
  }
  const edu = state.systems.education?.qualityIndex;
  if (edu !== undefined && edu > 74) {
    return "School ratings climb — families cite districts in relocation pitches.";
  }
  const latestEmployer =
    state.economicDevelopment?.employers?.[
      state.economicDevelopment.employers.length - 1
    ];
  if (latestEmployer?.landedYear === state.year) {
    return `${latestEmployer.name} lands — council touts jobs and tax base growth.`;
  }
  if (state.capital?.active && state.capital.active.progress >= 50) {
    return `${state.capital.active.label} hits ${state.capital.active.progress}% — ribbon-cutting on horizon.`;
  }
  return `FY${state.year} closes — fund balance at $${Math.round(state.budget.fundBalance)}M.`;
}

function checkEndConditions(state: GameState): void {
  if (state.phase === "ended") return;

  if (
    state.budget.fundBalance < -50 &&
    state.budget.creditRating === "junk" &&
    state.budget.consecutiveDeficitYears >= 3
  ) {
    state.phase = "ended";
    state.endReason = "fiscal_crisis";
    return;
  }

  if (
    state.budget.creditRating === "junk" &&
    maxBondIssuance(state) === 0 &&
    state.budget.fundBalance < 5 &&
    state.budget.consecutiveDeficitYears >= 3
  ) {
    state.phase = "ended";
    state.endReason = "liquidity_trap";
    return;
  }

  if (
    state.systems.pension.fundedRatio < 0.38 &&
    state.budget.consecutiveDeficitYears >= 3
  ) {
    state.phase = "ended";
    state.endReason = "state_takeover";
    return;
  }

  if (state.history.length >= state.maxYears) {
    state.phase = "ended";
    state.endReason = "completed";
  }
}

export function simulateTurn(
  input: GameState,
  decisions: PlayerDecisions,
  unlockedSoFar: Set<string> = new Set(),
): TurnResult {
  const state: GameState = structuredClone(input);
  const fired: DelayedEvent[] = [];
  state.alerts = [];

  applyPensionReform(state, decisions);

  const bond = clampBondIssuance(state, decisions.bondsToIssue);
  if (bond.reason && bond.rejected > 0) {
    state.alerts.push(bond.reason);
  }

  const revenue = calculateRevenue(state, {
    ...decisions,
    bondsToIssue: bond.allowed,
  });
  const expenditures = calculateExpenditures(state, decisions);
  let surplus = revenue - expenditures;

  state.budget.propertyTaxRate = decisions.propertyTaxRate;
  state.budget.salesTaxRate = decisions.salesTaxRate;
  state.expenditures = { ...decisions.expenditures };

  if (bond.allowed > 0) {
    state.budget.bondDebt += bond.allowed;
  }

  state.budget.fundBalance += surplus;
  if (surplus < 0) {
    state.budget.consecutiveDeficitYears += 1;
  } else {
    state.budget.consecutiveDeficitYears = 0;
    if (surplus > 15) {
      state.budget.rainyDayFund += Math.round(surplus * 0.25);
    }
  }

  state.budget.creditRating = deriveCreditRating(state, revenue);

  const ticked = tickEventQueue(state, fired);
  state.eventQueue = ticked.queue;
  state.budget.fundBalance += ticked.balanceDelta;
  surplus += ticked.balanceDelta;
  state.alerts.push(...ticked.alerts);

  updateInfrastructure(state, decisions, fired);
  const districtAlerts = updateDistricts(state, decisions);
  state.alerts.push(...districtAlerts);
  updatePension(state, decisions);
  updateSafety(state, decisions);
  updateHousing(state, decisions);
  updateEducation(state, decisions);
  updateEconomicDevelopment(state, decisions);
  updateCapitalProjects(state, decisions);
  updateTaxBase(state);

  const random = applyRandomEvent(state);
  state.eventQueue = random.queue;
  if (random.alert) state.alerts.push(random.alert);

  state.eventQueue = queueMaintenanceConsequences(state, decisions);
  state.eventQueue = queueTaxRateConsequences(state, decisions);
  state.eventQueue = queuePensionConsequences(state, decisions);
  state.eventQueue = queueSafetyConsequences(state, decisions);
  state.eventQueue = queueZoningConsequences(state, decisions);
  state.eventQueue = queueHousingPolicyConsequences(state, decisions);

  for (const event of fired) {
    if (event.fiscalImpact > 0) {
      state.budget.fundBalance -= event.fiscalImpact;
      surplus -= event.fiscalImpact;
    }
  }

  const { electionHeld, electionHeadline } = updatePolitics(state, surplus);

  if (
    state.settings.challengeId === "coalition_builder" &&
    checkCoalitionBuilderLoss(state) &&
    state.phase !== "ended"
  ) {
    state.phase = "ended";
    state.endReason = "election_loss";
    state.alerts.push("Coalition Builder challenge failed — a faction dropped below 38%.");
  }

  const staffAdvice = generateStaffAdvice(state, decisions);
  const staffNotes = updateStaffAfterTurn(state, decisions, staffAdvice);
  state.alerts.push(...staffNotes);

  state.factionQuotes = generateFactionQuotes(state, decisions, surplus);
  updateRunStats(state, {
    ...decisions,
    bondsToIssue: bond.allowed,
  });

  let headline =
    electionHeadline ??
    generateHeadline(state, surplus, fired, random.label);

  state.lastHeadline = headline;
  state.newspapers = [
    ...state.newspapers,
    {
      year: state.year,
      headline,
      edition: `${state.city.name} Daily`,
    },
  ].slice(-12);

  const record: YearRecord = {
    year: state.year,
    revenue: Math.round(revenue),
    expenditures: Math.round(expenditures),
    fundBalance: Math.round(state.budget.fundBalance),
    taxBase: state.taxBase.totalValue,
    pensionFundedRatio: state.systems.pension.fundedRatio,
    infrastructureCondition: Math.round(avgInfrastructureCondition(state)),
    housingAffordabilityIndex: state.systems.housing.affordabilityIndex,
    crimeRate: state.systems.safety.crimeRate,
    educationQuality: Math.round(state.systems.education.qualityIndex),
    employerCount: state.economicDevelopment.employers.length,
    approvals: { ...state.politics.approvals },
    headline,
    creditRating: state.budget.creditRating,
  };
  state.history = [...state.history, record];
  state.year += 1;

  checkEndConditions(state);

  state.prevApprovals = { ...state.politics.approvals };

  const newlyUnlocked = checkAchievements(state, unlockedSoFar);

  return {
    state,
    revenue: Math.round(revenue),
    expenditures: Math.round(expenditures),
    surplus: Math.round(surplus),
    headline,
    electionHeld,
    randomEventLabel: random.label,
    newlyUnlockedAchievements: newlyUnlocked,
  };
}

export { maxBondIssuance, clampBondIssuance } from "./credit";

export function formatMillions(value: number, signed = false): string {
  const abs = Math.abs(value);
  const prefix = signed && value < 0 ? "−" : signed && value > 0 ? "+" : "";
  if (abs >= 1000) return `${prefix}$${(value / 1000).toFixed(2)}B`;
  return `${prefix}$${Math.round(value)}M`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function projectTurnBalance(
  state: GameState,
  decisions: PlayerDecisions,
): { revenue: number; expenditures: number; surplus: number } {
  const bond = clampBondIssuance(state, decisions.bondsToIssue);
  const revenue = calculateRevenue(state, {
    ...decisions,
    bondsToIssue: bond.allowed,
  });
  const expenditures = calculateExpenditures(state, decisions);
  return {
    revenue: Math.round(revenue),
    expenditures: Math.round(expenditures),
    surplus: Math.round(revenue - expenditures),
  };
}
