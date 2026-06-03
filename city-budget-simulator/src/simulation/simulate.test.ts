import { describe, expect, it, beforeEach } from "vitest";
import { maxBondIssuance } from "./credit";
import { resetEventCounter } from "./events";
import { seededRandom } from "./randomEvents";
import {
  createScenarioState,
  createSunBeltBoomState,
  defaultDecisions,
} from "./scenarios";
import { computeFinalGrades } from "./scorecard";
import { projectTurnBalance, simulateTurn } from "./simulate";
import { buildYearSummary, captureYearSnapshot } from "./yearSummary";
import { educationHoldSteadySpend } from "./education";
import { generateStaffAdvice } from "./staff";
import type { PlayerDecisions } from "./types";

beforeEach(() => {
  resetEventCounter(0);
});

describe("simulateTurn", () => {
  it("advances year and records history on balanced budget", () => {
    const state = createSunBeltBoomState();
    const result = simulateTurn(state, defaultDecisions(state));
    expect(result.state.year).toBe(2026);
    expect(result.state.history).toHaveLength(1);
    const summary = buildYearSummary(
      captureYearSnapshot(state),
      result.state,
      result,
    );
    expect(summary.closedYear).toBe(state.year);
    expect(summary.newYear).toBe(state.year + 1);
    expect(summary.headline).toBeTruthy();
    expect(summary.fiscalLines.length).toBeGreaterThan(0);
    expect(result.state.history[0].creditRating).toBeDefined();
    expect(result.state.newspapers.length).toBeGreaterThan(0);
    expect(result.state.phase).toBe("playing");
  });

  it("queues infrastructure failure when maintenance is slashed", () => {
    const state = createSunBeltBoomState();
    const decisions: PlayerDecisions = {
      ...defaultDecisions(state),
      expenditures: {
        ...state.expenditures,
        infrastructureMaintenance: 40,
      },
    };
    const result = simulateTurn(state, decisions);
    expect(
      result.state.eventQueue.some((e) => e.category === "infrastructure"),
    ).toBe(true);
    expect(result.state.eventQueue[0].createdYear).toBe(state.year);
  });

  it("ends game on sustained fiscal crisis", () => {
    const state = createSunBeltBoomState();
    state.budget.fundBalance = -55;
    state.budget.creditRating = "junk";
    state.budget.consecutiveDeficitYears = 4;

    const overspend: PlayerDecisions = {
      ...defaultDecisions(state),
      expenditures: {
        publicSafety: 520,
        infrastructureMaintenance: 160,
        pensionContribution: 220,
        parksLibraries: 90,
        administration: 180,
        education: 280,
        economicDevelopment: 65,
        capitalProjects: 45,
      },
      bondsToIssue: 0,
      propertyTaxRate: 0.009,
      salesTaxRate: 0.015,
      pensionAssumedReturn: 0.07,
      zoningReform: "none",
      housingPolicy: "none",
      pensionReform: "none",
      districtPriority: "balanced",
      recruitmentFocus: "hq",
      newCapitalProjectId: "convention-center",
      campaignStrategy: "balanced",
    };

    const result = simulateTurn(state, overspend);
    expect(result.state.phase).toBe("ended");
    expect(result.state.endReason).toBe("fiscal_crisis");
  });

  it("caps bond issuance by credit rating", () => {
    const state = createScenarioState("fiscal-precipice");
    expect(maxBondIssuance(state)).toBeLessThan(80);
    const junk = createScenarioState("fiscal-precipice");
    junk.budget.creditRating = "junk";
    expect(maxBondIssuance(junk)).toBe(0);
  });
});

describe("scenarios", () => {
  it("starts sun belt with a manageable default structural gap", () => {
    const state = createSunBeltBoomState();
    const projected = projectTurnBalance(state, defaultDecisions(state));
    expect(projected.surplus).toBeGreaterThan(-45);
    expect(projected.surplus).toBeLessThan(15);
  });

  it("survives three years on default sun belt budget", () => {
    let state = createSunBeltBoomState();
    for (let i = 0; i < 3; i++) {
      const result = simulateTurn(state, defaultDecisions(state));
      state = result.state;
      expect(state.phase).toBe("playing");
    }
    expect(state.budget.fundBalance).toBeGreaterThan(-80);
  });

  it("creates distinct rust belt pension stress", () => {
    const state = createScenarioState("rust-belt-reckoning");
    expect(state.systems.pension.fundedRatio).toBeLessThan(0.6);
    expect(state.taxBase.populationTrend).toBeLessThan(0);
  });

  it("sandbox mode uses 15-year term", () => {
    const state = createScenarioState("greenfield", "sandbox");
    expect(state.maxYears).toBe(15);
  });
});

describe("districts", () => {
  it("degrades outer district when maintenance prioritized away", () => {
    const state = createScenarioState("sun-belt-boom");
    const outerBefore = state.districts.find((d) => d.id === "outer")!.roadCondition;
    const result = simulateTurn(state, {
      ...defaultDecisions(state),
      expenditures: {
        ...state.expenditures,
        infrastructureMaintenance: 20,
      },
      districtPriority: "core",
    });
    const outerAfter = result.state.districts.find((d) => d.id === "outer")!
      .roadCondition;
    expect(outerAfter).toBeLessThan(outerBefore);
  });
});

describe("scorecard", () => {
  it("returns grades after a completed term", () => {
    let state = createScenarioState("greenfield", "sandbox");
    for (let i = 0; i < 15; i++) {
      state = simulateTurn(state, defaultDecisions(state)).state;
    }
    const grades = computeFinalGrades(state);
    expect(grades.length).toBe(8);
    expect(grades[0].letter).toMatch(/[A-F]/);
  });
});

describe("educationHoldSteadySpend", () => {
  it("returns millions scaled per 10k students, not raw enrollment", () => {
    expect(educationHoldSteadySpend(185_000)).toBe(207);
    expect(educationHoldSteadySpend(185_000)).toBeLessThan(350);
    expect(educationHoldSteadySpend(185_000)).toBeGreaterThan(150);
  });
});

describe("staff", () => {
  it("does not flag default education funding as a multi-thousand-million gap", () => {
    const state = createSunBeltBoomState();
    const draft = defaultDecisions(state);
    const dev = generateStaffAdvice(state, draft).find(
      (a) => a.staffId === "development",
    );
    expect(dev?.tone).toBe("steady");
    expect(dev?.detail ?? "").not.toMatch(/\d{4,}M below hold-steady/);
  });

  it("shows a realistic gap when education is severely underfunded", () => {
    const state = createSunBeltBoomState();
    const draft = defaultDecisions(state);
    draft.expenditures.education = 50;
    const dev = generateStaffAdvice(state, draft).find(
      (a) => a.staffId === "development",
    );
    expect(dev?.title).toBe("Restore classroom funding");
    expect(dev?.detail).toMatch(/\$1\d{2}M below hold-steady/);
    expect(dev?.detail).not.toContain("22000");
  });

  it("generates policy and campaign advice from draft", () => {
    const state = createSunBeltBoomState();
    const draft = defaultDecisions(state);
    draft.expenditures.infrastructureMaintenance = 30;
    const advice = generateStaffAdvice(state, draft);
    expect(advice.length).toBe(4);
    expect(advice.some((a) => a.role === "campaign")).toBe(true);
    expect(advice.some((a) => a.staffId === "infrastructure" && a.tone === "urgent")).toBe(
      true,
    );
  });
});

describe("randomEvents", () => {
  it("seeded RNG is deterministic", () => {
    const a = seededRandom(100);
    const b = seededRandom(100);
    expect(a.value).toBe(b.value);
  });
});
