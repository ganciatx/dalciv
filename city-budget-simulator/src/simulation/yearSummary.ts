import { ACHIEVEMENTS } from "./achievements";
import { FACTION_CHARACTERS } from "./characters";
import { formatMillions, formatPercent } from "./simulate";
import type {
  CreditRating,
  FactionId,
  GameState,
  TurnResult,
} from "./types";

export interface YearSnapshot {
  year: number;
  fundBalance: number;
  creditRating: CreditRating;
  taxBase: number;
  coalitionScore: number;
  infraCondition: number;
  crimeRate: number;
  pensionFundedRatio: number;
  educationQuality: number;
  employerCount: number;
  housingAffordability: number;
  pipelineProgress: number;
  attractiveness: number;
  capitalProgress: number | null;
  capitalLabel: string | null;
  approvals: Record<FactionId, number>;
}

export interface SummaryLine {
  label: string;
  before: string;
  after: string;
  deltaText: string;
  sentiment: "good" | "bad" | "neutral";
}

export interface ApprovalChange {
  factionId: FactionId;
  name: string;
  before: number;
  after: number;
  delta: number;
}

export interface YearSummary {
  closedYear: number;
  newYear: number;
  headline: string;
  surplus: number;
  revenue: number;
  expenditures: number;
  fiscalLines: SummaryLine[];
  metricLines: SummaryLine[];
  approvals: ApprovalChange[];
  highlights: string[];
  alerts: string[];
  achievements: string[];
  electionHeld: boolean;
  randomEventLabel?: string;
  gameEnded: boolean;
  endReason?: string;
}

function avgInfra(state: GameState): number {
  const assets = state.systems.infrastructure.assets;
  if (!assets.length) return 0;
  return Math.round(
    assets.reduce((s, a) => s + a.condition, 0) / assets.length,
  );
}

export function captureYearSnapshot(state: GameState): YearSnapshot {
  const active = state.capital.active;
  return {
    year: state.year,
    fundBalance: state.budget.fundBalance,
    creditRating: state.budget.creditRating,
    taxBase: state.taxBase.totalValue,
    coalitionScore: state.politics.coalitionScore,
    infraCondition: avgInfra(state),
    crimeRate: state.systems.safety.crimeRate,
    pensionFundedRatio: state.systems.pension.fundedRatio,
    educationQuality: Math.round(state.systems.education.qualityIndex),
    employerCount: state.economicDevelopment.employers.length,
    housingAffordability: state.systems.housing.affordabilityIndex,
    pipelineProgress: Math.round(state.economicDevelopment.pipelineProgress),
    attractiveness: Math.round(state.economicDevelopment.attractiveness),
    capitalProgress: active?.progress ?? null,
    capitalLabel: active?.label ?? null,
    approvals: { ...state.politics.approvals },
  };
}

function lineSentiment(
  delta: number,
  upIsGood: boolean,
  threshold = 0,
): "good" | "bad" | "neutral" {
  if (Math.abs(delta) <= threshold) return "neutral";
  const improved = delta > 0 ? upIsGood : !upIsGood;
  return improved ? "good" : "bad";
}

function fmtDelta(delta: number, suffix = "", decimals = 0): string {
  if (Math.abs(delta) < 0.0001) return "—";
  const sign = delta > 0 ? "+" : "−";
  const abs = Math.abs(delta);
  const val =
    decimals > 0 ? abs.toFixed(decimals) : Math.round(abs).toString();
  return `${sign}${val}${suffix}`;
}

function pushMetric(
  lines: SummaryLine[],
  label: string,
  before: number,
  after: number,
  format: (n: number) => string,
  upIsGood: boolean,
  threshold = 0,
  deltaSuffix = "",
  deltaDecimals = 0,
): void {
  const delta = after - before;
  if (Math.abs(delta) <= threshold) return;
  lines.push({
    label,
    before: format(before),
    after: format(after),
    deltaText: fmtDelta(delta, deltaSuffix, deltaDecimals),
    sentiment: lineSentiment(delta, upIsGood, threshold),
  });
}

export function buildYearSummary(
  before: YearSnapshot,
  after: GameState,
  result: TurnResult,
  achievementIds: string[] = [],
): YearSummary {
  const afterSnap = captureYearSnapshot(after);
  const closedYear = before.year;
  const fiscalLines: SummaryLine[] = [];
  const metricLines: SummaryLine[] = [];

  fiscalLines.push({
    label: "Operating surplus",
    before: "—",
    after: formatMillions(result.surplus, true),
    deltaText: result.surplus >= 0 ? "Surplus" : "Deficit",
    sentiment: result.surplus >= 0 ? "good" : "bad",
  });

  pushMetric(
    fiscalLines,
    "Fund balance",
    before.fundBalance,
    afterSnap.fundBalance,
    (n) => formatMillions(n),
    true,
    1,
    "M",
  );

  if (before.creditRating !== afterSnap.creditRating) {
    const rank: Record<CreditRating, number> = {
      junk: 0,
      B: 1,
      BBB: 2,
      A: 3,
      AA: 4,
      AAA: 5,
    };
    const upgraded = rank[afterSnap.creditRating] > rank[before.creditRating];
    fiscalLines.push({
      label: "Credit rating",
      before: before.creditRating,
      after: afterSnap.creditRating,
      deltaText: upgraded ? "Upgrade" : "Downgrade",
      sentiment: upgraded ? "good" : "bad",
    });
  }

  pushMetric(
    metricLines,
    "Tax base",
    before.taxBase,
    afterSnap.taxBase,
    (n) => formatMillions(n),
    true,
    5,
    "M",
  );
  pushMetric(
    metricLines,
    "Infrastructure",
    before.infraCondition,
    afterSnap.infraCondition,
    (n) => `${n}/100`,
    true,
    1,
  );
  pushMetric(
    metricLines,
    "Crime index",
    before.crimeRate,
    afterSnap.crimeRate,
    (n) => `${n}`,
    false,
    1,
  );
  pushMetric(
    metricLines,
    "Pension funded",
    before.pensionFundedRatio,
    afterSnap.pensionFundedRatio,
    (n) => formatPercent(n, 0),
    true,
    0.005,
    "",
    0,
  );
  pushMetric(
    metricLines,
    "School quality",
    before.educationQuality,
    afterSnap.educationQuality,
    (n) => `${n}/100`,
    true,
    1,
  );
  pushMetric(
    metricLines,
    "Employers landed",
    before.employerCount,
    afterSnap.employerCount,
    (n) => `${n}`,
    true,
    0,
  );
  pushMetric(
    metricLines,
    "EDC pipeline",
    before.pipelineProgress,
    afterSnap.pipelineProgress,
    (n) => `${n}%`,
    true,
    3,
    "%",
  );
  pushMetric(
    metricLines,
    "Coalition score",
    before.coalitionScore,
    afterSnap.coalitionScore,
    (n) => `${n}%`,
    true,
    1,
    "%",
  );
  pushMetric(
    metricLines,
    "Rent burden",
    before.housingAffordability,
    afterSnap.housingAffordability,
    (n) => formatPercent(n, 0),
    false,
    0.005,
  );

  const approvals: ApprovalChange[] = (
    Object.keys(before.approvals) as FactionId[]
  )
    .map((factionId) => {
      const prev = before.approvals[factionId];
      const next = afterSnap.approvals[factionId];
      return {
        factionId,
        name: FACTION_CHARACTERS[factionId].name.split(" ")[0],
        before: prev,
        after: next,
        delta: next - prev,
      };
    })
    .filter((a) => Math.abs(a.delta) >= 1)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const highlights: string[] = [];
  const newEmployers = after.economicDevelopment.employers.filter(
    (e) => e.landedYear === closedYear,
  );
  for (const emp of newEmployers) {
    highlights.push(
      `${emp.name} landed (${emp.jobs.toLocaleString()} jobs, +${formatMillions(emp.taxBaseAdded)} tax base)`,
    );
  }

  if (!before.capitalLabel && after.capital.active) {
    highlights.push(`Capital project started: ${after.capital.active.label}`);
  } else if (before.capitalLabel && !after.capital.active) {
    highlights.push(`Capital project completed`);
  } else if (
    before.capitalLabel &&
    after.capital.active &&
    after.capital.active.progress !== before.capitalProgress
  ) {
    highlights.push(
      `${after.capital.active.label}: ${before.capitalProgress ?? 0}% → ${after.capital.active.progress}%`,
    );
  }

  const achievements = achievementIds.map(
    (id) => ACHIEVEMENTS.find((a) => a.id === id)?.title ?? id,
  );

  for (const note of after.staff?.lastBriefing ?? []) {
    if (note.heeded) {
      highlights.push(`Staff: followed ${note.title}`);
    } else {
      highlights.push(`Staff: overrode ${note.title}`);
    }
  }

  return {
    closedYear,
    newYear: after.year,
    headline: result.headline,
    surplus: result.surplus,
    revenue: result.revenue,
    expenditures: result.expenditures,
    fiscalLines,
    metricLines,
    approvals,
    highlights,
    alerts: [...result.state.alerts],
    achievements,
    electionHeld: Boolean(result.electionHeld),
    randomEventLabel: result.randomEventLabel,
    gameEnded: after.phase === "ended",
    endReason: after.endReason,
  };
}
