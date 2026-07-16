"use server";

import { eq, and, count, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  problemFrames,
  problemFrameVersions,
  products,
  personas,
  desiredOutcomes,
  barriers,
  rootCauses,
  emotionalImpacts,
  frameConstraints,
  assumptions,
  hypotheses,
  customerFeedback,
  feedbackBarrierLink,
} from "@/db/schema";
import { requireOrgSession } from "@/lib/require-org";
import {
  loadFrameSnapshotPayload,
  serializeSnapshot,
} from "@/lib/frame-snapshot";

export async function getFrameForOrg(frameId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const frame = await db.query.problemFrames.findFirst({
    where: eq(problemFrames.id, frameId),
    with: {
      product: true,
      persona: true,
      outcomes: true,
      barriers: { with: { rootCauses: true } },
      emotionalImpacts: true,
      constraints: true,
      assumptions: true,
      hypotheses: { with: { metrics: true } },
    },
  });
  if (!frame || frame.product.organizationId !== orgId) return null;
  return frame;
}

export async function listFramesForProduct(productId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.organizationId, orgId)),
  });
  if (!product) return [];
  return db.query.problemFrames.findMany({
    where: eq(problemFrames.productId, productId),
    orderBy: (f, { desc }) => [desc(f.lastUpdated)],
    with: { persona: true },
  });
}

export async function listFramesForProductWithCounts(productId: number) {
  const frames = await listFramesForProduct(productId);
  if (frames.length === 0) return [];
  const ids = frames.map((f) => f.id);
  const [barrierRows, hypothesisRows] = await Promise.all([
    db
      .select({ frameId: barriers.frameId, n: count() })
      .from(barriers)
      .where(inArray(barriers.frameId, ids))
      .groupBy(barriers.frameId),
    db
      .select({ frameId: hypotheses.frameId, n: count() })
      .from(hypotheses)
      .where(inArray(hypotheses.frameId, ids))
      .groupBy(hypotheses.frameId),
  ]);
  const barrierCount = new Map(barrierRows.map((r) => [r.frameId, r.n]));
  const hypothesisCount = new Map(hypothesisRows.map((r) => [r.frameId, r.n]));
  return frames.map((f) => ({
    ...f,
    barrierCount: barrierCount.get(f.id) ?? 0,
    hypothesisCount: hypothesisCount.get(f.id) ?? 0,
  }));
}

export async function createProblemFrame(formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const productId = Number(formData.get("productId"));
  const personaId = Number(formData.get("personaId"));
  const frameTitle = String(formData.get("frameTitle") ?? "").trim();
  if (!frameTitle) throw new Error("Title is required.");
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.organizationId, orgId)),
  });
  if (!product) throw new Error("Product not found.");
  const persona = await db.query.personas.findFirst({
    where: eq(personas.id, personaId),
  });
  if (!persona || persona.organizationId !== orgId) {
    throw new Error("Persona not found.");
  }
  await db.insert(problemFrames).values({
    productId,
    personaId,
    frameTitle,
    problemStatement:
      String(formData.get("problemStatement") ?? "").trim() || null,
    status: String(formData.get("status") ?? "Draft"),
    createdDate: new Date().toISOString().slice(0, 10),
    createdByUserId: session.user.id,
    lastUpdated: new Date(),
    version: 1,
  });
  revalidatePath(`/products/${productId}/frames`);
}

export async function updateProblemFrame(
  frameId: number,
  formData: FormData,
) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const frame = await db.query.problemFrames.findFirst({
    where: eq(problemFrames.id, frameId),
    with: { product: true },
  });
  if (!frame || frame.product.organizationId !== orgId) {
    throw new Error("Frame not found.");
  }
  await db
    .update(problemFrames)
    .set({
      frameTitle: String(formData.get("frameTitle") ?? "").trim(),
      problemStatement:
        String(formData.get("problemStatement") ?? "").trim() || null,
      status: String(formData.get("status") ?? "Draft"),
      lastUpdated: new Date(),
    })
    .where(eq(problemFrames.id, frameId));
  revalidatePath(`/products/${frame.productId}/frames/${frameId}`);
}

/** Auto-save: partial update for workflow fields (title, statement, status, persona). */
export async function patchProblemFrame(
  frameId: number,
  patch: {
    frameTitle?: string;
    problemStatement?: string | null;
    status?: string;
    personaId?: number;
  },
) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const frame = await db.query.problemFrames.findFirst({
    where: eq(problemFrames.id, frameId),
    with: { product: true },
  });
  if (!frame || frame.product.organizationId !== orgId) {
    throw new Error("Frame not found.");
  }
  if (patch.personaId != null) {
    const persona = await db.query.personas.findFirst({
      where: eq(personas.id, patch.personaId),
    });
    if (!persona || persona.organizationId !== orgId) {
      throw new Error("Persona not found.");
    }
  }
  const updates: Partial<typeof problemFrames.$inferInsert> = {
    lastUpdated: new Date(),
  };
  if (patch.frameTitle !== undefined) updates.frameTitle = patch.frameTitle;
  if (patch.problemStatement !== undefined) {
    updates.problemStatement = patch.problemStatement;
  }
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.personaId !== undefined) updates.personaId = patch.personaId;
  await db
    .update(problemFrames)
    .set(updates)
    .where(eq(problemFrames.id, frameId));
  revalidatePath(`/products/${frame.productId}/frames/${frameId}`);
}

export async function saveFrameVersion(frameId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const label = String(formData.get("label") ?? "").trim();
  const frame = await db.query.problemFrames.findFirst({
    where: eq(problemFrames.id, frameId),
    with: { product: true },
  });
  if (!frame || frame.product.organizationId !== orgId) {
    throw new Error("Frame not found.");
  }
  const payload = await loadFrameSnapshotPayload(frameId);
  if (!payload) throw new Error("Could not load frame.");
  const nextVersion = frame.version + 1;
  const snapshotJson = serializeSnapshot(payload);
  await db.transaction(async (tx) => {
    await tx.insert(problemFrameVersions).values({
      frameId,
      versionNumber: nextVersion,
      label: label || null,
      snapshotJson,
      createdByUserId: session.user.id,
    });
    await tx
      .update(problemFrames)
      .set({ version: nextVersion, lastUpdated: new Date() })
      .where(eq(problemFrames.id, frameId));
  });
  revalidatePath(`/products/${frame.productId}/frames/${frameId}`);
}

export async function listFrameVersions(frameId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const frame = await db.query.problemFrames.findFirst({
    where: eq(problemFrames.id, frameId),
    with: { product: true },
  });
  if (!frame || frame.product.organizationId !== orgId) return [];
  return db.query.problemFrameVersions.findMany({
    where: eq(problemFrameVersions.frameId, frameId),
    orderBy: (v, { desc }) => [desc(v.versionNumber)],
  });
}

export async function addDesiredOutcome(frameId: number, formData: FormData) {
  const session = await requireOrgSession();
  const productId = await assertFrameInOrg(
    frameId,
    session.session.activeOrganizationId,
  );
  const text = String(formData.get("outcomeText") ?? "").trim();
  if (!text) throw new Error("Outcome text required.");
  await db.insert(desiredOutcomes).values({
    frameId,
    outcomeText: text,
    priorityRank: Number(formData.get("priorityRank")) || null,
    jtbdCategory: String(formData.get("jtbdCategory") ?? "").trim() || null,
  });
  revalidatePath(`/products/${productId}/frames/${frameId}`);
}

export async function addRootCause(barrierId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const barrier = await db.query.barriers.findFirst({
    where: eq(barriers.id, barrierId),
    with: { frame: { with: { product: true } } },
  });
  if (!barrier || barrier.frame.product.organizationId !== orgId) {
    throw new Error("Barrier not found.");
  }
  const causeText = String(formData.get("causeText") ?? "").trim();
  if (!causeText) throw new Error("Root cause text required.");
  await db.insert(rootCauses).values({
    barrierId,
    causeText,
    causeType: String(formData.get("causeType") ?? "").trim() || null,
    validated: formData.get("validated") === "on",
    validationMethod:
      String(formData.get("validationMethod") ?? "").trim() || null,
  });
  revalidatePath(
    `/products/${barrier.frame.productId}/frames/${barrier.frameId}`,
  );
}

export async function addBarrier(frameId: number, formData: FormData) {
  const session = await requireOrgSession();
  const productId = await assertFrameInOrg(
    frameId,
    session.session.activeOrganizationId,
  );
  const barrierText = String(formData.get("barrierText") ?? "").trim();
  if (!barrierText) throw new Error("Barrier text required.");
  await db.insert(barriers).values({
    frameId,
    barrierCategory:
      String(formData.get("barrierCategory") ?? "").trim() || null,
    barrierText,
    impactPercentage: formData.get("impactPercentage")
      ? Number(formData.get("impactPercentage"))
      : null,
    severity: String(formData.get("severity") ?? "").trim() || null,
    frequency: String(formData.get("frequency") ?? "").trim() || null,
    evidenceCount: Number(formData.get("evidenceCount")) || 0,
  });
  revalidatePath(`/products/${productId}/frames/${frameId}`);
}

export async function addEmotionalImpact(frameId: number, formData: FormData) {
  const session = await requireOrgSession();
  const productId = await assertFrameInOrg(
    frameId,
    session.session.activeOrganizationId,
  );
  const emotionText = String(formData.get("emotionText") ?? "").trim();
  if (!emotionText) throw new Error("Emotion text required.");
  await db.insert(emotionalImpacts).values({
    frameId,
    emotionText,
    emotionCategory:
      String(formData.get("emotionCategory") ?? "").trim() || null,
    intensity: Number(formData.get("intensity")) || null,
  });
  revalidatePath(`/products/${productId}/frames/${frameId}`);
}

export async function addConstraintRow(frameId: number, formData: FormData) {
  const session = await requireOrgSession();
  const productId = await assertFrameInOrg(
    frameId,
    session.session.activeOrganizationId,
  );
  const constraintText = String(formData.get("constraintText") ?? "").trim();
  if (!constraintText) throw new Error("Constraint text required.");
  await db.insert(frameConstraints).values({
    frameId,
    constraintType: String(formData.get("constraintType") ?? "").trim() || null,
    constraintText,
    isModifiable: formData.get("isModifiable") === "on",
  });
  revalidatePath(`/products/${productId}/frames/${frameId}`);
}

export async function addAssumption(frameId: number, formData: FormData) {
  const session = await requireOrgSession();
  const productId = await assertFrameInOrg(
    frameId,
    session.session.activeOrganizationId,
  );
  const assumptionText = String(formData.get("assumptionText") ?? "").trim();
  if (!assumptionText) throw new Error("Assumption text required.");
  await db.insert(assumptions).values({
    frameId,
    assumptionCode: String(formData.get("assumptionCode") ?? "").trim() || null,
    assumptionText,
    validationStatus:
      String(formData.get("validationStatus") ?? "").trim() || null,
  });
  revalidatePath(`/products/${productId}/frames/${frameId}`);
}

export async function addHypothesis(frameId: number, formData: FormData) {
  const session = await requireOrgSession();
  const productId = await assertFrameInOrg(
    frameId,
    session.session.activeOrganizationId,
  );
  const barrierId = Number(formData.get("barrierId"));
  if (!Number.isFinite(barrierId)) throw new Error("Select a barrier.");
  const barrier = await db.query.barriers.findFirst({
    where: eq(barriers.id, barrierId),
  });
  if (!barrier || barrier.frameId !== frameId) {
    throw new Error("Invalid barrier.");
  }
  const hypothesisTitle = String(formData.get("hypothesisTitle") ?? "").trim();
  if (!hypothesisTitle) throw new Error("Hypothesis title required.");
  await db.insert(hypotheses).values({
    frameId,
    barrierId,
    hypothesisTitle,
    ifStatement: String(formData.get("ifStatement") ?? "").trim() || null,
    thenStatement: String(formData.get("thenStatement") ?? "").trim() || null,
    becauseStatement:
      String(formData.get("becauseStatement") ?? "").trim() || null,
    priority: Number(formData.get("priority")) || null,
    effort: String(formData.get("effort") ?? "").trim() || null,
    impact: String(formData.get("impact") ?? "").trim() || null,
    confidence: String(formData.get("confidence") ?? "").trim() || null,
    status: String(formData.get("status") ?? "Proposed"),
  });
  revalidatePath(`/products/${productId}/frames/${frameId}`);
}

export async function addCustomerFeedback(productId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.organizationId, orgId)),
  });
  if (!product) throw new Error("Product not found.");
  const commentText = String(formData.get("commentText") ?? "").trim();
  if (!commentText) throw new Error("Comment required.");
  await db.insert(customerFeedback).values({
    productId,
    responseDate: String(formData.get("responseDate") ?? "").trim() || null,
    questionType: String(formData.get("questionType") ?? "").trim() || null,
    commentText,
    theme: String(formData.get("theme") ?? "").trim() || null,
    sentiment: String(formData.get("sentiment") ?? "").trim() || null,
    groupTag: String(formData.get("groupTag") ?? "").trim() || null,
  });
  revalidatePath(`/products/${productId}/frames`);
  revalidatePath(`/products/${productId}/frames`, "layout");
}

export async function linkFeedbackToBarrier(formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const feedbackId = Number(formData.get("feedbackId"));
  const barrierId = Number(formData.get("barrierId"));
  if (!Number.isFinite(feedbackId) || !Number.isFinite(barrierId)) {
    throw new Error("Invalid link.");
  }
  const fb = await db.query.customerFeedback.findFirst({
    where: eq(customerFeedback.id, feedbackId),
    with: { product: true },
  });
  if (!fb || fb.product.organizationId !== orgId) {
    throw new Error("Feedback not found.");
  }
  const barrier = await db.query.barriers.findFirst({
    where: eq(barriers.id, barrierId),
    with: { frame: { with: { product: true } } },
  });
  if (!barrier || barrier.frame.product.organizationId !== orgId) {
    throw new Error("Barrier not found.");
  }
  await db.insert(feedbackBarrierLink).values({
    feedbackId,
    barrierId,
    relevanceScore: formData.get("relevanceScore")
      ? Number(formData.get("relevanceScore"))
      : null,
  });
  revalidatePath(
    `/products/${barrier.frame.productId}/frames/${barrier.frameId}`,
  );
}

async function assertFrameInOrg(frameId: number, orgId: string) {
  const frame = await db.query.problemFrames.findFirst({
    where: eq(problemFrames.id, frameId),
    with: { product: true },
  });
  if (!frame || frame.product.organizationId !== orgId) {
    throw new Error("Frame not found.");
  }
  return frame.productId;
}

/** Bump parent frame timestamp when child rows change (sorting / “recently edited”). */
async function touchFrame(frameId: number) {
  await db
    .update(problemFrames)
    .set({ lastUpdated: new Date() })
    .where(eq(problemFrames.id, frameId));
}

function revalidateFrame(productId: number, frameId: number) {
  revalidatePath(`/products/${productId}/frames/${frameId}`);
}

// --- Desired outcomes ---

export async function updateDesiredOutcome(outcomeId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireDesiredOutcomeAccess(outcomeId, orgId);
  const text = String(formData.get("outcomeText") ?? "").trim();
  if (!text) throw new Error("Outcome text required.");
  await db
    .update(desiredOutcomes)
    .set({
      outcomeText: text,
      priorityRank: Number(formData.get("priorityRank")) || null,
      jtbdCategory: String(formData.get("jtbdCategory") ?? "").trim() || null,
    })
    .where(eq(desiredOutcomes.id, outcomeId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

export async function deleteDesiredOutcome(outcomeId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireDesiredOutcomeAccess(outcomeId, orgId);
  await db.delete(desiredOutcomes).where(eq(desiredOutcomes.id, outcomeId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

async function requireDesiredOutcomeAccess(outcomeId: number, orgId: string) {
  const row = await db.query.desiredOutcomes.findFirst({
    where: eq(desiredOutcomes.id, outcomeId),
    with: { frame: { with: { product: true } } },
  });
  if (!row || row.frame.product.organizationId !== orgId) {
    throw new Error("Not found.");
  }
  return { frameId: row.frameId, productId: row.frame.productId };
}

// --- Barriers ---

export async function updateBarrier(barrierId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireBarrierAccess(barrierId, orgId);
  const barrierText = String(formData.get("barrierText") ?? "").trim();
  if (!barrierText) throw new Error("Barrier text required.");
  await db
    .update(barriers)
    .set({
      barrierCategory:
        String(formData.get("barrierCategory") ?? "").trim() || null,
      barrierText,
      impactPercentage: formData.get("impactPercentage")
        ? Number(formData.get("impactPercentage"))
        : null,
      severity: String(formData.get("severity") ?? "").trim() || null,
      frequency: String(formData.get("frequency") ?? "").trim() || null,
      evidenceCount: Number(formData.get("evidenceCount")) || 0,
    })
    .where(eq(barriers.id, barrierId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

export async function deleteBarrier(barrierId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireBarrierAccess(barrierId, orgId);
  await db.delete(barriers).where(eq(barriers.id, barrierId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

async function requireBarrierAccess(barrierId: number, orgId: string) {
  const row = await db.query.barriers.findFirst({
    where: eq(barriers.id, barrierId),
    with: { frame: { with: { product: true } } },
  });
  if (!row || row.frame.product.organizationId !== orgId) {
    throw new Error("Not found.");
  }
  return { frameId: row.frameId, productId: row.frame.productId };
}

// --- Root causes ---

export async function updateRootCause(causeId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireRootCauseAccess(causeId, orgId);
  const causeText = String(formData.get("causeText") ?? "").trim();
  if (!causeText) throw new Error("Root cause text required.");
  await db
    .update(rootCauses)
    .set({
      causeText,
      causeType: String(formData.get("causeType") ?? "").trim() || null,
      validated: formData.get("validated") === "on",
      validationMethod:
        String(formData.get("validationMethod") ?? "").trim() || null,
    })
    .where(eq(rootCauses.id, causeId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

export async function deleteRootCause(causeId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireRootCauseAccess(causeId, orgId);
  await db.delete(rootCauses).where(eq(rootCauses.id, causeId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

async function requireRootCauseAccess(causeId: number, orgId: string) {
  const row = await db.query.rootCauses.findFirst({
    where: eq(rootCauses.id, causeId),
    with: { barrier: { with: { frame: { with: { product: true } } } } },
  });
  if (!row || row.barrier.frame.product.organizationId !== orgId) {
    throw new Error("Not found.");
  }
  return {
    frameId: row.barrier.frameId,
    productId: row.barrier.frame.productId,
  };
}

// --- Emotional impacts ---

export async function updateEmotionalImpact(emotionId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireEmotionalImpactAccess(emotionId, orgId);
  const emotionText = String(formData.get("emotionText") ?? "").trim();
  if (!emotionText) throw new Error("Text required.");
  await db
    .update(emotionalImpacts)
    .set({
      emotionText,
      emotionCategory:
        String(formData.get("emotionCategory") ?? "").trim() || null,
      intensity: Number(formData.get("intensity")) || null,
    })
    .where(eq(emotionalImpacts.id, emotionId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

export async function deleteEmotionalImpact(emotionId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireEmotionalImpactAccess(emotionId, orgId);
  await db.delete(emotionalImpacts).where(eq(emotionalImpacts.id, emotionId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

async function requireEmotionalImpactAccess(emotionId: number, orgId: string) {
  const row = await db.query.emotionalImpacts.findFirst({
    where: eq(emotionalImpacts.id, emotionId),
    with: { frame: { with: { product: true } } },
  });
  if (!row || row.frame.product.organizationId !== orgId) {
    throw new Error("Not found.");
  }
  return { frameId: row.frameId, productId: row.frame.productId };
}

// --- Frame constraints ---

export async function updateConstraintRow(constraintId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireConstraintAccess(constraintId, orgId);
  const constraintText = String(formData.get("constraintText") ?? "").trim();
  if (!constraintText) throw new Error("Constraint text required.");
  await db
    .update(frameConstraints)
    .set({
      constraintType: String(formData.get("constraintType") ?? "").trim() || null,
      constraintText,
      isModifiable: formData.get("isModifiable") === "on",
    })
    .where(eq(frameConstraints.id, constraintId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

export async function deleteConstraintRow(constraintId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireConstraintAccess(constraintId, orgId);
  await db.delete(frameConstraints).where(eq(frameConstraints.id, constraintId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

async function requireConstraintAccess(constraintId: number, orgId: string) {
  const row = await db.query.frameConstraints.findFirst({
    where: eq(frameConstraints.id, constraintId),
    with: { frame: { with: { product: true } } },
  });
  if (!row || row.frame.product.organizationId !== orgId) {
    throw new Error("Not found.");
  }
  return { frameId: row.frameId, productId: row.frame.productId };
}

// --- Assumptions ---

export async function updateAssumption(assumptionId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireAssumptionAccess(assumptionId, orgId);
  const assumptionText = String(formData.get("assumptionText") ?? "").trim();
  if (!assumptionText) throw new Error("Assumption text required.");
  await db
    .update(assumptions)
    .set({
      assumptionCode: String(formData.get("assumptionCode") ?? "").trim() || null,
      assumptionText,
      validationStatus:
        String(formData.get("validationStatus") ?? "").trim() || null,
      validationDate: String(formData.get("validationDate") ?? "").trim() || null,
      validationNotes:
        String(formData.get("validationNotes") ?? "").trim() || null,
    })
    .where(eq(assumptions.id, assumptionId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

export async function deleteAssumption(assumptionId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireAssumptionAccess(assumptionId, orgId);
  await db.delete(assumptions).where(eq(assumptions.id, assumptionId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

async function requireAssumptionAccess(assumptionId: number, orgId: string) {
  const row = await db.query.assumptions.findFirst({
    where: eq(assumptions.id, assumptionId),
    with: { frame: { with: { product: true } } },
  });
  if (!row || row.frame.product.organizationId !== orgId) {
    throw new Error("Not found.");
  }
  return { frameId: row.frameId, productId: row.frame.productId };
}

// --- Hypotheses ---

export async function updateHypothesis(hypothesisId: number, formData: FormData) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireHypothesisAccess(hypothesisId, orgId);
  const barrierId = Number(formData.get("barrierId"));
  if (!Number.isFinite(barrierId)) throw new Error("Select a barrier.");
  const barrier = await db.query.barriers.findFirst({
    where: eq(barriers.id, barrierId),
  });
  if (!barrier || barrier.frameId !== ctx.frameId) {
    throw new Error("Invalid barrier.");
  }
  const hypothesisTitle = String(formData.get("hypothesisTitle") ?? "").trim();
  if (!hypothesisTitle) throw new Error("Title required.");
  await db
    .update(hypotheses)
    .set({
      barrierId,
      hypothesisTitle,
      ifStatement: String(formData.get("ifStatement") ?? "").trim() || null,
      thenStatement: String(formData.get("thenStatement") ?? "").trim() || null,
      becauseStatement:
        String(formData.get("becauseStatement") ?? "").trim() || null,
      priority: Number(formData.get("priority")) || null,
      effort: String(formData.get("effort") ?? "").trim() || null,
      impact: String(formData.get("impact") ?? "").trim() || null,
      confidence: String(formData.get("confidence") ?? "").trim() || null,
      status: String(formData.get("status") ?? "Proposed"),
    })
    .where(eq(hypotheses.id, hypothesisId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

export async function deleteHypothesis(hypothesisId: number) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const ctx = await requireHypothesisAccess(hypothesisId, orgId);
  await db.delete(hypotheses).where(eq(hypotheses.id, hypothesisId));
  await touchFrame(ctx.frameId);
  revalidateFrame(ctx.productId, ctx.frameId);
}

async function requireHypothesisAccess(hypothesisId: number, orgId: string) {
  const row = await db.query.hypotheses.findFirst({
    where: eq(hypotheses.id, hypothesisId),
    with: { frame: { with: { product: true } } },
  });
  if (!row || row.frame.product.organizationId !== orgId) {
    throw new Error("Not found.");
  }
  return { frameId: row.frameId, productId: row.frame.productId };
}
