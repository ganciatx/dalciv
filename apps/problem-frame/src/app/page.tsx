import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { syncActiveOrganizationFromMembership } from "@/lib/sync-active-org";

export default async function Home() {
  try {
    await syncActiveOrganizationFromMembership();
    const session = await getSession();
    if (session?.user) {
      if (session.session.activeOrganizationId) {
        redirect("/products");
      }
      redirect("/org/new");
    }
  } catch {
    // Session/DB glitches should not blank the marketing entry — send to login.
  }
  redirect("/login");
}
