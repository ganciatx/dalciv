import { applyChallengeToState, createInitialRunStats } from "./achievements";
import { alignStartingBudget } from "./fiscalBaseline";
import { createInitialCapitalState } from "./capitalProjects";
import { createDefaultDistricts } from "./districts";
import { createInitialEconomicDevelopment } from "./economicDevelopment";
import { createInitialEducation } from "./education";
import { createInitialStaff } from "./staff";
import type {
  ChallengeId,
  Difficulty,
  FactionId,
  GameState,
  PlayerDecisions,
  ScenarioId,
} from "./types";

export interface ScenarioMeta {
  id: ScenarioId;
  title: string;
  description: string;
  challenge: string;
  cityName: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: "sun-belt-boom",
    title: "Sun Belt Boom",
    description: "Fast-growing Sunbelt city with infrastructure strain.",
    challenge: "Keep up with growth; affordability pressure emerging.",
    cityName: "Sunridge",
  },
  {
    id: "rust-belt-reckoning",
    title: "Rust Belt Reckoning",
    description: "Shrinking industrial city with legacy obligations.",
    challenge: "Declining tax base + heavy pension burden.",
    cityName: "Millhaven",
  },
  {
    id: "coastal-squeeze",
    title: "Coastal Squeeze",
    description: "High-cost city with acute housing stress.",
    challenge: "Affordability and workforce retention.",
    cityName: "Bayport",
  },
  {
    id: "fiscal-precipice",
    title: "Fiscal Precipice",
    description: "Distressed city already on the fiscal edge.",
    challenge: "Crisis management without state takeover.",
    cityName: "Bridgewater",
  },
  {
    id: "greenfield",
    title: "Greenfield",
    description: "Brand-new city built from scratch.",
    challenge: "Pure planning — optimize without legacy debt.",
    cityName: "Newford",
  },
];

const DEFAULT_FACTION_WEIGHTS = {
  homeowners: 0.28,
  renters: 0.22,
  business: 0.2,
  employees: 0.18,
  fiscalHawks: 0.12,
};

function applyDifficulty(state: GameState, difficulty: Difficulty): GameState {
  if (difficulty === "sandbox") {
    state.maxYears = 15;
    state.budget.fundBalance += 40;
    state.budget.rainyDayFund += 25;
  } else if (difficulty === "hard") {
    state.budget.fundBalance = Math.max(15, state.budget.fundBalance - 35);
    state.budget.rainyDayFund = Math.max(8, state.budget.rainyDayFund - 20);
    for (const asset of state.systems.infrastructure.assets) {
      asset.condition -= 6;
      asset.decayPerYear *= 1.15;
    }
    state.systems.pension.fundedRatio = Math.max(
      0.35,
      state.systems.pension.fundedRatio - 0.08,
    );
  }
  return state;
}

function baseState(
  scenarioId: ScenarioId,
  cityName: string,
  population: number,
  overrides: {
    budget?: Partial<GameState["budget"]>;
    systems?: Partial<GameState["systems"]>;
    taxBase?: Partial<GameState["taxBase"]>;
    politics?: Partial<GameState["politics"]>;
    lastHeadline?: string;
    maxYears?: number;
  } = {},
): GameState {
  const expenditures = {
    publicSafety: 382,
    infrastructureMaintenance: 94,
    pensionContribution: 118,
    parksLibraries: 48,
    administration: 122,
    education: 198,
    economicDevelopment: 32,
    capitalProjects: 0,
  };

  const state: GameState = {
    year: 2025,
    maxYears: 30,
    phase: "playing",
    city: { name: cityName, population, scenarioId },
    settings: {
      difficulty: "standard",
      policyExplainer: false,
      challengeId: "none",
    },
    budget: {
      propertyTaxRate: 0.0122,
      salesTaxRate: 0.02,
      fundBalance: 105,
      rainyDayFund: 48,
      bondDebt: 890,
      debtServiceRate: 0.042,
      debtServiceSpike: 0,
      consecutiveDeficitYears: 0,
      creditRating: "AA",
      consumerSpending: 18.4,
      transfers: 124,
      baseTransfers: 124,
      fees: 38,
    },
    expenditures,
    systems: {
      infrastructure: {
        assets: [
          {
            id: "roads",
            label: "Roads",
            condition: 68,
            decayPerYear: 2.8,
            maintenanceToHold: 52,
            failureThreshold: 35,
            failureCost: 22,
          },
          {
            id: "water",
            label: "Water & sewer",
            condition: 71,
            decayPerYear: 2.2,
            maintenanceToHold: 28,
            failureThreshold: 40,
            failureCost: 16,
          },
          {
            id: "buildings",
            label: "Public buildings",
            condition: 74,
            decayPerYear: 1.6,
            maintenanceToHold: 14,
            failureThreshold: 45,
            failureCost: 8,
          },
        ],
        deferredMaintenanceLiability: 186,
      },
      pension: {
        fundedRatio: 0.74,
        assumedReturn: 0.07,
        annualRequiredContribution: 118,
        assets: 2_940,
        liabilities: 3_970,
        underpaymentStreak: 0,
      },
      safety: {
        policeStaffing: 1.85,
        fireStaffing: 1.12,
        crimeRate: 42,
        responseTimeMinutes: 6.8,
      },
      housing: {
        affordabilityIndex: 0.31,
        medianRent: 1_420,
        medianIncome: 58_400,
        zoningReform: "none",
        activePolicy: "none",
      },
      education: createInitialEducation(scenarioId),
    },
    taxBase: {
      zones: [
        {
          id: "res-low",
          label: "Residential (low density)",
          assessedValue: 6_200,
          growthRate: 0.028,
          developmentPressure: 0.72,
        },
        {
          id: "res-high",
          label: "Residential (high density)",
          assessedValue: 4_100,
          growthRate: 0.041,
          developmentPressure: 0.88,
        },
        {
          id: "commercial",
          label: "Commercial",
          assessedValue: 9_800,
          growthRate: 0.035,
          developmentPressure: 0.81,
        },
        {
          id: "industrial",
          label: "Industrial",
          assessedValue: 3_400,
          growthRate: 0.022,
          developmentPressure: 0.55,
        },
      ],
      totalValue: 23_500,
      permitsIssued: 12_400,
      populationTrend: 0.021,
      forecastValue3yr: 25_200,
    },
    politics: {
      approvals: {
        homeowners: 58,
        renters: 52,
        business: 61,
        employees: 64,
        fiscalHawks: 55,
      },
      electionYear: 2028,
      yearsUntilElection: 3,
      coalitionScore: 58,
      factionWeights: { ...DEFAULT_FACTION_WEIGHTS },
    },
    pensionReforms: {
      colaFreeze: false,
      closedDbNewHires: false,
      raisedEmployeeShare: false,
    },
    eventQueue: [],
    history: [],
    newspapers: [],
    lastHeadline: `${cityName} enters FY2025 — your term begins.`,
    alerts: [],
    randomSeed: 42_025,
    economicMultiplier: 1,
    districts: createDefaultDistricts(scenarioId),
    factionQuotes: [],
    prevApprovals: {
      homeowners: 58,
      renters: 52,
      business: 61,
      employees: 64,
      fiscalHawks: 55,
    } as Record<FactionId, number>,
    runStats: createInitialRunStats(),
    economicDevelopment: createInitialEconomicDevelopment(),
    capital: createInitialCapitalState(),
    staff: createInitialStaff(),
  };

  if (overrides.lastHeadline) state.lastHeadline = overrides.lastHeadline;
  if (overrides.maxYears) state.maxYears = overrides.maxYears;
  if (overrides.budget) Object.assign(state.budget, overrides.budget);
  if (overrides.systems) {
    if (overrides.systems.infrastructure) {
      state.systems.infrastructure = {
        ...state.systems.infrastructure,
        ...overrides.systems.infrastructure,
        assets:
          overrides.systems.infrastructure.assets ??
          state.systems.infrastructure.assets,
      };
    }
    if (overrides.systems.pension)
      Object.assign(state.systems.pension, overrides.systems.pension);
    if (overrides.systems.safety)
      Object.assign(state.systems.safety, overrides.systems.safety);
    if (overrides.systems.housing)
      Object.assign(state.systems.housing, overrides.systems.housing);
  }
  if (overrides.taxBase) {
    if (overrides.taxBase.zones) state.taxBase.zones = overrides.taxBase.zones;
    if (overrides.taxBase.populationTrend !== undefined)
      state.taxBase.populationTrend = overrides.taxBase.populationTrend;
    if (overrides.taxBase.permitsIssued !== undefined)
      state.taxBase.permitsIssued = overrides.taxBase.permitsIssued;
    if (overrides.taxBase.forecastValue3yr !== undefined)
      state.taxBase.forecastValue3yr = overrides.taxBase.forecastValue3yr;
  }
  if (overrides.politics) Object.assign(state.politics, overrides.politics);

  state.taxBase.totalValue = state.taxBase.zones.reduce(
    (s, z) => s + z.assessedValue,
    0,
  );
  state.budget.baseTransfers = state.budget.transfers;

  return state;
}

export function createScenarioState(
  scenarioId: ScenarioId,
  difficulty: Difficulty = "standard",
  challengeId: ChallengeId = "none",
): GameState {
  let state: GameState;

  switch (scenarioId) {
    case "rust-belt-reckoning":
      state = baseState("rust-belt-reckoning", "Millhaven", 680_000, {
        budget: {
          fundBalance: 32,
          rainyDayFund: 18,
          bondDebt: 1_120,
          creditRating: "BBB",
          consumerSpending: 9.2,
          transfers: 98,
        },
        systems: {
          pension: {
            fundedRatio: 0.52,
            annualRequiredContribution: 168,
            assets: 1_820,
            liabilities: 3_500,
            assumedReturn: 0.07,
            underpaymentStreak: 0,
          },
        },
        taxBase: {
          populationTrend: -0.008,
          permitsIssued: 2_100,
        },
        politics: {
          approvals: {
            homeowners: 48,
            renters: 50,
            business: 44,
            employees: 52,
            fiscalHawks: 60,
          },
          coalitionScore: 51,
        },
      });
      state.expenditures.pensionContribution = 140;
      state.expenditures.publicSafety = 320;
      state.taxBase.zones.forEach((z) => {
        z.growthRate = Math.max(-0.01, z.growthRate - 0.02);
      });
      break;

    case "coastal-squeeze":
      state = baseState("coastal-squeeze", "Bayport", 920_000, {
        budget: {
          fundBalance: 54,
          propertyTaxRate: 0.011,
          consumerSpending: 22.1,
        },
        systems: {
          housing: {
            affordabilityIndex: 0.44,
            medianRent: 2_380,
            medianIncome: 72_000,
            zoningReform: "none",
            activePolicy: "none",
          },
        },
        taxBase: { populationTrend: 0.008, permitsIssued: 4_800 },
        politics: {
          approvals: {
            homeowners: 62,
            renters: 38,
            business: 58,
            employees: 60,
            fiscalHawks: 52,
          },
          coalitionScore: 54,
        },
      });
      state.expenditures.parksLibraries = 62;
      break;

    case "fiscal-precipice":
      state = baseState("fiscal-precipice", "Bridgewater", 540_000, {
        budget: {
          fundBalance: 8,
          rainyDayFund: 4,
          bondDebt: 1_380,
          creditRating: "B",
          debtServiceRate: 0.058,
          consecutiveDeficitYears: 2,
          transfers: 88,
        },
        systems: {
          pension: {
            fundedRatio: 0.48,
            annualRequiredContribution: 142,
            assets: 1_100,
            liabilities: 2_290,
            assumedReturn: 0.075,
            underpaymentStreak: 2,
          },
          infrastructure: {
            assets: [
              {
                id: "roads",
                label: "Roads",
                condition: 48,
                decayPerYear: 3.4,
                maintenanceToHold: 58,
                failureThreshold: 35,
                failureCost: 26,
              },
              {
                id: "water",
                label: "Water & sewer",
                condition: 52,
                decayPerYear: 2.8,
                maintenanceToHold: 32,
                failureThreshold: 40,
                failureCost: 18,
              },
              {
                id: "buildings",
                label: "Public buildings",
                condition: 55,
                decayPerYear: 2,
                maintenanceToHold: 16,
                failureThreshold: 45,
                failureCost: 10,
              },
            ],
            deferredMaintenanceLiability: 320,
          },
        },
        politics: {
          approvals: {
            homeowners: 42,
            renters: 45,
            business: 40,
            employees: 46,
            fiscalHawks: 38,
          },
          coalitionScore: 42,
          yearsUntilElection: 2,
          electionYear: 2027,
        },
      });
      state.expenditures.pensionContribution = 95;
      break;

    case "greenfield":
      state = baseState("greenfield", "Newford", 210_000, {
        budget: {
          fundBalance: 120,
          rainyDayFund: 55,
          bondDebt: 120,
          creditRating: "AAA",
          consumerSpending: 4.2,
          transfers: 42,
          fees: 12,
        },
        systems: {
          pension: {
            fundedRatio: 0.92,
            annualRequiredContribution: 18,
            assets: 420,
            liabilities: 456,
            assumedReturn: 0.065,
            underpaymentStreak: 0,
          },
          infrastructure: {
            assets: [
              {
                id: "roads",
                label: "Roads",
                condition: 92,
                decayPerYear: 1.2,
                maintenanceToHold: 22,
                failureThreshold: 35,
                failureCost: 8,
              },
              {
                id: "water",
                label: "Water & sewer",
                condition: 90,
                decayPerYear: 1,
                maintenanceToHold: 14,
                failureThreshold: 40,
                failureCost: 6,
              },
              {
                id: "buildings",
                label: "Public buildings",
                condition: 88,
                decayPerYear: 0.9,
                maintenanceToHold: 8,
                failureThreshold: 45,
                failureCost: 4,
              },
            ],
            deferredMaintenanceLiability: 12,
          },
          safety: {
            policeStaffing: 1.4,
            fireStaffing: 0.95,
            crimeRate: 28,
            responseTimeMinutes: 5.2,
          },
        },
        taxBase: {
          populationTrend: 0.038,
          permitsIssued: 3_800,
        },
      });
      state.expenditures = {
        publicSafety: 48,
        infrastructureMaintenance: 28,
        pensionContribution: 18,
        parksLibraries: 22,
        administration: 38,
        education: 42,
        economicDevelopment: 12,
        capitalProjects: 0,
      };
      state.taxBase.zones.forEach((z) => {
        z.assessedValue = Math.round(z.assessedValue * 0.22);
        z.growthRate += 0.02;
      });
      break;

    case "sun-belt-boom":
    default:
      state = baseState("sun-belt-boom", "Sunridge", 1_250_000, {
        lastHeadline:
          "Sunridge enters FY2025 with strong growth — and widening cracks in the pavement.",
      });
  }

  state.settings.difficulty = difficulty;
  state.settings.challengeId = challengeId;
  state.prevApprovals = { ...state.politics.approvals };
  applyDifficulty(state, difficulty);
  applyChallengeToState(state);
  alignStartingBudget(state, scenarioId, difficulty);
  return state;
}

/** @deprecated Use createScenarioState('sun-belt-boom') */
export function createSunBeltBoomState(): GameState {
  return createScenarioState("sun-belt-boom");
}

export function defaultDecisions(state: GameState): PlayerDecisions {
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
