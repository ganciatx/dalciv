import { eq } from "drizzle-orm";
import { db } from "@/db";
import { problemFrames } from "@/db/schema";

export type FrameSnapshotPayload = NonNullable<
  Awaited<ReturnType<typeof loadFrameSnapshotPayload>>
>;

/** Full nested frame graph for versioning and export. */
export async function loadFrameSnapshotPayload(frameId: number) {
  return db.query.problemFrames.findFirst({
    where: eq(problemFrames.id, frameId),
    with: {
      outcomes: true,
      barriers: { with: { rootCauses: true } },
      emotionalImpacts: true,
      constraints: true,
      assumptions: true,
      hypotheses: { with: { metrics: true } },
    },
  });
}

export function serializeSnapshot(payload: FrameSnapshotPayload) {
  return JSON.stringify(payload);
}
