/** Faction identifiers for the political system. */
export type FactionId =
  | "homeowners"
  | "renters"
  | "business"
  | "employees"
  | "fiscalHawks";

export type EventCategory =
  | "infrastructure"
  | "pension"
  | "housing"
  | "economic"
  | "political"
  | "safety"
  | "education"
  | "capital"
  | "development";

export type CreditRating = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "junk";

export type GamePhase = "playing" | "election" | "ended";

export type EndReason =
  | "fiscal_crisis"
  | "election_loss"
  | "state_takeover"
  | "liquidity_trap"
  | "completed";

export type ScenarioId =
  | "sun-belt-boom"
  | "rust-belt-reckoning"
  | "coastal-squeeze"
  | "fiscal-precipice"
  | "greenfield";

export type Difficulty = "standard" | "hard" | "sandbox";

export type DistrictId = "core" | "growth" | "outer";

/** How citywide maintenance spending is split across districts. */
export type DistrictPriority = "balanced" | "core" | "growth" | "outer";

export type ChallengeId =
  | "none"
  | "no_bonds"
  | "austerity"
  | "coalition_builder";

export interface District {
  id: DistrictId;
  label: string;
  subtitle: string;
  populationShare: number;
  taxBaseShare: number;
  roadCondition: number;
  crimeIndex: number;
  /** Millions/year to hold this district's roads steady. */
  maintenanceNeed: number;
}

export interface FactionQuote {
  factionId: FactionId;
  speakerName: string;
  speakerTitle: string;
  text: string;
  tone: "pleased" | "neutral" | "angry";
}

export type AdvisorId = "fiscal" | "infrastructure" | "development";

export type CampaignStrategy =
  | "balanced"
  | "neighborhoods"
  | "business"
  | "labor"
  | "austerity";

export interface AdvisorState {
  id: AdvisorId;
  trust: number;
  yearsHeeded: number;
  yearsIgnored: number;
}

export interface CampaignManagerState {
  trust: number;
  momentum: number;
  recommendedStrategy: CampaignStrategy;
  yearsHeeded: number;
  yearsIgnored: number;
}

export interface StaffBriefingNote {
  staffId: string;
  title: string;
  heeded: boolean;
}

export interface StaffState {
  advisors: Record<AdvisorId, AdvisorState>;
  campaign: CampaignManagerState;
  lastBriefing: StaffBriefingNote[];
}

export interface StaffAdvice {
  staffId: string;
  role: "advisor" | "campaign";
  title: string;
  detail: string;
  tone: "urgent" | "steady" | "upbeat";
  priority: number;
  recommendation?: Partial<PlayerDecisions>;
  relatedFactions?: FactionId[];
  campaignStrategy?: CampaignStrategy;
}

/** Per-run counters for achievement checks. */
export interface RunStats {
  yearsWithoutBonds: number;
  totalBondsIssued: number;
  consecutiveFullArcYears: number;
  maintenanceBelowHoldYears: number;
  lowestDistrictRoads: number;
  hadRentControlWin: boolean;
}

export type HousingPolicy = "none" | "rentControl" | "inclusionary" | "subsidy";

export type PensionReformChoice =
  | "none"
  | "colaFreeze"
  | "closeDbNewHires"
  | "raiseEmployeeShare";

export interface CityProfile {
  name: string;
  population: number;
  scenarioId: ScenarioId;
}

export interface GameSettings {
  difficulty: Difficulty;
  policyExplainer: boolean;
  challengeId: ChallengeId;
}

export interface PensionReformFlags {
  colaFreeze: boolean;
  closedDbNewHires: boolean;
  raisedEmployeeShare: boolean;
}

/** Annual budget line items (millions USD). */
export interface BudgetState {
  propertyTaxRate: number;
  salesTaxRate: number;
  fundBalance: number;
  rainyDayFund: number;
  bondDebt: number;
  debtServiceRate: number;
  /** Temporary rate spike from random events (resets over time). */
  debtServiceSpike: number;
  consecutiveDeficitYears: number;
  creditRating: CreditRating;
  consumerSpending: number;
  transfers: number;
  baseTransfers: number;
  fees: number;
}

export type RecruitmentFocus =
  | "none"
  | "tech"
  | "logistics"
  | "manufacturing"
  | "hq";

export interface ExpenditureBudget {
  publicSafety: number;
  infrastructureMaintenance: number;
  pensionContribution: number;
  parksLibraries: number;
  administration: number;
  education: number;
  economicDevelopment: number;
  capitalProjects: number;
}

export interface EducationState {
  qualityIndex: number;
  capacityIndex: number;
  perPupilSpending: number;
  enrollment: number;
  graduationRate: number;
  teacherRetention: number;
}

export interface Employer {
  id: string;
  name: string;
  sector: RecruitmentFocus;
  jobs: number;
  taxBaseAdded: number;
  landedYear?: number;
}

export interface EconomicDevelopmentState {
  attractiveness: number;
  employers: Employer[];
  pipelineProgress: number;
  lastRecruitmentFocus: RecruitmentFocus;
  yearsSinceLastLanding: number;
}

export interface CapitalProjectTemplate {
  id: string;
  label: string;
  description: string;
  totalCost: number;
  durationYears: number;
  annualContribution: number;
  benefits: string;
}

export interface ActiveCapitalProject {
  templateId: string;
  label: string;
  spent: number;
  totalCost: number;
  yearsRemaining: number;
  progress: number;
}

export interface CapitalProjectsState {
  active: ActiveCapitalProject | null;
  completedIds: string[];
}

export interface InfrastructureAsset {
  id: string;
  label: string;
  condition: number;
  decayPerYear: number;
  maintenanceToHold: number;
  failureThreshold: number;
  failureCost: number;
}

export interface InfrastructureState {
  assets: InfrastructureAsset[];
  deferredMaintenanceLiability: number;
}

export interface PensionState {
  fundedRatio: number;
  assumedReturn: number;
  annualRequiredContribution: number;
  assets: number;
  liabilities: number;
  underpaymentStreak: number;
}

export interface SafetyState {
  policeStaffing: number;
  fireStaffing: number;
  crimeRate: number;
  responseTimeMinutes: number;
}

export interface HousingState {
  affordabilityIndex: number;
  medianRent: number;
  medianIncome: number;
  zoningReform: "none" | "modest" | "aggressive";
  activePolicy: HousingPolicy;
}

export interface TaxBaseZone {
  id: string;
  label: string;
  assessedValue: number;
  growthRate: number;
  developmentPressure: number;
}

export interface TaxBaseState {
  zones: TaxBaseZone[];
  totalValue: number;
  permitsIssued: number;
  populationTrend: number;
  /** Projected total assessed value in 3 years at current signals. */
  forecastValue3yr: number;
}

export interface PoliticsState {
  approvals: Record<FactionId, number>;
  electionYear: number;
  yearsUntilElection: number;
  coalitionScore: number;
  /** Faction weights for election math (sum = 1). */
  factionWeights: Record<FactionId, number>;
}

export interface DelayedEvent {
  id: string;
  createdYear: number;
  triggerYear: number;
  category: EventCategory;
  description: string;
  fiscalImpact: number;
  canBeMitigated: boolean;
  mitigationCondition?: string;
  sourceDecision?: string;
}

export interface NewspaperEntry {
  year: number;
  headline: string;
  edition: string;
}

export interface YearRecord {
  year: number;
  revenue: number;
  expenditures: number;
  fundBalance: number;
  taxBase: number;
  pensionFundedRatio: number;
  infrastructureCondition: number;
  housingAffordabilityIndex: number;
  crimeRate: number;
  educationQuality: number;
  employerCount: number;
  approvals: Record<FactionId, number>;
  headline: string;
  creditRating: CreditRating;
}

export interface GradeDimension {
  id: string;
  label: string;
  score: number;
  letter: string;
  summary: string;
}

export interface SystemsState {
  infrastructure: InfrastructureState;
  pension: PensionState;
  safety: SafetyState;
  housing: HousingState;
  education: EducationState;
}

export interface GameState {
  year: number;
  maxYears: number;
  phase: GamePhase;
  endReason?: EndReason;
  city: CityProfile;
  settings: GameSettings;
  budget: BudgetState;
  expenditures: ExpenditureBudget;
  systems: SystemsState;
  taxBase: TaxBaseState;
  politics: PoliticsState;
  pensionReforms: PensionReformFlags;
  eventQueue: DelayedEvent[];
  history: YearRecord[];
  newspapers: NewspaperEntry[];
  lastHeadline: string;
  alerts: string[];
  /** Deterministic RNG seed advanced each turn. */
  randomSeed: number;
  /** Sales tax / spending shock multiplier (1 = normal). */
  economicMultiplier: number;
  districts: District[];
  /** Council voices reacting to this year's outcomes. */
  factionQuotes: FactionQuote[];
  /** Prior-year approvals for quote deltas. */
  prevApprovals: Record<FactionId, number>;
  runStats: RunStats;
  economicDevelopment: EconomicDevelopmentState;
  capital: CapitalProjectsState;
  staff: StaffState;
}

/** Player choices submitted each fiscal year. */
export interface PlayerDecisions {
  expenditures: ExpenditureBudget;
  propertyTaxRate: number;
  salesTaxRate: number;
  bondsToIssue: number;
  pensionAssumedReturn: number;
  zoningReform: HousingState["zoningReform"];
  housingPolicy: HousingPolicy;
  pensionReform: PensionReformChoice;
  districtPriority: DistrictPriority;
  recruitmentFocus: RecruitmentFocus;
  /** Start a catalog project when none active. */
  newCapitalProjectId: string | "none";
  /** Election-cycle messaging set with campaign manager. */
  campaignStrategy: CampaignStrategy;
}

export interface TurnResult {
  state: GameState;
  revenue: number;
  expenditures: number;
  surplus: number;
  headline: string;
  electionHeld?: boolean;
  randomEventLabel?: string;
  newlyUnlockedAchievements?: string[];
}
