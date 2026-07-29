import { NextResponse } from "next/server";
import {
  loadFramePresentationPayload,
  presentationExportBasename,
} from "@/lib/frame-presentation";
import { requireOrgSession } from "@/lib/require-org";

/**
 * Shared auth + org check for presentation export routes.
 * Unauthorized users hit requireOrgSession redirect; missing/wrong-org → 404.
 */
export async function loadAuthorizedPresentation(frameIdParam: string) {
  const session = await requireOrgSession();
  const orgId = session.session.activeOrganizationId;
  const frameId = Number(frameIdParam);
  if (!Number.isFinite(frameId)) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  const payload = await loadFramePresentationPayload(frameId, orgId);
  if (!payload) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { payload, basename: presentationExportBasename(payload) };
}
