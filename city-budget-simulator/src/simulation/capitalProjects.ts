import { scheduleEvent } from "./events";
import type {
  ActiveCapitalProject,
  CapitalProjectTemplate,
  GameState,
  PlayerDecisions,
} from "./types";

/** Buildable capital investments (multi-year). */
export const CAPITAL_PROJECT_CATALOG: CapitalProjectTemplate[] = [
  {
    id: "transit-corridor",
    label: "Transit corridor expansion",
    description: "Light rail extension + bus rapid transit",
    totalCost: 120,
    durationYears: 6,
    annualContribution: 22,
    benefits: "Mobility + commercial growth along corridor",
  },
  {
    id: "convention-center",
    label: "Convention center modernization",
    description: "Expand meeting space and hotel linkage",
    totalCost: 85,
    durationYears: 4,
    annualContribution: 24,
    benefits: "Tourism, sales tax, downtown development",
  },
  {
    id: "flood-resilience",
    label: "Flood resilience program",
    description: "Stormwater tunnels and creek stabilization",
    totalCost: 95,
    durationYears: 5,
    annualContribution: 20,
    benefits: "Lower emergency repair risk; insurance savings",
  },
  {
    id: "school-construction",
    label: "New school campuses",
    description: "Two campuses in growth districts",
    totalCost: 110,
    durationYears: 5,
    annualContribution: 24,
    benefits: "Education capacity + family attraction",
  },
  {
    id: "innovation-campus",
    label: "Innovation campus land prep",
    description: "Site utilities and pad-ready parcels for employers",
    totalCost: 75,
    durationYears: 4,
    annualContribution: 20,
    benefits: "Boosts employer recruitment success",
  },
];

export function getCapitalTemplate(id: string): CapitalProjectTemplate | undefined {
  return CAPITAL_PROJECT_CATALOG.find((p) => p.id === id);
}

function applyProjectCompletion(
  state: GameState,
  project: ActiveCapitalProject,
): void {
  const template = getCapitalTemplate(project.templateId);
  if (!template) return;

  state.capital.completedIds.push(project.templateId);

  switch (project.templateId) {
    case "transit-corridor":
      state.taxBase.zones.find((z) => z.id === "commercial")!.growthRate += 0.008;
      state.systems.infrastructure.assets[0].condition = Math.min(
        100,
        state.systems.infrastructure.assets[0].condition + 8,
      );
      break;
    case "convention-center":
      state.budget.consumerSpending *= 1.06;
      state.budget.fees += 4;
      break;
    case "flood-resilience":
      state.systems.infrastructure.deferredMaintenanceLiability *= 0.88;
      for (const a of state.systems.infrastructure.assets) {
        a.condition = Math.min(100, a.condition + 5);
      }
      break;
    case "school-construction":
      state.systems.education.capacityIndex = Math.min(
        100,
        state.systems.education.capacityIndex + 12,
      );
      state.systems.education.qualityIndex = Math.min(
        100,
        state.systems.education.qualityIndex + 8,
      );
      break;
    case "innovation-campus":
      state.economicDevelopment.attractiveness = Math.min(
        100,
        state.economicDevelopment.attractiveness + 15,
      );
      state.economicDevelopment.pipelineProgress += 20;
      break;
  }

  state.alerts.push(`${project.label} completed — ${template.benefits}.`);
}

/** Advance or start capital projects; deduct annual spend from fund balance path via expenditures. */
export function updateCapitalProjects(
  state: GameState,
  decisions: PlayerDecisions,
): void {
  const spend = decisions.expenditures.capitalProjects;
  const startId = decisions.newCapitalProjectId;

  if (!state.capital.active && startId && startId !== "none") {
    if (state.capital.completedIds.includes(startId)) {
      state.alerts.push("That capital project was already completed this term.");
    } else {
      const template = getCapitalTemplate(startId);
      if (template) {
        state.capital.active = {
          templateId: template.id,
          label: template.label,
          spent: 0,
          totalCost: template.totalCost,
          yearsRemaining: template.durationYears,
          progress: 0,
        };
        state.alerts.push(
          `Council approves ${template.label} — ${formatCost(template.totalCost)} over ${template.durationYears} years.`,
        );
      }
    }
  }

  const active = state.capital.active;
  if (!active) return;

  const template = getCapitalTemplate(active.templateId);
  const minAnnual = template?.annualContribution ?? 15;
  const effectiveSpend = Math.max(spend, spend > 0 ? spend : 0);

  if (effectiveSpend < minAnnual * 0.6) {
    active.yearsRemaining += 1;
    state.alerts.push(
      `${active.label} underfunded — schedule slips (${active.yearsRemaining} years left).`,
    );
  } else {
    active.spent += effectiveSpend;
    active.progress = Math.min(
      100,
      Math.round((active.spent / active.totalCost) * 100),
    );
    active.yearsRemaining = Math.max(0, active.yearsRemaining - 1);
  }

  if (active.spent >= active.totalCost || active.progress >= 100) {
    applyProjectCompletion(state, active);
    state.capital.active = null;
    state.eventQueue = scheduleEvent(state.eventQueue, {
      createdYear: state.year,
      triggerYear: state.year + 2,
      category: "capital",
      description: `${active.label} ribbon-cutting boosts business confidence`,
      fiscalImpact: -12,
      canBeMitigated: false,
      sourceDecision: "Capital project completed",
    });
  }
}

function formatCost(m: number): string {
  return `$${m}M`;
}

export function createInitialCapitalState(): GameState["capital"] {
  return {
    active: null,
    completedIds: [],
  };
}
