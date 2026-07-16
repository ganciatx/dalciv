import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { syncActiveOrganizationFromMembership } from "@/lib/sync-active-org";

export default async function Home() {
  await syncActiveOrganizationFromMembership();
  const session = await getSession();
  if (session?.user) {
    if (session.session.activeOrganizationId) {
      redirect("/products");
    }
    redirect("/org/new");
  }
  redirect("/login");
}
