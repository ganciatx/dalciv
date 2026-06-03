import { scheduleEvent } from "./events";
import { seededRandom } from "./randomEvents";
import type {
  Employer,
  GameState,
  PlayerDecisions,
  RecruitmentFocus,
} from "./types";

const SECTOR_NAMES: Record<RecruitmentFocus, string[]> = {
  none: [],
  tech: ["Northline Analytics", "Cloudridge Systems", "DataVault HQ"],
  logistics: ["Summit Freight", "Interstate Logistics Hub", "Portside Distribution"],
  manufacturing: ["AlloyWorks", "Precision Components Inc.", "GreenBattery Assembly"],
  hq: ["Regional Financial Group", "Continental Insurance HQ", "MedCore Administration"],
};

const SECTOR_ZONE: Record<RecruitmentFocus, string> = {
  none: "commercial",
  tech: "commercial",
  logistics: "industrial",
  manufacturing: "industrial",
  hq: "commercial",
};

function recruitmentScore(state: GameState, focus: RecruitmentFocus): number {
  if (focus === "none") return 0;
  let score = state.economicDevelopment.attractiveness * 0.4;
  score += state.systems.education.qualityIndex * 0.25;
  score += (100 - state.systems.safety.crimeRate) * 0.2;
  const infra = state.districts.reduce((s, d) => s + d.roadCondition, 0) / state.districts.length;
  score += infra * 0.15;
  if (state.budget.propertyTaxRate > 0.013) score -= 12;
  if (state.budget.salesTaxRate > 0.022) score -= 8;
  if (focus === "hq" && state.systems.housing.affordabilityIndex > 0.36) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function pickEmployerName(focus: RecruitmentFocus, seed: number): { name: string; nextSeed: number } {
  const names = SECTOR_NAMES[focus];
  const roll = seededRandom(seed);
  const name = names[Math.floor(roll.value * names.length)] ?? "New employer";
  return { name, nextSeed: roll.nextSeed };
}

function landEmployer(
  state: GameState,
  focus: RecruitmentFocus,
  name: string,
): Employer {
  const jobs = Math.round(800 + state.economicDevelopment.attractiveness * 25);
  const taxBaseAdded = Math.round(80 + jobs * 0.04);
  const zoneId = SECTOR_ZONE[focus];
  const zone = state.taxBase.zones.find((z) => z.id === zoneId);
  if (zone) zone.assessedValue += taxBaseAdded;

  const employer: Employer = {
    id: `emp-${state.year}-${focus}`,
    name,
    sector: focus,
    jobs,
    taxBaseAdded,
    landedYear: state.year,
  };
  state.economicDevelopment.employers.push(employer);
  state.economicDevelopment.pipelineProgress = Math.max(
    0,
    state.economicDevelopment.pipelineProgress - 40,
  );
  state.budget.consumerSpending *= 1.02;
  state.politics.approvals.business = Math.min(
    95,
    state.politics.approvals.business + 8,
  );
  return employer;
}

/** EDC spending, recruitment focus, and employer landings. */
export function updateEconomicDevelopment(
  state: GameState,
  decisions: PlayerDecisions,
): void {
  const spend = decisions.expenditures.economicDevelopment;
  const focus = decisions.recruitmentFocus;
  const ed = state.economicDevelopment;

  ed.lastRecruitmentFocus = focus;

  const spendDelta = spend - state.expenditures.economicDevelopment;
  ed.attractiveness = Math.min(
    100,
    Math.max(
      20,
      ed.attractiveness +
        spendDelta * 0.08 +
        (spend >= 35 ? 1.5 : spend < 20 ? -1.2 : 0),
    ),
  );

  if (focus !== "none") {
    const pipelineGain =
      8 +
      spend * 0.15 +
      (focus === "tech" && state.systems.education.qualityIndex > 65 ? 5 : 0);
    ed.pipelineProgress = Math.min(100, ed.pipelineProgress + pipelineGain);
  } else {
    ed.pipelineProgress = Math.max(0, ed.pipelineProgress - 4);
  }

  const score = recruitmentScore(state, focus);
  if (
    focus !== "none" &&
    ed.pipelineProgress >= 85 &&
    score >= 55 &&
    ed.yearsSinceLastLanding >= 2
  ) {
    const roll = seededRandom(state.randomSeed);
    state.randomSeed = roll.nextSeed;
    if (roll.value < 0.35 + score * 0.003) {
      const picked = pickEmployerName(focus, state.randomSeed);
      state.randomSeed = picked.nextSeed;
      const employer = landEmployer(state, focus, picked.name);
      ed.yearsSinceLastLanding = 0;
      state.alerts.push(
        `${employer.name} announces ${employer.jobs.toLocaleString()} jobs — ${formatMoney(employer.taxBaseAdded)} tax base.`,
      );
      state.eventQueue = scheduleEvent(state.eventQueue, {
        createdYear: state.year,
        triggerYear: state.year + 4,
        category: "economic",
        description: `${employer.name} expansion fully built out — commercial tax base grows`,
        fiscalImpact: -18,
        canBeMitigated: false,
        sourceDecision: `Recruited ${focus} employer`,
      });
    } else {
      state.eventQueue = scheduleEvent(state.eventQueue, {
        createdYear: state.year,
        triggerYear: state.year + 2,
        category: "economic",
        description: `Prospective ${focus} employer cites workforce and infrastructure concerns`,
        fiscalImpact: 0,
        canBeMitigated: true,
        mitigationCondition: "Raise EDC spending and education quality",
        sourceDecision: "Economic development recruitment",
      });
    }
  } else {
    ed.yearsSinceLastLanding += 1;
  }

  if (ed.employers.length > 8) {
    ed.employers = ed.employers.slice(-8);
  }
}

function formatMoney(m: number): string {
  return `$${m}M`;
}

export function createInitialEconomicDevelopment(): GameState["economicDevelopment"] {
  return {
    attractiveness: 52,
    employers: [],
    pipelineProgress: 15,
    lastRecruitmentFocus: "none",
    yearsSinceLastLanding: 3,
  };
}

export function employerTaxBonus(state: GameState): number {
  return state.economicDevelopment.employers.reduce(
    (s, e) => s + e.taxBaseAdded * 0.0008,
    0,
  );
}
