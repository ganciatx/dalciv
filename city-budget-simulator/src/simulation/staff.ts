import { electionThreshold } from "./achievements";
import { educationHoldSteadySpend } from "./education";
import { formatMillions } from "./simulate";
import type {
  AdvisorId,
  CampaignStrategy,
  FactionId,
  GameState,
  PlayerDecisions,
  StaffAdvice,
  StaffState,
} from "./types";

export interface PolicyAdvisorDef {
  id: AdvisorId;
  name: string;
  title: string;
  initials: string;
  specialty: string;
  factions: FactionId[];
}

export interface CampaignManagerDef {
  name: string;
  title: string;
  initials: string;
}

export const POLICY_ADVISORS: Record<AdvisorId, PolicyAdvisorDef> = {
  fiscal: {
    id: "fiscal",
    name: "Amara Okonkwo",
    title: "Chief financial advisor",
    initials: "AO",
    specialty: "Pension ARC, debt limits, reserves",
    factions: ["fiscalHawks", "employees"],
  },
  infrastructure: {
    id: "infrastructure",
    name: "James Cole",
    title: "Infrastructure & capital director",
    initials: "JC",
    specialty: "Roads, utilities, multi-year builds",
    factions: ["homeowners", "business"],
  },
  development: {
    id: "development",
    name: "Sofia Reyes",
    title: "Education & economic development director",
    initials: "SR",
    specialty: "Schools, EDC pipeline, employer recruitment",
    factions: ["business", "renters"],
  },
};

export const CAMPAIGN_MANAGER: CampaignManagerDef = {
  name: "Jordan Kim",
  title: "Campaign manager",
  initials: "JK",
};

const STRATEGY_LABELS: Record<CampaignStrategy, string> = {
  balanced: "Balanced coalition",
  neighborhoods: "Neighborhood turnout",
  business: "Business community",
  labor: "Labor & city workforce",
  austerity: "Fiscal discipline message",
};

export function createInitialStaff(): StaffState {
  return {
    advisors: {
      fiscal: { id: "fiscal", trust: 62, yearsHeeded: 0, yearsIgnored: 0 },
      infrastructure: {
        id: "infrastructure",
        trust: 58,
        yearsHeeded: 0,
        yearsIgnored: 0,
      },
      development: {
        id: "development",
        trust: 60,
        yearsHeeded: 0,
        yearsIgnored: 0,
      },
    },
    campaign: {
      trust: 65,
      momentum: 42,
      recommendedStrategy: "balanced",
      yearsHeeded: 0,
      yearsIgnored: 0,
    },
    lastBriefing: [],
  };
}

function infraHoldSteady(state: GameState): number {
  return state.systems.infrastructure.assets.reduce(
    (s, a) => s + a.maintenanceToHold,
    0,
  );
}

function worstDistrictId(state: GameState): GameState["districts"][0]["id"] {
  const sorted = [...state.districts].sort(
    (a, b) => a.roadCondition - b.roadCondition,
  );
  return sorted[0]?.id ?? "outer";
}

function pickCampaignStrategy(state: GameState): CampaignStrategy {
  const p = state.politics;
  const entries = (Object.entries(p.approvals) as [FactionId, number][]).sort(
    (a, b) => a[1] - b[1],
  );
  const weakest = entries[0]?.[0];
  const yearsLeft = p.yearsUntilElection;

  if (yearsLeft <= 1 && p.coalitionScore < electionThreshold(state)) {
    if (weakest === "renters" || weakest === "homeowners") return "neighborhoods";
    if (weakest === "business") return "business";
    if (weakest === "employees") return "labor";
    if (weakest === "fiscalHawks") return "austerity";
  }
  if (state.budget.consecutiveDeficitYears >= 2) return "austerity";
  if (state.economicDevelopment.pipelineProgress > 70) return "business";
  return "balanced";
}

function fiscalAdvice(
  state: GameState,
  draft: PlayerDecisions,
): StaffAdvice {
  const arc = state.systems.pension.annualRequiredContribution;
  const pensionGap = arc - draft.expenditures.pensionContribution;
  const bondCap = state.budget.creditRating === "junk" ? 0 : 80;
  const rec: Partial<PlayerDecisions> = {};
  let title = "Hold the fiscal line";
  let detail =
    "Reserves and ARC payments are adequate — avoid new structural gaps.";
  let tone: StaffAdvice["tone"] = "steady";
  let priority = 2;

  if (pensionGap > 12) {
    rec.expenditures = {
      ...draft.expenditures,
      pensionContribution: Math.min(220, arc),
    };
    title = "Fund the pension ARC";
    detail = `Underpaying by ${Math.round(pensionGap)}M compounds liabilities within a decade. Match ARC at ${Math.round(arc)}M.`;
    tone = "urgent";
    priority = 10;
  } else if (state.budget.consecutiveDeficitYears >= 2) {
    rec.bondsToIssue = 0;
    rec.expenditures = {
      ...draft.expenditures,
      parksLibraries: Math.max(15, draft.expenditures.parksLibraries - 8),
    };
    title = "Stop the bleeding";
    detail =
      "Third deficit year risks a credit downgrade — freeze new bonds and trim discretionary spend.";
    tone = "urgent";
    priority = 9;
  } else if (draft.bondsToIssue > bondCap * 0.6 && state.budget.fundBalance < 40) {
    rec.bondsToIssue = Math.round(bondCap * 0.35);
    title = "Cap bond issuance";
    detail = "Markets will price in weak coverage if you stack debt while reserves are thin.";
    tone = "urgent";
    priority = 7;
  } else if (state.budget.fundBalance > 80 && draft.bondsToIssue > 20) {
    rec.bondsToIssue = 0;
    title = "Rebuild reserves, skip bonds";
    detail = "You have cushion — pay cash for one-time needs instead of new GO debt.";
    tone = "upbeat";
    priority = 4;
  }

  return {
    staffId: "fiscal",
    role: "advisor",
    title,
    detail,
    tone,
    priority,
    recommendation: Object.keys(rec).length ? rec : undefined,
    relatedFactions: POLICY_ADVISORS.fiscal.factions,
  };
}

function infrastructureAdvice(
  state: GameState,
  draft: PlayerDecisions,
): StaffAdvice {
  const hold = infraHoldSteady(state);
  const gap = hold - draft.expenditures.infrastructureMaintenance;
  const worst = worstDistrictId(state);
  const rec: Partial<PlayerDecisions> = {};
  let title = "Maintenance on plan";
  let detail = "Asset conditions are stable if you hold current maintenance levels.";
  let tone: StaffAdvice["tone"] = "steady";
  let priority = 2;

  if (gap > 8) {
    rec.expenditures = {
      ...draft.expenditures,
      infrastructureMaintenance: Math.min(160, hold),
    };
    rec.districtPriority = worst;
    title = "Close the maintenance gap";
    detail = `You're ${Math.round(gap)}M below hold-steady — prioritize ${worst} district roads before failures queue up.`;
    tone = "urgent";
    priority = 9;
  } else if (state.capital.active) {
    const min = 18;
    if (draft.expenditures.capitalProjects < min) {
      rec.expenditures = {
        ...draft.expenditures,
        capitalProjects: min,
      };
      title = `Fund ${state.capital.active.label}`;
      detail = `Underfunding slips the schedule — contribute at least ${min}M this year.`;
      tone = "urgent";
      priority = 8;
    }
  } else if (!state.capital.active && state.systems.education.capacityIndex < 72) {
    rec.newCapitalProjectId = "school-construction";
    rec.expenditures = {
      ...draft.expenditures,
      capitalProjects: 22,
    };
    title = "Authorize school capital";
    detail = "Capacity is tight — a campus build supports families and employer recruitment.";
    tone = "steady";
    priority = 5;
  }

  return {
    staffId: "infrastructure",
    role: "advisor",
    title,
    detail,
    tone,
    priority,
    recommendation: Object.keys(rec).length ? rec : undefined,
    relatedFactions: POLICY_ADVISORS.infrastructure.factions,
  };
}

function developmentAdvice(
  state: GameState,
  draft: PlayerDecisions,
): StaffAdvice {
  const eduHold = educationHoldSteadySpend(state.systems.education.enrollment);
  const eduGap = eduHold - draft.expenditures.education;
  const ed = state.economicDevelopment;
  const rec: Partial<PlayerDecisions> = {};
  let title = "Steady on schools and EDC";
  let detail = "Pipeline and classroom funding are tracking with your growth targets.";
  let tone: StaffAdvice["tone"] = "steady";
  let priority = 2;

  if (eduGap > 15) {
    rec.expenditures = {
      ...draft.expenditures,
      education: Math.min(280, eduHold + 10),
    };
    title = "Restore classroom funding";
    detail = `School quality will slip ${formatMillions(eduGap)} below hold-steady (${formatMillions(eduHold)}/yr target) — teachers and ratings follow the budget.`;
    tone = "urgent";
    priority = 9;
  } else if (
    draft.recruitmentFocus === "none" &&
    ed.pipelineProgress > 55 &&
    ed.yearsSinceLastLanding >= 2
  ) {
    rec.recruitmentFocus = "tech";
    rec.expenditures = {
      ...draft.expenditures,
      economicDevelopment: Math.max(35, draft.expenditures.economicDevelopment),
    };
    title = "Pick a recruitment lane";
    detail =
      "Pipeline is warm but idle — focus tech or manufacturing and fund EDC outreach.";
    tone = "steady";
    priority = 6;
  } else if (ed.pipelineProgress >= 80 && draft.expenditures.economicDevelopment < 30) {
    rec.expenditures = {
      ...draft.expenditures,
      economicDevelopment: 38,
    };
    title = "Close the employer deal";
    detail = "A prospect is at the table — bump EDC spending to land the announcement.";
    tone = "urgent";
    priority = 8;
  }

  return {
    staffId: "development",
    role: "advisor",
    title,
    detail,
    tone,
    priority,
    recommendation: Object.keys(rec).length ? rec : undefined,
    relatedFactions: POLICY_ADVISORS.development.factions,
  };
}

function campaignAdvice(
  state: GameState,
  draft: PlayerDecisions,
): StaffAdvice {
  const strategy = pickCampaignStrategy(state);
  const p = state.politics;
  const entries = (Object.entries(p.approvals) as [FactionId, number][]).sort(
    (a, b) => a[1] - b[1],
  );
  const weak = entries[0];
  const yearsLeft = p.yearsUntilElection;
  let title = STRATEGY_LABELS[strategy];
  let detail = `Run a ${STRATEGY_LABELS[strategy].toLowerCase()} message this cycle.`;
  let tone: StaffAdvice["tone"] = "steady";
  let priority = yearsLeft <= 2 ? 8 : 4;

  if (yearsLeft <= 1) {
    tone = "urgent";
    priority = 10;
    detail = `Election next year — coalition at ${p.coalitionScore}%. Shore up ${weak?.[0] ?? "swing"} voters (now ${weak?.[1]}%).`;
  } else if (p.coalitionScore < electionThreshold(state)) {
    tone = "urgent";
    detail = `You're short of a winning coalition — pivot to ${STRATEGY_LABELS[strategy].toLowerCase()} before approvals harden.`;
  } else if (state.staff.campaign.momentum > 60) {
    tone = "upbeat";
    detail = "Momentum is strong — stay on message and avoid a surprise tax fight.";
    priority = 3;
  }

  return {
    staffId: "campaign",
    role: "campaign",
    title,
    detail,
    tone,
    priority,
    recommendation: { campaignStrategy: strategy },
    relatedFactions: weak ? [weak[0]] : [],
    campaignStrategy: strategy,
  };
}

/** Live counsel based on current draft (client-safe). */
export function generateStaffAdvice(
  state: GameState,
  draft: PlayerDecisions,
): StaffAdvice[] {
  return [
    fiscalAdvice(state, draft),
    infrastructureAdvice(state, draft),
    developmentAdvice(state, draft),
    campaignAdvice(state, draft),
  ].sort((a, b) => b.priority - a.priority);
}

function numClose(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

/** Whether the adopted budget substantially followed an advisor's recommendation. */
export function followedAdvice(
  draft: PlayerDecisions,
  advice: StaffAdvice,
  state: GameState,
): boolean {
  const rec = advice.recommendation;
  if (!rec) return advice.tone === "steady";

  if (rec.expenditures) {
    for (const [key, val] of Object.entries(rec.expenditures) as [
      keyof PlayerDecisions["expenditures"],
      number,
    ][]) {
      if (typeof val !== "number") continue;
      const tol = key === "pensionContribution" ? 6 : key === "education" ? 8 : 5;
      if (!numClose(draft.expenditures[key], val, tol)) return false;
    }
  }
  if (rec.bondsToIssue !== undefined && !numClose(draft.bondsToIssue, rec.bondsToIssue, 8)) {
    return false;
  }
  if (rec.districtPriority && draft.districtPriority !== rec.districtPriority) {
    return false;
  }
  if (rec.recruitmentFocus && draft.recruitmentFocus !== rec.recruitmentFocus) {
    return false;
  }
  if (rec.newCapitalProjectId && draft.newCapitalProjectId !== rec.newCapitalProjectId) {
    return false;
  }
  if (rec.campaignStrategy !== undefined && draft.campaignStrategy !== rec.campaignStrategy) {
    return false;
  }
  return true;
}

const STRATEGY_FACTION_BOOST: Record<
  CampaignStrategy,
  Partial<Record<FactionId, number>>
> = {
  balanced: { homeowners: 1, renters: 1, business: 1 },
  neighborhoods: { homeowners: 2, renters: 3 },
  business: { business: 3 },
  labor: { employees: 3 },
  austerity: { fiscalHawks: 3 },
};

/** Trust, momentum, and approval effects after the year resolves. */
export function updateStaffAfterTurn(
  state: GameState,
  decisions: PlayerDecisions,
  adviceList: StaffAdvice[],
): string[] {
  const notes: string[] = [];
  state.staff.campaign.recommendedStrategy =
    adviceList.find((a) => a.role === "campaign")?.campaignStrategy ?? "balanced";

  for (const advice of adviceList) {
    if (advice.role !== "advisor") continue;
    const id = advice.staffId as AdvisorId;
    const advisor = state.staff.advisors[id];
    const heeded = followedAdvice(decisions, advice, state);

    if (heeded) {
      advisor.yearsHeeded += 1;
      advisor.trust = Math.min(95, advisor.trust + 5);
      for (const f of advice.relatedFactions ?? []) {
        state.politics.approvals[f] = Math.min(
          95,
          state.politics.approvals[f] + 1,
        );
      }
      if (advice.tone === "urgent") {
        notes.push(`${POLICY_ADVISORS[id].name} — counsel followed.`);
      }
    } else if (advice.tone === "urgent" && advice.recommendation) {
      advisor.yearsIgnored += 1;
      advisor.trust = Math.max(25, advisor.trust - 4);
      notes.push(`${POLICY_ADVISORS[id].name} urged action you overrode.`);
    } else {
      advisor.trust = Math.min(95, advisor.trust + 1);
    }
  }

  const campAdvice = adviceList.find((a) => a.role === "campaign");
  const camp = state.staff.campaign;
  const campHeeded = campAdvice
    ? followedAdvice(decisions, campAdvice, state)
    : false;

  if (campHeeded) {
    camp.yearsHeeded += 1;
    camp.trust = Math.min(95, camp.trust + 6);
    camp.momentum = Math.min(100, camp.momentum + 10);
    const boosts = STRATEGY_FACTION_BOOST[decisions.campaignStrategy];
    for (const [f, delta] of Object.entries(boosts) as [FactionId, number][]) {
      state.politics.approvals[f] = Math.min(95, state.politics.approvals[f] + delta);
    }
    if (state.politics.yearsUntilElection <= 2) {
      notes.push(`${CAMPAIGN_MANAGER.name} — war room on message.`);
    }
  } else if (campAdvice?.tone === "urgent") {
    camp.yearsIgnored += 1;
    camp.trust = Math.max(20, camp.trust - 5);
    camp.momentum = Math.max(0, camp.momentum - 8);
  } else {
    camp.momentum = Math.max(0, camp.momentum - 3);
  }

  const momentumBonus = Math.round(camp.momentum * 0.06);
  if (momentumBonus > 0 && state.politics.yearsUntilElection <= 3) {
    state.politics.coalitionScore = Math.min(
      95,
      state.politics.coalitionScore + momentumBonus,
    );
  }

  state.staff.lastBriefing = adviceList.map((a) => ({
    staffId: a.staffId,
    title: a.title,
    heeded:
      a.role === "campaign"
        ? campHeeded
        : followedAdvice(decisions, a, state),
  }));

  return notes;
}

export function mergeRecommendation(
  draft: PlayerDecisions,
  advice: StaffAdvice,
): PlayerDecisions {
  const rec = advice.recommendation;
  if (!rec) return draft;
  return {
    ...draft,
    ...rec,
    expenditures: rec.expenditures
      ? { ...draft.expenditures, ...rec.expenditures }
      : draft.expenditures,
  };
}
