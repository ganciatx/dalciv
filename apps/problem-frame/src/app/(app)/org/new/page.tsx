import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { ensureActiveOrganization } from "@/lib/sync-active-org";
import { NewOrgForm } from "./new-org-form";

export default async function NewOrgPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  // A returning member landing here (e.g. via a stale link or a session that
  // lost its active org) should be sent back into their workspace, not shown
  // the create-org form again. Only users with no membership see the form.
  let orgId = session.session.activeOrganizationId;
  if (!orgId) {
    orgId = await ensureActiveOrganization({
      userId: session.user.id,
      sessionId: session.session.id,
    });
  }
  if (orgId) redirect("/products");

  return <NewOrgForm />;
}
