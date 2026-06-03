import type { HousingPolicy, PensionReformChoice, PlayerDecisions } from "./types";

export interface ExplainerTip {
  title: string;
  body: string;
  realWorld?: string;
}

export const POLICY_EXPLAINERS: Record<string, ExplainerTip> = {
  maintenance: {
    title: "Deferred maintenance",
    body: "Cuts save money now but condition scores fall silently. Failures cost 3–5× cumulative savings.",
    realWorld: "Detroit and many Sun Belt suburbs faced emergency road repair bills after years of deferral.",
  },
  pension: {
    title: "Pension ARC",
    body: "Paying less than the actuarially required contribution grows unfunded liability and raises future ARC.",
    realWorld: "Chicago’s pension crisis illustrates the self-reinforcing shortfall spiral.",
  },
  tax: {
    title: "Property tax incidence",
    body: "Higher rates raise revenue immediately but can slow commercial development with a 3–7 year lag.",
    realWorld: "Local debates often ignore lagged tax-base effects when rates rise.",
  },
  bonds: {
    title: "Bond capacity",
    body: "Credit rating caps how much debt markets will absorb and sets your interest cost.",
    realWorld: "AAA cities borrow at spreads that compound into billions over decades.",
  },
  rentControl: {
    title: "Rent control",
    body: "Immediate rent relief for tenants; long-run supply growth slows as development returns fall.",
    realWorld: "Economists often cite San Francisco and New York as cautionary supply examples.",
  },
  zoning: {
    title: "Upzoning",
    body: "Political friction upfront; housing supply and affordability improve over 5–10 years.",
    realWorld: "Minneapolis 2040 plan is frequently cited for gradual supply effects.",
  },
};

export function tipsForDecisions(
  draft: PlayerDecisions,
  baseline: PlayerDecisions,
): ExplainerTip[] {
  const tips: ExplainerTip[] = [];
  const exp = draft.expenditures;
  const base = baseline.expenditures;

  if (exp.infrastructureMaintenance < base.infrastructureMaintenance - 8) {
    tips.push(POLICY_EXPLAINERS.maintenance);
  }
  if (exp.pensionContribution < base.pensionContribution - 10) {
    tips.push(POLICY_EXPLAINERS.pension);
  }
  if (draft.propertyTaxRate > baseline.propertyTaxRate + 0.0004) {
    tips.push(POLICY_EXPLAINERS.tax);
  }
  if (draft.bondsToIssue > 0) {
    tips.push(POLICY_EXPLAINERS.bonds);
  }
  if (draft.housingPolicy === "rentControl") {
    tips.push(POLICY_EXPLAINERS.rentControl);
  }
  if (draft.zoningReform !== "none") {
    tips.push(POLICY_EXPLAINERS.zoning);
  }

  return tips;
}

export function tipForPensionReform(choice: PensionReformChoice): ExplainerTip | null {
  if (choice === "colaFreeze") {
    return {
      title: "COLA freeze",
      body: "Lowers future liability growth; retirees and unions push back hard.",
      realWorld: "Several distressed cities negotiated COLA adjustments in recovery plans.",
    };
  }
  if (choice === "closeDbNewHires") {
    return {
      title: "Close DB plan to new hires",
      body: "Large upfront political cost; ARC growth slows over 15+ years.",
      realWorld: "Hybrid or DC plans for new hires are common reform paths.",
    };
  }
  if (choice === "raiseEmployeeShare") {
    return {
      title: "Higher employee contributions",
      body: "Moderate savings with moderate union opposition.",
    };
  }
  return null;
}

export function tipForHousingPolicy(policy: HousingPolicy): ExplainerTip | null {
  if (policy === "inclusionary") {
    return {
      title: "Inclusionary zoning",
      body: "Affordable units in new projects; can slow overall construction pace.",
    };
  }
  if (policy === "subsidy") {
    return {
      title: "Housing subsidy",
      body: "Direct relief for low-income households — expensive per unit.",
    };
  }
  return POLICY_EXPLAINERS.rentControl;
}
