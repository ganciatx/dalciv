"use server";

import { eq, and, count, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  learningPlans,
  learningPlanAssumptions,
  learningPlanExperiments,
  products,
} from "@/db/schema";
import { requireOrgSession } from "@/lib/require-org";

// --- Learning plans ---

export async function listLearningPlansForOrg() {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const plans = await db.query.learningPlans.findMany({
    where: eq(learningPlans.organizationId, orgId),
    orderBy: (p, { desc }) => [desc(p.lastUpdated)],
    with: { product: true },
  });
  if (plans.length === 0) return [];
  const ids = plans.map((p) => p.id);
  const assumptionRows = await db
    .select({ planId: learningPlanAssumptions.learningPlanId, n: count() })
    .from(learningPlanAssumptions)
    .where(inArray(learningPlanAssumptions.learningPlanId, ids))
    .groupBy(learningPlanAssumptions.learningPlanId);
  const assumptionCount = new Map(assumptionRows.map((r) => [r.planId, r.n]));
  return plans.map((p) => ({
    ...p,
    assumptionCount: assumptionCount.get(p.id) ?? 0,
  }));
}

export async function getLearningPlanForOrg(planId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const plan = await db.query.learningPlans.findFirst({
    where: and(
      eq(learningPlans.id, planId),
      eq(learningPlans.organizationId, orgId),
    ),
    with: {
      product: true,
      assumptions: {
        orderBy: (a, { asc }) => [asc(a.sortOrder), asc(a.id)],
        with: {
          experiments: {
            orderBy: (e, { asc }) => [asc(e.sortOrder), asc(e.id)],
          },
        },
      },
    },
  });
  return plan ?? null;
}

export async function createLearningPlan(formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const planName = String(formData.get("planName") ?? "").trim();
  if (!planName) throw new Error("Plan name is required.");
  const productIdRaw = String(formData.get("productId") ?? "").trim();
  let productId: number | null = null;
  if (productIdRaw) {
    const parsed = Number(productIdRaw);
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, parsed),
        eq(products.organizationId, orgId),
      ),
    });
    if (!product) throw new Error("Product not found.");
    productId = parsed;
  }
  const [inserted] = await db
    .insert(learningPlans)
    .values({
      organizationId: orgId,
      productId,
      planName,
      timeframe: String(formData.get("timeframe") ?? "").trim() || null,
      idealState: String(formData.get("idealState") ?? "").trim() || null,
      clientProblem: String(formData.get("clientProblem") ?? "").trim() || null,
      status: String(formData.get("status") ?? "Active"),
      createdByUserId: session.user.id,
      lastUpdated: new Date(),
    })
    .returning({ id: learningPlans.id });
  revalidatePath("/learning-plans");
  return inserted.id;
}

export async function updateLearningPlan(
  planId: number,
  patch: {
    planName?: string;
    timeframe?: string | null;
    idealState?: string | null;
    clientProblem?: string | null;
    status?: string;
    productId?: number | null;
  },
) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  await assertPlanInOrg(planId, orgId);
  if (patch.productId != null) {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, patch.productId),
        eq(products.organizationId, orgId),
      ),
    });
    if (!product) throw new Error("Product not found.");
  }
  const updates: Partial<typeof learningPlans.$inferInsert> = {
    lastUpdated: new Date(),
  };
  if (patch.planName !== undefined) updates.planName = patch.planName;
  if (patch.timeframe !== undefined) updates.timeframe = patch.timeframe;
  if (patch.idealState !== undefined) updates.idealState = patch.idealState;
  if (patch.clientProblem !== undefined) {
    updates.clientProblem = patch.clientProblem;
  }
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.productId !== undefined) updates.productId = patch.productId;
  await db.update(learningPlans).set(updates).where(eq(learningPlans.id, planId));
  revalidatePath("/learning-plans");
  revalidatePath(`/learning-plans/${planId}`);
}

export async function deleteLearningPlan(planId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  await assertPlanInOrg(planId, orgId);
  await db.delete(learningPlans).where(eq(learningPlans.id, planId));
  revalidatePath("/learning-plans");
}

// --- Assumptions (Key Unknowns: CA / LOF) ---

export async function addAssumptionRow(planId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  await assertPlanInOrg(planId, orgId);
  const assumptionText = String(formData.get("assumptionText") ?? "").trim();
  if (!assumptionText) throw new Error("Assumption text required.");
  const assumptionType =
    String(formData.get("assumptionType") ?? "CA").trim() === "LOF"
      ? "LOF"
      : "CA";
  const nextOrder = await nextAssumptionOrder(planId);
  await db.insert(learningPlanAssumptions).values({
    learningPlanId: planId,
    assumptionType,
    assumptionText,
    sortOrder: nextOrder,
  });
  await touchPlan(planId);
  revalidatePath(`/learning-plans/${planId}`);
}

export async function updateAssumptionRow(
  assumptionId: number,
  formData: FormData,
) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireAssumptionAccess(assumptionId, orgId);
  const assumptionText = String(formData.get("assumptionText") ?? "").trim();
  if (!assumptionText) throw new Error("Assumption text required.");
  const assumptionType =
    String(formData.get("assumptionType") ?? "CA").trim() === "LOF"
      ? "LOF"
      : "CA";
  await db
    .update(learningPlanAssumptions)
    .set({ assumptionText, assumptionType })
    .where(eq(learningPlanAssumptions.id, assumptionId));
  await touchPlan(ctx.planId);
  revalidatePath(`/learning-plans/${ctx.planId}`);
}

export async function deleteAssumptionRow(assumptionId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireAssumptionAccess(assumptionId, orgId);
  await db
    .delete(learningPlanAssumptions)
    .where(eq(learningPlanAssumptions.id, assumptionId));
  await touchPlan(ctx.planId);
  revalidatePath(`/learning-plans/${ctx.planId}`);
}

// --- Experiments (matrix rows under a CA) ---

export async function addExperimentRow(
  assumptionId: number,
  formData: FormData,
) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireAssumptionAccess(assumptionId, orgId);
  const nextOrder = await nextExperimentOrder(assumptionId);
  await db.insert(learningPlanExperiments).values({
    assumptionId,
    mode: normalizeMode(formData.get("mode")),
    hypothesis: String(formData.get("hypothesis") ?? "").trim() || null,
    experiment: String(formData.get("experiment") ?? "").trim() || null,
    timeline: String(formData.get("timeline") ?? "").trim() || null,
    measure: String(formData.get("measure") ?? "").trim() || null,
    results: String(formData.get("results") ?? "").trim() || null,
    driverGroup: String(formData.get("driverGroup") ?? "").trim() || null,
    sortOrder: nextOrder,
  });
  await touchPlan(ctx.planId);
  revalidatePath(`/learning-plans/${ctx.planId}`);
}

export async function updateExperimentRow(
  experimentId: number,
  formData: FormData,
) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireExperimentAccess(experimentId, orgId);
  await db
    .update(learningPlanExperiments)
    .set({
      mode: normalizeMode(formData.get("mode")),
      hypothesis: String(formData.get("hypothesis") ?? "").trim() || null,
      experiment: String(formData.get("experiment") ?? "").trim() || null,
      timeline: String(formData.get("timeline") ?? "").trim() || null,
      measure: String(formData.get("measure") ?? "").trim() || null,
      results: String(formData.get("results") ?? "").trim() || null,
      driverGroup: String(formData.get("driverGroup") ?? "").trim() || null,
    })
    .where(eq(learningPlanExperiments.id, experimentId));
  await touchPlan(ctx.planId);
  revalidatePath(`/learning-plans/${ctx.planId}`);
}

export async function deleteExperimentRow(experimentId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireExperimentAccess(experimentId, orgId);
  await db
    .delete(learningPlanExperiments)
    .where(eq(learningPlanExperiments.id, experimentId));
  await touchPlan(ctx.planId);
  revalidatePath(`/learning-plans/${ctx.planId}`);
}

// --- Helpers ---

function normalizeMode(raw: FormDataEntryValue | null): string {
  return String(raw ?? "Go Learn").trim() === "Go Do" ? "Go Do" : "Go Learn";
}

async function nextAssumptionOrder(planId: number) {
  const rows = await db
    .select({ n: count() })
    .from(learningPlanAssumptions)
    .where(eq(learningPlanAssumptions.learningPlanId, planId));
  return rows[0]?.n ?? 0;
}

async function nextExperimentOrder(assumptionId: number) {
  const rows = await db
    .select({ n: count() })
    .from(learningPlanExperiments)
    .where(eq(learningPlanExperiments.assumptionId, assumptionId));
  return rows[0]?.n ?? 0;
}

async function touchPlan(planId: number) {
  await db
    .update(learningPlans)
    .set({ lastUpdated: new Date() })
    .where(eq(learningPlans.id, planId));
}

async function assertPlanInOrg(planId: number, orgId: string) {
  const plan = await db.query.learningPlans.findFirst({
    where: eq(learningPlans.id, planId),
  });
  if (!plan || plan.organizationId !== orgId) {
    throw new Error("Learning plan not found.");
  }
  return plan;
}

async function requireAssumptionAccess(assumptionId: number, orgId: string) {
  const row = await db.query.learningPlanAssumptions.findFirst({
    where: eq(learningPlanAssumptions.id, assumptionId),
    with: { plan: true },
  });
  if (!row || row.plan.organizationId !== orgId) {
    throw new Error("Not found.");
  }
  return { planId: row.learningPlanId };
}

async function requireExperimentAccess(experimentId: number, orgId: string) {
  const row = await db.query.learningPlanExperiments.findFirst({
    where: eq(learningPlanExperiments.id, experimentId),
    with: { assumption: { with: { plan: true } } },
  });
  if (!row || row.assumption.plan.organizationId !== orgId) {
    throw new Error("Not found.");
  }
  return { planId: row.assumption.learningPlanId };
}
