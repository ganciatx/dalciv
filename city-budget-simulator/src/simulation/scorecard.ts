import type { GameState, GradeDimension } from "./types";

function letter(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/** Multi-dimensional 30-year stewardship grades. */
export function computeFinalGrades(state: GameState): GradeDimension[] {
  const last = state.history[state.history.length - 1];
  if (!last) return [];

  const fiscalScore = Math.min(
    100,
    Math.max(
      0,
      50 +
        (last.fundBalance > 50 ? 25 : last.fundBalance > 0 ? 10 : -20) +
        (state.budget.creditRating === "AAA" || state.budget.creditRating === "AA"
          ? 20
          : state.budget.creditRating === "junk"
            ? -30
            : 0) +
        state.systems.pension.fundedRatio * 35,
    ),
  );

  const infraScore = Math.min(100, last.infrastructureCondition * 1.05);
  const affordScore = Math.min(
    100,
    Math.max(0, 100 - last.housingAffordabilityIndex * 220),
  );
  const safetyScore = Math.min(100, Math.max(0, 110 - last.crimeRate));
  const growthScore = Math.min(
    100,
    Math.max(
      0,
      ((last.taxBase / (state.history[0]?.taxBase ?? last.taxBase)) - 0.85) *
        200,
    ),
  );
  const politicsScore = Math.min(
    100,
    Object.values(last.approvals).reduce((s, v) => s + v, 0) / 5,
  );
  const eduScore = Math.min(
    100,
    (last.educationQuality ?? state.systems.education.qualityIndex) * 1.05,
  );
  const devScore = Math.min(
    100,
    40 +
      (last.employerCount ?? 0) * 8 +
      (state.economicDevelopment?.attractiveness ?? 50) * 0.4,
  );

  const dims: Omit<GradeDimension, "letter">[] = [
    {
      id: "fiscal",
      label: "Fiscal sustainability",
      score: Math.round(fiscalScore),
      summary: `Ended at ${state.budget.creditRating} credit, ${Math.round(last.fundBalance)}M fund balance.`,
    },
    {
      id: "infra",
      label: "Infrastructure",
      score: Math.round(infraScore),
      summary: `Network condition ${last.infrastructureCondition}/100.`,
    },
    {
      id: "afford",
      label: "Affordability",
      score: Math.round(affordScore),
      summary: `Rent burden ${(last.housingAffordabilityIndex * 100).toFixed(0)}% of income.`,
    },
    {
      id: "safety",
      label: "Public safety",
      score: Math.round(safetyScore),
      summary: `Crime index ${last.crimeRate}.`,
    },
    {
      id: "growth",
      label: "Economic growth",
      score: Math.round(growthScore),
      summary: `Tax base ${(last.taxBase / 1000).toFixed(1)}B assessed.`,
    },
    {
      id: "education",
      label: "Education",
      score: Math.round(eduScore),
      summary: `School quality index ${Math.round(last.educationQuality ?? eduScore)}/100.`,
    },
    {
      id: "development",
      label: "Economic development",
      score: Math.round(devScore),
      summary: `${last.employerCount ?? 0} employers landed · attractiveness ${Math.round(state.economicDevelopment?.attractiveness ?? 50)}.`,
    },
    {
      id: "politics",
      label: "Political stability",
      score: Math.round(politicsScore),
      summary: "Average faction approval at term end.",
    },
  ];

  return dims.map((d) => ({ ...d, letter: letter(d.score) }));
}
