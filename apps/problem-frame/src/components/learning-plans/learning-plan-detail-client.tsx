"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  updateLearningPlan,
  deleteLearningPlan,
  addAssumptionRow,
  updateAssumptionRow,
  deleteAssumptionRow,
  addExperimentRow,
  updateExperimentRow,
  deleteExperimentRow,
} from "@/actions/learning-plans";

type Experiment = {
  id: number;
  mode: string;
  hypothesis: string | null;
  experiment: string | null;
  timeline: string | null;
  measure: string | null;
  results: string | null;
  driverGroup: string | null;
};

type Assumption = {
  id: number;
  assumptionType: string;
  assumptionText: string;
  experiments: Experiment[];
};

type Plan = {
  id: number;
  planName: string;
  timeframe: string | null;
  idealState: string | null;
  clientProblem: string | null;
  status: string;
  productId: number | null;
  assumptions: Assumption[];
};

type ProductOption = { id: number; productName: string };

const field =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";

type AssumptionModalState =
  | { open: false }
  | { open: true; mode: "add"; type: "CA" | "LOF" }
  | { open: true; mode: "edit"; assumption: Assumption };

type ExperimentModalState =
  | { open: false }
  | { open: true; mode: "add"; assumptionId: number }
  | { open: true; mode: "edit"; assumptionId: number; experiment: Experiment };

export function LearningPlanDetailClient({
  plan,
  products,
}: {
  plan: Plan;
  products: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [planEditOpen, setPlanEditOpen] = useState(false);
  const [assumptionModal, setAssumptionModal] = useState<AssumptionModalState>({
    open: false,
  });
  const [experimentModal, setExperimentModal] = useState<ExperimentModalState>({
    open: false,
  });

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  const criticalAssumptions = plan.assumptions.filter(
    (a) => a.assumptionType === "CA",
  );
  const leapsOfFaith = plan.assumptions.filter(
    (a) => a.assumptionType === "LOF",
  );
  const productName =
    products.find((p) => p.id === plan.productId)?.productName ?? null;

  return (
    <div className="space-y-8">
      {/* Header block */}
      <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {plan.planName}
              {plan.timeframe ? (
                <span className="ml-2 text-base font-normal text-zinc-500">
                  {plan.timeframe}
                </span>
              ) : null}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <Badge variant={plan.status === "Active" ? "success" : "muted"}>
                {plan.status}
              </Badge>
              {productName ? <span>{productName}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPlanEditOpen(true)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Edit details
            </button>
            <ConfirmDialog
              title="Delete learning plan?"
              description="This permanently deletes the plan and all its assumptions and experiments."
              confirmLabel="Delete"
              trigger={<span className="text-sm">Delete</span>}
              onConfirm={() =>
                new Promise<void>((resolve) => {
                  run(async () => {
                    await deleteLearningPlan(plan.id);
                    router.push("/learning-plans");
                    resolve();
                  });
                })
              }
            />
          </div>
        </div>
        <dl className="grid gap-6 px-6 py-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Ideal state
            </dt>
            <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {plan.idealState || (
                <span className="text-zinc-400">Not set</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Client problem
            </dt>
            <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {plan.clientProblem || (
                <span className="text-zinc-400">Not set</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Key Unknowns */}
      <section className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="bg-emerald-600 px-6 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Key Unknowns — What We Are Solving For
          </h2>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {/* Critical Assumptions */}
          <div className="px-6 py-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Critical Assumptions
              </h3>
              <button
                type="button"
                onClick={() =>
                  setAssumptionModal({ open: true, mode: "add", type: "CA" })
                }
                className="text-sm font-medium text-brand hover:underline dark:text-teal-300"
              >
                + Add CA
              </button>
            </div>
            {criticalAssumptions.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No critical assumptions yet.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {criticalAssumptions.map((a, i) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  >
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        CA {i + 1}.
                      </span>{" "}
                      {a.assumptionText}
                    </span>
                    <RowActions
                      onEdit={() =>
                        setAssumptionModal({
                          open: true,
                          mode: "edit",
                          assumption: a,
                        })
                      }
                      onDelete={() =>
                        run(() => deleteAssumptionRow(a.id))
                      }
                      deleteDescription="Delete this assumption and all its experiments?"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Leaps of Faith */}
          <div className="px-6 py-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Leaps of Faith
              </h3>
              <button
                type="button"
                onClick={() =>
                  setAssumptionModal({ open: true, mode: "add", type: "LOF" })
                }
                className="text-sm font-medium text-brand hover:underline dark:text-teal-300"
              >
                + Add LOF
              </button>
            </div>
            {leapsOfFaith.length === 0 ? (
              <p className="text-sm text-zinc-400">No leaps of faith yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {leapsOfFaith.map((a, i) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-lg bg-amber-50/60 px-2 py-1.5 dark:bg-amber-950/20"
                  >
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        LOF #{i + 1}:
                      </span>{" "}
                      {a.assumptionText}
                    </span>
                    <RowActions
                      onEdit={() =>
                        setAssumptionModal({
                          open: true,
                          mode: "edit",
                          assumption: a,
                        })
                      }
                      onDelete={() => run(() => deleteAssumptionRow(a.id))}
                      deleteDescription="Delete this leap of faith?"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Experiment matrices per critical assumption */}
      {criticalAssumptions.map((a, i) => (
        <section
          key={a.id}
          className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between gap-3 bg-zinc-800 px-6 py-3 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-white">
              CA#{i + 1}: {a.assumptionText}
            </h3>
            <button
              type="button"
              onClick={() =>
                setExperimentModal({
                  open: true,
                  mode: "add",
                  assumptionId: a.id,
                })
              }
              className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
            >
              + Add row
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-orange-50 text-xs font-semibold uppercase tracking-wide text-orange-800 dark:border-zinc-800 dark:bg-orange-950/30 dark:text-orange-200">
                <tr>
                  <th className="px-3 py-2">Mode</th>
                  <th className="px-3 py-2">Hypothesis</th>
                  <th className="px-3 py-2">Experiment</th>
                  <th className="px-3 py-2">Timeline</th>
                  <th className="px-3 py-2">Measure</th>
                  <th className="px-3 py-2">Results</th>
                  <th className="px-3 py-2">Driver / Group</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {a.experiments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-4 text-center text-zinc-400"
                    >
                      No experiments yet. Add a row to start testing this
                      assumption.
                    </td>
                  </tr>
                ) : (
                  a.experiments.map((e) => (
                    <tr
                      key={e.id}
                      className="align-top hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                    >
                      <td className="px-3 py-2">
                        <Badge
                          variant={
                            e.mode === "Go Do" ? "warning" : "default"
                          }
                        >
                          {e.mode}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                        {e.hypothesis || "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                        {e.experiment || "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                        {e.timeline || "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                        {e.measure || "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                        {e.results || "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                        {e.driverGroup || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <RowActions
                          onEdit={() =>
                            setExperimentModal({
                              open: true,
                              mode: "edit",
                              assumptionId: a.id,
                              experiment: e,
                            })
                          }
                          onDelete={() =>
                            run(() => deleteExperimentRow(e.id))
                          }
                          deleteDescription="Delete this experiment row?"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Edit plan details modal */}
      <Modal
        open={planEditOpen}
        title="Edit plan details"
        onClose={() => setPlanEditOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              onClick={() => setPlanEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-plan-form"
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Save
            </button>
          </>
        }
      >
        <form
          id="edit-plan-form"
          action={(fd) => {
            const productIdRaw = String(fd.get("productId") ?? "").trim();
            run(async () => {
              await updateLearningPlan(plan.id, {
                planName: String(fd.get("planName") ?? "").trim(),
                timeframe: String(fd.get("timeframe") ?? "").trim() || null,
                idealState: String(fd.get("idealState") ?? "").trim() || null,
                clientProblem:
                  String(fd.get("clientProblem") ?? "").trim() || null,
                status: String(fd.get("status") ?? "Active"),
                productId: productIdRaw ? Number(productIdRaw) : null,
              });
              setPlanEditOpen(false);
            });
          }}
          className="grid gap-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span>Plan name</span>
            <input
              name="planName"
              required
              defaultValue={plan.planName}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Timeframe</span>
            <input
              name="timeframe"
              defaultValue={plan.timeframe ?? ""}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Product</span>
            <select
              name="productId"
              className={field}
              defaultValue={plan.productId ?? ""}
            >
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
            <textarea
              name="idealState"
              rows={3}
              defaultValue={plan.idealState ?? ""}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Client problem</span>
            <textarea
              name="clientProblem"
              rows={3}
              defaultValue={plan.clientProblem ?? ""}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Status</span>
            <select
              name="status"
              className={field}
              defaultValue={plan.status}
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
        </form>
      </Modal>

      {/* Assumption add/edit modal */}
      <Modal
        open={assumptionModal.open}
        title={
          assumptionModal.open && assumptionModal.mode === "edit"
            ? "Edit assumption"
            : "Add assumption"
        }
        onClose={() => setAssumptionModal({ open: false })}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              onClick={() => setAssumptionModal({ open: false })}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="assumption-form"
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Save
            </button>
          </>
        }
      >
        {assumptionModal.open ? (
          <form
            id="assumption-form"
            action={(fd) => {
              run(async () => {
                if (assumptionModal.mode === "edit") {
                  await updateAssumptionRow(assumptionModal.assumption.id, fd);
                } else {
                  await addAssumptionRow(plan.id, fd);
                }
                setAssumptionModal({ open: false });
              });
            }}
            className="grid gap-4"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span>Type</span>
              <select
                name="assumptionType"
                className={field}
                defaultValue={
                  assumptionModal.mode === "edit"
                    ? assumptionModal.assumption.assumptionType
                    : assumptionModal.type
                }
              >
                <option value="CA">Critical Assumption (CA)</option>
                <option value="LOF">Leap of Faith (LOF)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Statement</span>
              <textarea
                name="assumptionText"
                required
                rows={3}
                defaultValue={
                  assumptionModal.mode === "edit"
                    ? assumptionModal.assumption.assumptionText
                    : ""
                }
                className={field}
              />
            </label>
          </form>
        ) : null}
      </Modal>

      {/* Experiment add/edit modal */}
      <Modal
        open={experimentModal.open}
        title={
          experimentModal.open && experimentModal.mode === "edit"
            ? "Edit experiment"
            : "Add experiment"
        }
        onClose={() => setExperimentModal({ open: false })}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              onClick={() => setExperimentModal({ open: false })}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="experiment-form"
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Save
            </button>
          </>
        }
      >
        {experimentModal.open ? (
          <form
            id="experiment-form"
            action={(fd) => {
              run(async () => {
                if (experimentModal.mode === "edit") {
                  await updateExperimentRow(experimentModal.experiment.id, fd);
                } else {
                  await addExperimentRow(experimentModal.assumptionId, fd);
                }
                setExperimentModal({ open: false });
              });
            }}
            className="grid gap-4"
          >
            {(() => {
              const ex =
                experimentModal.mode === "edit"
                  ? experimentModal.experiment
                  : null;
              return (
                <>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>Mode</span>
                    <select
                      name="mode"
                      className={field}
                      defaultValue={ex?.mode ?? "Go Learn"}
                    >
                      <option value="Go Learn">Go Learn</option>
                      <option value="Go Do">Go Do</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>Hypothesis</span>
                    <textarea
                      name="hypothesis"
                      rows={2}
                      defaultValue={ex?.hypothesis ?? ""}
                      className={field}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>Experiment</span>
                    <textarea
                      name="experiment"
                      rows={2}
                      defaultValue={ex?.experiment ?? ""}
                      className={field}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>Timeline</span>
                    <input
                      name="timeline"
                      placeholder="e.g. Early March, Q4FY26"
                      defaultValue={ex?.timeline ?? ""}
                      className={field}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>Measure</span>
                    <textarea
                      name="measure"
                      rows={2}
                      defaultValue={ex?.measure ?? ""}
                      className={field}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>Results</span>
                    <textarea
                      name="results"
                      rows={2}
                      defaultValue={ex?.results ?? ""}
                      className={field}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>Driver / Group</span>
                    <input
                      name="driverGroup"
                      defaultValue={ex?.driverGroup ?? ""}
                      className={field}
                    />
                  </label>
                </>
              );
            })()}
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  deleteDescription,
}: {
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  deleteDescription: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        Edit
      </button>
      <ConfirmDialog
        title="Confirm delete"
        description={deleteDescription}
        confirmLabel="Delete"
        trigger={<span className="text-xs">Delete</span>}
        onConfirm={onDelete}
      />
    </div>
  );
}
