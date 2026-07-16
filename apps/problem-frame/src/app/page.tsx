import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { syncActiveOrganizationFromMembership } from "@/lib/sync-active-org";

export default async function Home() {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    await syncActiveOrganizationFromMembership();
    session = await getSession();
  } catch {
    // Session/DB errors should not 500 the entry URL — fall through to login.
    redirect("/login");
  }
  if (session?.user) {
    if (session.session.activeOrganizationId) {
      redirect("/products");
    }
    redirect("/org/new");
  }
  redirect("/login");
}
