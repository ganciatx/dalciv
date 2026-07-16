import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export async function requireUserSession() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session;
}
