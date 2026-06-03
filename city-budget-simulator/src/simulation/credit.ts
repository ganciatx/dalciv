import type { CreditRating, GameState } from "./types";

/** Max general-obligation bonds issuable in one year by credit rating. */
const BOND_CAP_BY_RATING: Record<CreditRating, number> = {
  AAA: 150,
  AA: 120,
  A: 95,
  BBB: 70,
  BB: 45,
  B: 25,
  junk: 0,
};

/** Multiplier on base debt service rate — worse credit costs more. */
const DEBT_RATE_MULT: Record<CreditRating, number> = {
  AAA: 1,
  AA: 1.03,
  A: 1.07,
  BBB: 1.12,
  BB: 1.2,
  B: 1.32,
  junk: 1.55,
};

export function maxBondIssuance(state: GameState): number {
  if (state.settings.challengeId === "no_bonds") return 0;
  return BOND_CAP_BY_RATING[state.budget.creditRating] ?? 0;
}

export function effectiveDebtServiceRate(state: GameState): number {
  const mult = DEBT_RATE_MULT[state.budget.creditRating] ?? 1.4;
  return (
    state.budget.debtServiceRate * mult + state.budget.debtServiceSpike
  );
}

export function clampBondIssuance(
  state: GameState,
  requested: number,
): { allowed: number; rejected: number; reason?: string } {
  const cap = maxBondIssuance(state);
  if (cap <= 0) {
    return {
      allowed: 0,
      rejected: requested,
      reason: "Junk credit — bond market closed",
    };
  }
  if (requested <= cap) {
    return { allowed: requested, rejected: 0 };
  }
  return {
    allowed: cap,
    rejected: requested - cap,
    reason: `Capped at ${cap}M for ${state.budget.creditRating} rating`,
  };
}
