import { eq } from "drizzle-orm";
import { db } from "@/db";
import { problemFrames } from "@/db/schema";

/**
 * Shared nested graph for versioning snapshots and presentation export.
 * Keep loaders on this shape so we don't fork two unrelated query trees.
 */
export const FRAME_GRAPH_WITH = {
  outcomes: true,
  barriers: { with: { rootCauses: true } },
  emotionalImpacts: true,
  constraints: true,
  assumptions: true,
  hypotheses: { with: { metrics: true } },
} as const;

export type FrameSnapshotPayload = NonNullable<
  Awaited<ReturnType<typeof loadFrameSnapshotPayload>>
>;

/** Full nested frame graph for versioning and export. */
export async function loadFrameSnapshotPayload(frameId: number) {
  return db.query.problemFrames.findFirst({
    where: eq(problemFrames.id, frameId),
    with: FRAME_GRAPH_WITH,
  });
}

export function serializeSnapshot(payload: FrameSnapshotPayload) {
  return JSON.stringify(payload);
}
