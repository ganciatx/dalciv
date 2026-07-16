import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { db } from "@/db";
import { member, organization } from "@/db/schema";
import { requireOrgSession } from "@/lib/require-org";
import { InviteMemberForm } from "./invite-member-form";

export default async function OrgSettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!session.session.activeOrganizationId) redirect("/org/new");
  const orgSession = await requireOrgSession();
  const orgId = orgSession.session.activeOrganizationId;

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });

  const members = await db.query.member.findMany({
    where: eq(member.organizationId, orgId),
    with: { user: true },
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Organization
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {org?.name ?? "Workspace"} · slug: {org?.slug}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Members</h2>
        <ul className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span>{m.user?.email ?? m.userId}</span>
              <span className="text-zinc-500">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-md">
        <h2 className="text-lg font-medium">Invite teammate</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Invited users join this organization when they accept (same sign-up flow).
        </p>
        <InviteMemberForm />
      </section>
    </div>
  );
}
