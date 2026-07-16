import { AppNav } from "@/components/app-nav";
import { requireUserSession } from "@/lib/require-user";
import { syncActiveOrganizationFromMembership } from "@/lib/sync-active-org";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await syncActiveOrganizationFromMembership();
  const session = await requireUserSession();
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav userEmail={session.user.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
