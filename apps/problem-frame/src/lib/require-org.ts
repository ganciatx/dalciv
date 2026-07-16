import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { ensureActiveOrganization } from "@/lib/sync-active-org";

export type OrgSession = NonNullable<
  Awaited<ReturnType<typeof getSession>>
> & {
  session: { activeOrganizationId: string };
};

export async function requireOrgSession(): Promise<OrgSession> {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  // Resolve the active org before any redirect logic runs: a returning user
  // whose new session lost `activeOrganizationId` is auto-placed back into
  // their (verified) org instead of being pushed through /org/new again.
  let orgId = session.session.activeOrganizationId;
  if (!orgId) {
    orgId = await ensureActiveOrganization({
      userId: session.user.id,
      sessionId: session.session.id,
    });
  }
  if (!orgId) redirect("/org/new");

  // The session object was fetched before the sync write, so return a copy with
  // the resolved org id to keep downstream reads consistent within this request.
  return {
    ...session,
    session: { ...session.session, activeOrganizationId: orgId },
  } as OrgSession;
}
