"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLearningPlan } from "@/actions/learning-plans";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

type PlanRow = {
  id: number;
  planName: string;
  timeframe: string | null;
  status: string;
  productName: string | null;
  assumptionCount: number;
  lastUpdatedMs: number;
};

type ProductOption = { id: number; productName: string };

const field =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";

function statusVariant(
  s: string,
): "default" | "success" | "muted" | "warning" {
  if (s === "Active") return "success";
  if (s === "Archived") return "muted";
  if (s === "Draft") return "warning";
  return "default";
}

export function LearningPlansListClient({
  plans,
  products,
}: {
  plans: PlanRow[];
  products: ProductOption[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + New Learning Plan
        </button>
      </div>

      <Modal
        open={open}
        title="New learning plan"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-plan-form"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create
            </button>
          </>
        }
      >
        <form
          id="add-plan-form"
          action={async (fd) => {
            const id = await createLearningPlan(fd);
            setOpen(false);
            router.push(`/learning-plans/${id}`);
          }}
          className="grid gap-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span>Plan name</span>
            <input
              name="planName"
              required
              placeholder="e.g. Tax Identity Shield Learning Plan"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Timeframe</span>
            <input
              name="timeframe"
              placeholder="e.g. TS26/TS27"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Product (optional)</span>
            <select name="productId" className={field} defaultValue="">
              <option value="">— None —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Ideal state</span>
            <textarea name="idealState" rows={2} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Client problem</span>
            <textarea name="clientProblem" rows={2} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Status</span>
            <select name="status" className={field} defaultValue="Active">
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
        </form>
      </Modal>

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        {plans.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            No learning plans yet. Create one to capture critical assumptions and
            the experiments that test them.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="hidden px-4 py-3 sm:table-cell">Product</th>
                <th className="hidden px-4 py-3 md:table-cell">Assumptions</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Last updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {plans.map((p) => (
                <tr
                  key={p.id}
                  className="transition hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/learning-plans/${p.id}`}
                      className="font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {p.planName}
                    </Link>
                    {p.timeframe ? (
                      <span className="ml-2 text-xs text-zinc-500">
                        {p.timeframe}
                      </span>
                    ) : null}
                  </td>
                  <td className="hidden text-zinc-600 sm:table-cell dark:text-zinc-400">
                    {p.productName ?? "—"}
                  </td>
                  <td className="hidden text-zinc-600 md:table-cell dark:text-zinc-400">
                    {p.assumptionCount}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="hidden text-zinc-500 md:table-cell">
                    {new Date(p.lastUpdatedMs).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
