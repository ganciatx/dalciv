import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { listPersonasForOrg, addPainPoint, updatePersona } from "@/actions/personas";
import { requireOrgSession } from "@/lib/require-org";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { painPoints } from "@/db/schema";
import { PersonaAddModal } from "@/components/personas/persona-add-modal";

const field =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";

export default async function PersonasPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!session.session.activeOrganizationId) redirect("/org/new");
  await requireOrgSession();

  const personaList = await listPersonasForOrg();
  const painByPersona = await Promise.all(
    personaList.map(async (p) => {
      const pains = await db.query.painPoints.findMany({
        where: eq(painPoints.personaId, p.id),
      });
      return { persona: p, pains };
    }),
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Personas
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Reusable across products and problem frames. Editing a persona affects all
            frames that use it.
          </p>
        </div>
        <PersonaAddModal />
      </div>

      <div className="mt-10 space-y-10">
        {painByPersona.map(({ persona, pains }) => (
          <section
            key={persona.id}
            className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/20"
          >
            <form
              action={updatePersona.bind(null, persona.id)}
              className="space-y-4 border-b border-zinc-200 pb-6 dark:border-zinc-700"
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {persona.personaName}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                  <input
                    name="personaName"
                    required
                    defaultValue={persona.personaName}
                    className={field}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Tech savviness
                  <select
                    name="techSavviness"
                    defaultValue={persona.techSavviness ?? ""}
                    className={field}
                  >
                    <option value="">—</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Description
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={persona.description ?? ""}
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Goals
                <textarea
                  name="goals"
                  rows={2}
                  defaultValue={persona.goals ?? ""}
                  placeholder="What they want to accomplish"
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Behaviors
                <textarea
                  name="behaviors"
                  rows={2}
                  defaultValue={persona.behaviors ?? ""}
                  placeholder="Observable habits"
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Context of use
                <textarea
                  name="contextOfUse"
                  rows={2}
                  defaultValue={persona.contextOfUse ?? ""}
                  placeholder="Environment, devices, situations"
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Segment
                <input
                  name="customerSegment"
                  defaultValue={persona.customerSegment ?? ""}
                  className={field}
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Save persona
              </button>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Pain points
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Severity uses a 1–5 scale: 1 = minor annoyance, 5 = severe blocker. Frequency
                describes how often this pain shows up.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                {pains.map((pp) => (
                  <li key={pp.id}>
                    {pp.painPointText}{" "}
                    <span className="text-zinc-400">
                      (severity {pp.severity}
                      {pp.frequency ? ` · ${pp.frequency}` : ""})
                    </span>
                  </li>
                ))}
              </ul>
              <form action={addPainPoint} className="mt-4 flex flex-wrap gap-2 text-sm">
                <input type="hidden" name="personaId" value={persona.id} />
                <input
                  name="painPointText"
                  placeholder="Pain point"
                  className={`${field} min-w-[200px] flex-1`}
                />
                <input
                  name="severity"
                  type="number"
                  min={1}
                  max={5}
                  defaultValue={3}
                  className="w-16 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950"
                  aria-label="Severity 1–5"
                />
                <select
                  name="frequency"
                  className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950"
                >
                  <option value="">Frequency</option>
                  <option value="Always">Always</option>
                  <option value="Often">Often</option>
                  <option value="Sometimes">Sometimes</option>
                  <option value="Rarely">Rarely</option>
                </select>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-200 px-2 py-1 dark:bg-zinc-700"
                >
                  Add pain point
                </button>
              </form>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
