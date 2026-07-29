import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { feedbackBarrierLink, problemFrames } from "@/db/schema";
import { FRAME_GRAPH_WITH } from "@/lib/frame-snapshot";

/** Stakeholder-facing presentation of the live frame (workflow steps 1–6). */
export type FramePresentationPayload = {
  header: {
    frameTitle: string;
    problemStatement: string | null;
    status: string;
    version: number;
    productName: string;
    productCode: string;
    personaName: string;
    /** Persona goals/behaviors for PDF narrative; omitted from lean CSV frame row. */
    personaGoals: string | null;
    personaBehaviors: string | null;
  };
  outcomes: Array<{
    outcomeText: string;
    priorityRank: number | null;
    jtbdCategory: string | null;
  }>;
  barriers: Array<{
    barrierText: string;
    barrierCategory: string | null;
    severity: string | null;
    frequency: string | null;
    impactPercentage: number | null;
    rootCauses: Array<{
      causeText: string;
      causeType: string | null;
      validated: boolean | null;
    }>;
  }>;
  emotionalImpacts: Array<{
    emotionText: string;
    emotionCategory: string | null;
    intensity: number | null;
  }>;
  constraints: Array<{
    constraintText: string;
    constraintType: string | null;
    isModifiable: boolean | null;
  }>;
  assumptions: Array<{
    assumptionText: string;
    assumptionCode: string | null;
    validationStatus: string | null;
  }>;
  hypotheses: Array<{
    hypothesisTitle: string;
    ifStatement: string | null;
    thenStatement: string | null;
    becauseStatement: string | null;
    priority: number | null;
    effort: string | null;
    impact: string | null;
    confidence: string | null;
    status: string | null;
    barrierText: string | null;
    metrics: Array<{
      metricName: string;
      baselineValue: string | null;
      targetValue: string | null;
      measurementMethod: string | null;
      actualValue: string | null;
    }>;
  }>;
  /** Feedback linked to this frame’s barriers only (not full product dump). */
  evidence: Array<{
    commentText: string;
    responseDate: string | null;
    questionType: string | null;
    theme: string | null;
    sentiment: string | null;
    barrierText: string;
  }>;
};

/**
 * Live working copy of a frame for PDF/CSV export, gated by org ownership.
 * Reuses FRAME_GRAPH_WITH from snapshot loading; adds product + persona + linked evidence.
 */
export async function loadFramePresentationPayload(
  frameId: number,
  orgId: string,
): Promise<FramePresentationPayload | null> {
  const frame = await db.query.problemFrames.findFirst({
    where: eq(problemFrames.id, frameId),
    with: {
      ...FRAME_GRAPH_WITH,
      product: true,
      persona: true,
    },
  });
  if (!frame || frame.product.organizationId !== orgId) return null;

  const barrierById = new Map(
    frame.barriers.map((b) => [b.id, b.barrierText] as const),
  );
  const barrierIds = frame.barriers.map((b) => b.id);

  let evidence: FramePresentationPayload["evidence"] = [];
  if (barrierIds.length > 0) {
    const links = await db.query.feedbackBarrierLink.findMany({
      where: inArray(feedbackBarrierLink.barrierId, barrierIds),
      with: { feedback: true },
    });
    evidence = links.map((link) => ({
      commentText: link.feedback.commentText,
      responseDate: link.feedback.responseDate,
      questionType: link.feedback.questionType,
      theme: link.feedback.theme,
      sentiment: link.feedback.sentiment,
      barrierText: barrierById.get(link.barrierId) ?? "",
    }));
  }

  return {
    header: {
      frameTitle: frame.frameTitle,
      problemStatement: frame.problemStatement,
      status: frame.status,
      version: frame.version,
      productName: frame.product.productName,
      productCode: frame.product.productCode,
      personaName: frame.persona.personaName,
      personaGoals: frame.persona.goals,
      personaBehaviors: frame.persona.behaviors,
    },
    outcomes: frame.outcomes.map((o) => ({
      outcomeText: o.outcomeText,
      priorityRank: o.priorityRank,
      jtbdCategory: o.jtbdCategory,
    })),
    barriers: frame.barriers.map((b) => ({
      barrierText: b.barrierText,
      barrierCategory: b.barrierCategory,
      severity: b.severity,
      frequency: b.frequency,
      impactPercentage: b.impactPercentage,
      rootCauses: b.rootCauses.map((rc) => ({
        causeText: rc.causeText,
        causeType: rc.causeType,
        validated: rc.validated ?? null,
      })),
    })),
    emotionalImpacts: frame.emotionalImpacts.map((e) => ({
      emotionText: e.emotionText,
      emotionCategory: e.emotionCategory,
      intensity: e.intensity,
    })),
    constraints: frame.constraints.map((c) => ({
      constraintText: c.constraintText,
      constraintType: c.constraintType,
      isModifiable: c.isModifiable ?? null,
    })),
    assumptions: frame.assumptions.map((a) => ({
      assumptionText: a.assumptionText,
      assumptionCode: a.assumptionCode,
      validationStatus: a.validationStatus,
    })),
    hypotheses: frame.hypotheses.map((h) => ({
      hypothesisTitle: h.hypothesisTitle,
      ifStatement: h.ifStatement,
      thenStatement: h.thenStatement,
      becauseStatement: h.becauseStatement,
      priority: h.priority,
      effort: h.effort,
      impact: h.impact,
      confidence: h.confidence,
      status: h.status,
      barrierText: barrierById.get(h.barrierId) ?? null,
      metrics: h.metrics.map((m) => ({
        metricName: m.metricName,
        baselineValue: m.baselineValue,
        targetValue: m.targetValue,
        measurementMethod: m.measurementMethod,
        actualValue: m.actualValue,
      })),
    })),
    evidence,
  };
}

/** Safe download basename: `{productCode}_{frameTitle}_v{n}`. */
export function presentationExportBasename(payload: FramePresentationPayload): string {
  const code = sanitizeFilenamePart(payload.header.productCode) || "product";
  const title = sanitizeFilenamePart(payload.header.frameTitle) || "frame";
  return `${code}_${title}_v${payload.header.version}`;
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}
