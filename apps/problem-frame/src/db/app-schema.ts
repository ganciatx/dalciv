import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { organization, user } from "./auth-schema";

/** Products — scoped to one org (single-company deployment; org isolates data). */
export const products = sqliteTable(
  "products",
  {
    id: integer("product_id").primaryKey({ autoIncrement: true }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    productName: text("product_name", { length: 100 }).notNull(),
    productCode: text("product_code", { length: 20 }).notNull(),
    productCategory: text("product_category", { length: 50 }),
    launchDate: text("launch_date"),
    status: text("status", { length: 20 }).notNull().default("Active"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (t) => [index("products_org_idx").on(t.organizationId)],
);

export const personas = sqliteTable(
  "personas",
  {
    id: integer("persona_id").primaryKey({ autoIncrement: true }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    personaName: text("persona_name", { length: 100 }).notNull(),
    description: text("description"),
    goals: text("goals"),
    behaviors: text("behaviors"),
    contextOfUse: text("context_of_use"),
    techSavviness: text("tech_savviness", { length: 20 }),
    customerSegment: text("customer_segment", { length: 50 }),
    createdDate: text("created_date"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (t) => [index("personas_org_idx").on(t.organizationId)],
);

export const painPoints = sqliteTable(
  "pain_points",
  {
    id: integer("pain_point_id").primaryKey({ autoIncrement: true }),
    personaId: integer("persona_id")
      .notNull()
      .references(() => personas.id, { onDelete: "cascade" }),
    painPointText: text("pain_point_text").notNull(),
    severity: integer("severity").notNull(),
    frequency: text("frequency", { length: 20 }),
  },
  (t) => [index("pain_points_persona_idx").on(t.personaId)],
);

export const problemFrames = sqliteTable(
  "problem_frames",
  {
    id: integer("frame_id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    personaId: integer("persona_id")
      .notNull()
      .references(() => personas.id, { onDelete: "cascade" }),
    frameTitle: text("frame_title", { length: 200 }).notNull(),
    problemStatement: text("problem_statement"),
    status: text("status", { length: 20 }).notNull().default("Draft"),
    createdDate: text("created_date"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    lastUpdated: integer("last_updated", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    version: integer("version").notNull().default(1),
  },
  (t) => [
    index("problem_frames_product_idx").on(t.productId),
    index("problem_frames_persona_idx").on(t.personaId),
  ],
);

/** Full snapshot history for a frame (JSON blob for restore/compare). */
export const problemFrameVersions = sqliteTable(
  "problem_frame_versions",
  {
    id: integer("version_row_id").primaryKey({ autoIncrement: true }),
    frameId: integer("frame_id")
      .notNull()
      .references(() => problemFrames.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    label: text("label", { length: 200 }),
    snapshotJson: text("snapshot_json").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (t) => [index("frame_versions_frame_idx").on(t.frameId)],
);

export const desiredOutcomes = sqliteTable(
  "desired_outcomes",
  {
    id: integer("outcome_id").primaryKey({ autoIncrement: true }),
    frameId: integer("frame_id")
      .notNull()
      .references(() => problemFrames.id, { onDelete: "cascade" }),
    outcomeText: text("outcome_text").notNull(),
    priorityRank: integer("priority_rank"),
    jtbdCategory: text("jtbd_category", { length: 50 }),
  },
  (t) => [index("desired_outcomes_frame_idx").on(t.frameId)],
);

export const barriers = sqliteTable(
  "barriers",
  {
    id: integer("barrier_id").primaryKey({ autoIncrement: true }),
    frameId: integer("frame_id")
      .notNull()
      .references(() => problemFrames.id, { onDelete: "cascade" }),
    barrierCategory: text("barrier_category", { length: 50 }),
    barrierText: text("barrier_text").notNull(),
    impactPercentage: real("impact_percentage"),
    severity: text("severity", { length: 20 }),
    /** How often users hit this barrier (e.g. Rare … Often). */
    frequency: text("frequency", { length: 30 }),
    evidenceCount: integer("evidence_count").default(0),
  },
  (t) => [index("barriers_frame_idx").on(t.frameId)],
);

export const rootCauses = sqliteTable(
  "root_causes",
  {
    id: integer("cause_id").primaryKey({ autoIncrement: true }),
    barrierId: integer("barrier_id")
      .notNull()
      .references(() => barriers.id, { onDelete: "cascade" }),
    causeText: text("cause_text").notNull(),
    causeType: text("cause_type", { length: 30 }),
    validated: integer("validated", { mode: "boolean" }).default(false),
    validationMethod: text("validation_method", { length: 100 }),
  },
  (t) => [index("root_causes_barrier_idx").on(t.barrierId)],
);

export const emotionalImpacts = sqliteTable(
  "emotional_impacts",
  {
    id: integer("emotion_id").primaryKey({ autoIncrement: true }),
    frameId: integer("frame_id")
      .notNull()
      .references(() => problemFrames.id, { onDelete: "cascade" }),
    emotionText: text("emotion_text").notNull(),
    emotionCategory: text("emotion_category", { length: 30 }),
    intensity: integer("intensity"),
  },
  (t) => [index("emotional_impacts_frame_idx").on(t.frameId)],
);

export const frameConstraints = sqliteTable(
  "frame_constraints",
  {
    id: integer("constraint_id").primaryKey({ autoIncrement: true }),
    frameId: integer("frame_id")
      .notNull()
      .references(() => problemFrames.id, { onDelete: "cascade" }),
    constraintType: text("constraint_type", { length: 30 }),
    constraintText: text("constraint_text").notNull(),
    isModifiable: integer("is_modifiable", { mode: "boolean" }).default(true),
  },
  (t) => [index("frame_constraints_frame_idx").on(t.frameId)],
);

export const assumptions = sqliteTable(
  "assumptions",
  {
    id: integer("assumption_id").primaryKey({ autoIncrement: true }),
    frameId: integer("frame_id")
      .notNull()
      .references(() => problemFrames.id, { onDelete: "cascade" }),
    assumptionCode: text("assumption_code", { length: 10 }),
    assumptionText: text("assumption_text").notNull(),
    validationStatus: text("validation_status", { length: 20 }),
    validationDate: text("validation_date"),
    validationNotes: text("validation_notes"),
  },
  (t) => [index("assumptions_frame_idx").on(t.frameId)],
);

export const hypotheses = sqliteTable(
  "hypotheses",
  {
    id: integer("hypothesis_id").primaryKey({ autoIncrement: true }),
    frameId: integer("frame_id")
      .notNull()
      .references(() => problemFrames.id, { onDelete: "cascade" }),
    barrierId: integer("barrier_id")
      .notNull()
      .references(() => barriers.id, { onDelete: "cascade" }),
    hypothesisTitle: text("hypothesis_title", { length: 200 }).notNull(),
    ifStatement: text("if_statement"),
    thenStatement: text("then_statement"),
    becauseStatement: text("because_statement"),
    priority: integer("priority"),
    effort: text("effort", { length: 20 }),
    impact: text("impact", { length: 20 }),
    confidence: text("confidence", { length: 20 }),
    status: text("status", { length: 20 }).default("Proposed"),
  },
  (t) => [
    index("hypotheses_frame_idx").on(t.frameId),
    index("hypotheses_barrier_idx").on(t.barrierId),
  ],
);

export const hypothesisMetrics = sqliteTable(
  "hypothesis_metrics",
  {
    id: integer("metric_id").primaryKey({ autoIncrement: true }),
    hypothesisId: integer("hypothesis_id")
      .notNull()
      .references(() => hypotheses.id, { onDelete: "cascade" }),
    metricName: text("metric_name", { length: 100 }).notNull(),
    baselineValue: text("baseline_value", { length: 50 }),
    targetValue: text("target_value", { length: 50 }),
    measurementMethod: text("measurement_method"),
    actualValue: text("actual_value", { length: 50 }),
  },
  (t) => [index("hypothesis_metrics_hypothesis_idx").on(t.hypothesisId)],
);

export const customerFeedback = sqliteTable(
  "customer_feedback",
  {
    id: integer("feedback_id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    responseDate: text("response_date"),
    questionType: text("question_type", { length: 100 }),
    commentText: text("comment_text").notNull(),
    theme: text("theme", { length: 100 }),
    sentiment: text("sentiment", { length: 20 }),
    groupTag: text("group_tag", { length: 50 }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (t) => [index("customer_feedback_product_idx").on(t.productId)],
);

/**
 * Learning Plan — a standalone assumption-testing board (org-scoped, optionally
 * linked to a product). Header carries ideal state + client problem; children are
 * assumptions (Critical Assumptions / Leaps of Faith) and their experiment rows.
 */
export const learningPlans = sqliteTable(
  "learning_plans",
  {
    id: integer("learning_plan_id").primaryKey({ autoIncrement: true }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    planName: text("plan_name", { length: 200 }).notNull(),
    timeframe: text("timeframe", { length: 50 }),
    idealState: text("ideal_state"),
    clientProblem: text("client_problem"),
    status: text("status", { length: 20 }).notNull().default("Active"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    lastUpdated: integer("last_updated", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (t) => [
    index("learning_plans_org_idx").on(t.organizationId),
    index("learning_plans_product_idx").on(t.productId),
  ],
);

/** Key Unknowns: Critical Assumptions (CA) and Leaps of Faith (LOF). */
export const learningPlanAssumptions = sqliteTable(
  "learning_plan_assumptions",
  {
    id: integer("assumption_id").primaryKey({ autoIncrement: true }),
    learningPlanId: integer("learning_plan_id")
      .notNull()
      .references(() => learningPlans.id, { onDelete: "cascade" }),
    /** "CA" (Critical Assumption) or "LOF" (Leap of Faith). */
    assumptionType: text("assumption_type", { length: 10 })
      .notNull()
      .default("CA"),
    assumptionText: text("assumption_text").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("lp_assumptions_plan_idx").on(t.learningPlanId),
  ],
);

/** Experiment rows in the matrix beneath a Critical Assumption. */
export const learningPlanExperiments = sqliteTable(
  "learning_plan_experiments",
  {
    id: integer("experiment_id").primaryKey({ autoIncrement: true }),
    assumptionId: integer("assumption_id")
      .notNull()
      .references(() => learningPlanAssumptions.id, { onDelete: "cascade" }),
    /** "Go Learn" or "Go Do". */
    mode: text("mode", { length: 20 }).notNull().default("Go Learn"),
    hypothesis: text("hypothesis"),
    experiment: text("experiment"),
    timeline: text("timeline", { length: 100 }),
    measure: text("measure"),
    results: text("results"),
    driverGroup: text("driver_group", { length: 100 }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("lp_experiments_assumption_idx").on(t.assumptionId),
  ],
);

export const feedbackBarrierLink = sqliteTable(
  "feedback_barrier_link",
  {
    id: integer("link_id").primaryKey({ autoIncrement: true }),
    feedbackId: integer("feedback_id")
      .notNull()
      .references(() => customerFeedback.id, { onDelete: "cascade" }),
    barrierId: integer("barrier_id")
      .notNull()
      .references(() => barriers.id, { onDelete: "cascade" }),
    relevanceScore: real("relevance_score"),
  },
  (t) => [
    index("fbl_feedback_idx").on(t.feedbackId),
    index("fbl_barrier_idx").on(t.barrierId),
  ],
);

/* Relations (for Drizzle joins / Better Auth experimental.joins if extended) */
export const productsRelations = relations(products, ({ many, one }) => ({
  organization: one(organization, {
    fields: [products.organizationId],
    references: [organization.id],
  }),
  frames: many(problemFrames),
  feedback: many(customerFeedback),
}));

export const personasRelations = relations(personas, ({ many, one }) => ({
  organization: one(organization, {
    fields: [personas.organizationId],
    references: [organization.id],
  }),
  painPoints: many(painPoints),
  frames: many(problemFrames),
}));

export const painPointsRelations = relations(painPoints, ({ one }) => ({
  persona: one(personas, {
    fields: [painPoints.personaId],
    references: [personas.id],
  }),
}));

export const desiredOutcomesRelations = relations(desiredOutcomes, ({ one }) => ({
  frame: one(problemFrames, {
    fields: [desiredOutcomes.frameId],
    references: [problemFrames.id],
  }),
}));

export const emotionalImpactsRelations = relations(emotionalImpacts, ({ one }) => ({
  frame: one(problemFrames, {
    fields: [emotionalImpacts.frameId],
    references: [problemFrames.id],
  }),
}));

export const frameConstraintsRelations = relations(frameConstraints, ({ one }) => ({
  frame: one(problemFrames, {
    fields: [frameConstraints.frameId],
    references: [problemFrames.id],
  }),
}));

export const assumptionsRelations = relations(assumptions, ({ one }) => ({
  frame: one(problemFrames, {
    fields: [assumptions.frameId],
    references: [problemFrames.id],
  }),
}));

export const problemFrameVersionsRelations = relations(
  problemFrameVersions,
  ({ one }) => ({
    frame: one(problemFrames, {
      fields: [problemFrameVersions.frameId],
      references: [problemFrames.id],
    }),
  }),
);

export const rootCausesRelations = relations(rootCauses, ({ one }) => ({
  barrier: one(barriers, {
    fields: [rootCauses.barrierId],
    references: [barriers.id],
  }),
}));

export const hypothesisMetricsRelations = relations(hypothesisMetrics, ({ one }) => ({
  hypothesis: one(hypotheses, {
    fields: [hypothesisMetrics.hypothesisId],
    references: [hypotheses.id],
  }),
}));

export const customerFeedbackRelations = relations(customerFeedback, ({ one, many }) => ({
  product: one(products, {
    fields: [customerFeedback.productId],
    references: [products.id],
  }),
  barrierLinks: many(feedbackBarrierLink),
}));

export const feedbackBarrierLinkRelations = relations(feedbackBarrierLink, ({ one }) => ({
  feedback: one(customerFeedback, {
    fields: [feedbackBarrierLink.feedbackId],
    references: [customerFeedback.id],
  }),
  barrier: one(barriers, {
    fields: [feedbackBarrierLink.barrierId],
    references: [barriers.id],
  }),
}));

export const problemFramesRelations = relations(
  problemFrames,
  ({ one, many }) => ({
    product: one(products, {
      fields: [problemFrames.productId],
      references: [products.id],
    }),
    persona: one(personas, {
      fields: [problemFrames.personaId],
      references: [personas.id],
    }),
    versions: many(problemFrameVersions),
    outcomes: many(desiredOutcomes),
    barriers: many(barriers),
    emotionalImpacts: many(emotionalImpacts),
    constraints: many(frameConstraints),
    assumptions: many(assumptions),
    hypotheses: many(hypotheses),
  }),
);

export const barriersRelations = relations(barriers, ({ one, many }) => ({
  frame: one(problemFrames, {
    fields: [barriers.frameId],
    references: [problemFrames.id],
  }),
  rootCauses: many(rootCauses),
  hypotheses: many(hypotheses),
  feedbackLinks: many(feedbackBarrierLink),
}));

export const hypothesesRelations = relations(hypotheses, ({ one, many }) => ({
  frame: one(problemFrames, {
    fields: [hypotheses.frameId],
    references: [problemFrames.id],
  }),
  barrier: one(barriers, {
    fields: [hypotheses.barrierId],
    references: [barriers.id],
  }),
  metrics: many(hypothesisMetrics),
}));

export const learningPlansRelations = relations(
  learningPlans,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [learningPlans.organizationId],
      references: [organization.id],
    }),
    product: one(products, {
      fields: [learningPlans.productId],
      references: [products.id],
    }),
    assumptions: many(learningPlanAssumptions),
  }),
);

export const learningPlanAssumptionsRelations = relations(
  learningPlanAssumptions,
  ({ one, many }) => ({
    plan: one(learningPlans, {
      fields: [learningPlanAssumptions.learningPlanId],
      references: [learningPlans.id],
    }),
    experiments: many(learningPlanExperiments),
  }),
);

export const learningPlanExperimentsRelations = relations(
  learningPlanExperiments,
  ({ one }) => ({
    assumption: one(learningPlanAssumptions, {
      fields: [learningPlanExperiments.assumptionId],
      references: [learningPlanAssumptions.id],
    }),
  }),
);
