import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { member, session as sessionTable } from "@/db/schema";
import { headers } from "next/headers";

/**
 * Resolve and persist the active organization for a session that has none.
 *
 * Behavior (Feature 1.1 — active org dropped after re-login):
 * - The chosen org is always one the user is a **verified `member` of**, looked
 *   up server-side by `userId`. No client-supplied org id is ever trusted.
 * - Single-org users (the only case today — `member_userId_uidx` enforces one
 *   org per user) are auto-selected into that org.
 * - Multi-org rule (defined now even though multi-org isn't supported yet): the
 *   earliest-joined membership (`member.createdAt` ascending) is chosen
 *   deterministically. When real multi-org support lands, this should be
 *   replaced by an explicit org picker / last-used-org persistence rather than
 *   silently picking a tenant.
 *
 * Writes directly to `session.activeOrganizationId` (session is DB-backed, not
 * a JWT, so the update is visible to the next `getSession` read).
 *
 * @returns the resolved organization id, or `null` if the user has no membership.
 */
export async function ensureActiveOrganization(params: {
  userId: string;
  sessionId: string;
}): Promise<string | null> {
  const row = await db.query.member.findFirst({
    where: eq(member.userId, params.userId),
    orderBy: asc(member.createdAt),
  });
  if (!row) return null;

  await db
    .update(sessionTable)
    .set({ activeOrganizationId: row.organizationId })
    .where(eq(sessionTable.id, params.sessionId));

  return row.organizationId;
}

/**
 * Convenience wrapper for callers that don't already hold a session: reads the
 * current session and, if it has no `activeOrganizationId`, resolves one from
 * membership via {@link ensureActiveOrganization}.
 *
 * @returns the active organization id (existing or newly resolved), or `null`.
 */
export async function syncActiveOrganizationFromMembership(): Promise<
  string | null
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.session || !session.user) return null;
  if (session.session.activeOrganizationId) {
    return session.session.activeOrganizationId;
  }

  return ensureActiveOrganization({
    userId: session.user.id,
    sessionId: session.session.id,
  });
}
