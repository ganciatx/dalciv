import type {
  FactionId,
  FactionQuote,
  GameState,
  PlayerDecisions,
} from "./types";
import { avgDistrictRoads } from "./districts";

export interface FactionCharacter {
  factionId: FactionId;
  name: string;
  title: string;
  initials: string;
}

export const FACTION_CHARACTERS: Record<FactionId, FactionCharacter> = {
  homeowners: {
    factionId: "homeowners",
    name: "Helen Marsh",
    title: "President, Neighborhood Alliance",
    initials: "HM",
  },
  renters: {
    factionId: "renters",
    name: "Council Member Diego Ortiz",
    title: "Renters' Coalition (Ward 7)",
    initials: "DO",
  },
  business: {
    factionId: "business",
    name: "Priya Nandakumar",
    title: "Chamber of Commerce chair",
    initials: "PN",
  },
  employees: {
    factionId: "employees",
    name: "Marcus Webb",
    title: "AFSCME Local 2400 president",
    initials: "MW",
  },
  fiscalHawks: {
    factionId: "fiscalHawks",
    name: "State Rep. Lena Cho",
    title: "Citizens for a Balanced Budget",
    initials: "LC",
  },
};

const FACTION_ORDER: FactionId[] = [
  "homeowners",
  "renters",
  "business",
  "employees",
  "fiscalHawks",
];

function toneFromDelta(delta: number, approval: number): FactionQuote["tone"] {
  if (delta <= -5 || approval < 42) return "angry";
  if (delta >= 4 || approval > 68) return "pleased";
  return "neutral";
}

function pickQuote(
  factionId: FactionId,
  ctx: {
    delta: number;
    approval: number;
    cityName: string;
    worstDistrict?: string;
    worstRoads?: number;
    taxUp: boolean;
    maintenanceCut: boolean;
    pensionShort: boolean;
    surplus: number;
    bonds: number;
    edcFocus: string;
    eduQuality: number;
    employerLanded: boolean;
  },
): string {
  const { delta, approval, cityName } = ctx;

  if (factionId === "homeowners") {
    if (ctx.worstRoads !== undefined && ctx.worstRoads < 45) {
      return `"${ctx.worstDistrict ?? "The outer wards"} roads are crumbling. Fix the pavement or fix your resume."`;
    }
    if (ctx.taxUp) {
      return `"You raised my property tax. ${cityName} better feel like a premium city at these prices."`;
    }
    if (delta >= 4) {
      return `"Finally — streets I can drive without losing a hubcap. Keep it up."`;
    }
    if (delta <= -5) {
      return `"My neighbors are done with excuses. We're organizing."`;
    }
    if (ctx.eduQuality < 55) {
      return `"School ratings are slipping — families won't buy homes in ${cityName} at these levels."`;
    }
    if (ctx.eduQuality > 72) {
      return `"Strong schools protect property values. Don't raid the classroom budget."`;
    }
  }

  if (factionId === "renters") {
    if (ctx.maintenanceCut && ctx.worstRoads !== undefined && ctx.worstRoads < 50) {
      return `"You starved ${ctx.worstDistrict ?? "outer districts"} so downtown could shine. My ward sees it."`;
    }
    if (approval > 65) {
      return `"Renters notice when you fund parks and keep buses running. Don't stop now."`;
    }
    if (delta <= -5) {
      return `"Affordability isn't a talking point — it's whether my constituents stay in ${cityName}."`;
    }
  }

  if (factionId === "business") {
    if (ctx.employerLanded) {
      return `"A major employer just chose ${cityName} — keep the EDC funded and we'll fill the pipeline."`;
    }
    if (ctx.edcFocus !== "none") {
      return `"You're courting ${ctx.edcFocus} — match it with workforce, schools, and site readiness."`;
    }
    if (ctx.bonds > 40) {
      return `"Debt makes investors nervous. Show me a plan, not just a bond prospectus."`;
    }
    if (ctx.surplus > 20) {
      return `"Surpluses signal stability — we'll bring jobs if you keep the lights on and the roads smooth."`;
    }
    if (delta <= -5) {
      return `"Boards are asking why they should expand here when infrastructure lags."`;
    }
  }

  if (factionId === "employees") {
    if (ctx.pensionShort) {
      return `"Skipping the pension payment isn't savings — it's a IOU to every worker who showed up."`;
    }
    if (delta >= 4) {
      return `"City staff feel respected this year. That matters at the bargaining table."`;
    }
    if (delta <= -5) {
      return `"Layoff rumors start when you cut public safety and benefits. We're hearing them."`;
    }
    if (ctx.eduQuality < 58) {
      return `"Teachers are stretched thin — that's a bargaining issue and a recruitment issue."`;
    }
  }

  if (factionId === "fiscalHawks") {
    if (ctx.surplus < -30) {
      return `"Structural deficits are how cities lose autonomy. The state is watching."`;
    }
    if (ctx.bonds === 0 && approval > 55) {
      return `"Discipline on debt — rare in this job. I'll say so on the op-ed page."`;
    }
    if (delta <= -5) {
      return `"You're spending like the good times never ended. They will."`;
    }
  }

  if (approval < 40) {
    return `"Approval at ${approval}% — I've seen mayors fall for less."`;
  }
  if (delta >= 3) {
    return `"You've earned some goodwill this year. Spend it wisely."`;
  }
  if (delta <= -3) {
    return `"Something in this budget broke trust with my people."`;
  }
  return `"We're watching the ${ctx.surplus >= 0 ? "surplus" : "deficit"} math and waiting for results."`;
}

/** Generate one in-character line per faction after politics update. */
export function generateFactionQuotes(
  state: GameState,
  decisions: PlayerDecisions,
  surplus: number,
): FactionQuote[] {
  const worst = [...state.districts].sort(
    (a, b) => a.roadCondition - b.roadCondition,
  )[0];
  const need = state.districts.reduce((s, d) => s + d.maintenanceNeed, 0);
  const arc = state.systems.pension.annualRequiredContribution;

  const ctx = {
    cityName: state.city.name,
    worstDistrict: worst?.label,
    worstRoads: worst?.roadCondition,
    taxUp: decisions.propertyTaxRate > state.budget.propertyTaxRate + 0.0003,
    maintenanceCut:
      decisions.expenditures.infrastructureMaintenance < need * 0.8,
    pensionShort: decisions.expenditures.pensionContribution < arc - 5,
    surplus,
    bonds: decisions.bondsToIssue,
    edcFocus: decisions.recruitmentFocus ?? "none",
    eduQuality: state.systems.education?.qualityIndex ?? 65,
    employerLanded: state.economicDevelopment?.employers?.some(
      (e) => e.landedYear === state.year,
    ) ?? false,
  };

  return FACTION_ORDER.map((factionId) => {
    const char = FACTION_CHARACTERS[factionId];
    const approval = state.politics.approvals[factionId];
    const prev = state.prevApprovals[factionId] ?? approval;
    const delta = approval - prev;
    return {
      factionId,
      speakerName: char.name,
      speakerTitle: char.title,
      text: pickQuote(factionId, { ...ctx, delta, approval }),
      tone: toneFromDelta(delta, approval),
    };
  });
}

/** Snapshot approvals before yearly political update. */
export function snapshotApprovals(state: GameState): void {
  state.prevApprovals = { ...state.politics.approvals };
}
