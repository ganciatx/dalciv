"use client";

import { useState, type ReactNode } from "react";
import {
  addDesiredOutcome,
  addBarrier,
  addRootCause,
  addEmotionalImpact,
  addConstraintRow,
  addAssumption,
  addHypothesis,
  updateDesiredOutcome,
  deleteDesiredOutcome,
  updateBarrier,
  deleteBarrier,
  updateRootCause,
  deleteRootCause,
  updateEmotionalImpact,
  deleteEmotionalImpact,
  updateConstraintRow,
  deleteConstraintRow,
  updateAssumption,
  deleteAssumption,
  updateHypothesis,
  deleteHypothesis,
} from "@/actions/frames";
import type { getFrameForOrg } from "@/actions/frames";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClickToEdit } from "./click-to-edit";

type Frame = NonNullable<Awaited<ReturnType<typeof getFrameForOrg>>>;

export type FrameSectionId =
  | "outcomes"
  | "barriers"
  | "emotional"
  | "constraints"
  | "assumptions"
  | "hypotheses";

const field =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950";
const btnSecondary =
  "rounded-md bg-zinc-200 px-2 py-1 text-sm dark:bg-zinc-700";

/**
 * Lists for frame-attached entities: read as static text; click a row to edit/delete.
 * "Add" rows stay behind a toggle until expanded.
 * When `sections` is set, only those blocks render (for the step workflow).
 */
export function FrameChildSections({
  frame,
  frameId,
  sections,
}: {
  frame: Frame;
  frameId: number;
  /** If omitted, all sections render (legacy full page). */
  sections?: readonly FrameSectionId[];
}) {
  const show = (id: FrameSectionId) => !sections || sections.includes(id);
  const heading = (children: ReactNode) =>
    sections ? (
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {children}
      </h3>
    ) : (
      <h2 className="text-lg font-medium">{children}</h2>
    );
  const [addOutcomeOpen, setAddOutcomeOpen] = useState(false);
  const [addBarrierOpen, setAddBarrierOpen] = useState(false);
  const [addEmotionOpen, setAddEmotionOpen] = useState(false);
  const [addConstraintOpen, setAddConstraintOpen] = useState(false);
  const [addAssumptionOpen, setAddAssumptionOpen] = useState(false);
  const [addHypothesisOpen, setAddHypothesisOpen] = useState(false);
  /** Barrier id for which the "add root cause" inline form is visible. */
  const [addCauseForBarrierId, setAddCauseForBarrierId] = useState<
    number | null
  >(null);

  return (
    <>
      {show("outcomes") ? (
      <section className="mt-8">
        {heading("Desired outcomes")}
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-zinc-800 dark:text-zinc-200">
          {frame.outcomes.map((o) => (
            <li key={o.id} className="marker:text-zinc-400">
              <ClickToEdit
                view={
                  <div>
                    <p>{o.outcomeText}</p>
                    {(o.priorityRank != null || o.jtbdCategory) && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {o.priorityRank != null && (
                          <span>Priority {o.priorityRank}</span>
                        )}
                        {o.priorityRank != null && o.jtbdCategory ? " · " : null}
                        {o.jtbdCategory ? (
                          <span>JTBD: {o.jtbdCategory}</span>
                        ) : null}
                      </p>
                    )}
                  </div>
                }
                edit={
                  <>
                    <form
                      action={updateDesiredOutcome.bind(null, o.id)}
                      className="flex flex-col gap-2"
                    >
                      <textarea
                        name="outcomeText"
                        required
                        defaultValue={o.outcomeText}
                        rows={2}
                        className={field}
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          name="priorityRank"
                          type="number"
                          placeholder="Priority"
                          defaultValue={o.priorityRank ?? ""}
                          className={`${field} w-24`}
                        />
                        <input
                          name="jtbdCategory"
                          placeholder="JTBD category"
                          defaultValue={o.jtbdCategory ?? ""}
                          className={`${field} min-w-[140px] flex-1`}
                        />
                      </div>
                      <button type="submit" className={`${btnSecondary} w-fit`}>
                        Save
                      </button>
                    </form>
                    <div className="mt-2 flex justify-end">
                      <ConfirmDialog
                        title="Delete this outcome?"
                        description="This cannot be undone."
                        confirmLabel="Delete"
                        onConfirm={() => deleteDesiredOutcome(o.id)}
                        trigger={<span className="text-lg leading-none">⋯</span>}
                      />
                    </div>
                  </>
                }
              />
            </li>
          ))}
        </ul>
        <div className="mt-3">
          {!addOutcomeOpen ? (
            <button
              type="button"
              className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
              onClick={() => setAddOutcomeOpen(true)}
            >
              + Add desired outcome
            </button>
          ) : (
            <form
              action={addDesiredOutcome.bind(null, frameId)}
              className="flex flex-wrap gap-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600"
            >
              <input
                name="outcomeText"
                placeholder="New outcome"
                required
                className={`${field} min-w-[200px] flex-1`}
              />
              <button type="submit" className={btnSecondary}>
                Add
              </button>
              <button
                type="button"
                className="text-sm text-zinc-500"
                onClick={() => setAddOutcomeOpen(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </section>
      ) : null}

      {show("barriers") ? (
      <section className="mt-8">
        {heading("Barriers & root causes")}
        <div className="mt-2 space-y-4">
          {frame.barriers.map((b) => (
            <div key={b.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <ClickToEdit
                view={
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {b.barrierText}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {[
                        b.barrierCategory,
                        b.severity && `Severity: ${b.severity}`,
                        b.frequency && `Frequency: ${b.frequency}`,
                        b.impactPercentage != null &&
                          `Impact: ${b.impactPercentage}%`,
                        b.evidenceCount != null && `Evidence: ${b.evidenceCount}`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No metadata"}
                    </p>
                  </div>
                }
                edit={
                  <>
                    <form
                      action={updateBarrier.bind(null, b.id)}
                      className="flex flex-col gap-2 text-sm"
                    >
                      <input
                        name="barrierCategory"
                        placeholder="Category"
                        defaultValue={b.barrierCategory ?? ""}
                        className={field}
                      />
                      <textarea
                        name="barrierText"
                        required
                        defaultValue={b.barrierText}
                        rows={2}
                        className={field}
                      />
                      <p className="text-xs text-zinc-500">
                        Severity: 1 = minor inconvenience · 5 = critical blocker.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <input
                          name="impactPercentage"
                          type="number"
                          step="0.01"
                          placeholder="% impact"
                          defaultValue={b.impactPercentage ?? ""}
                          className={`${field} w-28`}
                        />
                        <select
                          name="severity"
                          defaultValue={b.severity ?? ""}
                          className={field}
                          aria-label="Severity 1–5"
                        >
                          <option value="">Severity (1–5)</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="High">High (legacy)</option>
                          <option value="Medium">Medium (legacy)</option>
                          <option value="Low">Low (legacy)</option>
                        </select>
                        <select
                          name="frequency"
                          defaultValue={b.frequency ?? ""}
                          className={field}
                          aria-label="How often"
                        >
                          <option value="">Frequency</option>
                          <option value="Rare">Rare</option>
                          <option value="Sometimes">Sometimes</option>
                          <option value="Often">Often</option>
                          <option value="Always">Always</option>
                        </select>
                        <input
                          name="evidenceCount"
                          type="number"
                          min={0}
                          placeholder="Evidence #"
                          defaultValue={b.evidenceCount ?? 0}
                          className={`${field} w-28`}
                        />
                      </div>
                      <button type="submit" className={`${btnSecondary} w-fit`}>
                        Save barrier
                      </button>
                    </form>
                    <div className="mt-2 flex justify-end">
                      <ConfirmDialog
                        title="Delete this barrier?"
                        description="Root causes under this barrier will be removed too."
                        confirmLabel="Delete"
                        onConfirm={() => deleteBarrier(b.id)}
                        trigger={<span className="text-lg leading-none">⋯</span>}
                      />
                    </div>
                  </>
                }
              />

              {b.rootCauses.length > 0 ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                  {b.rootCauses.map((c) => (
                    <li key={c.id}>
                      <ClickToEdit
                        className="!p-1"
                        view={
                          <span>
                            {c.causeText}
                            {c.validated ? (
                              <span className="ml-2 text-xs text-green-600">
                                (validated)
                              </span>
                            ) : null}
                          </span>
                        }
                        edit={
                          <>
                            <form
                              action={updateRootCause.bind(null, c.id)}
                              className="flex flex-col gap-2 text-xs"
                            >
                              <textarea
                                name="causeText"
                                required
                                defaultValue={c.causeText}
                                rows={2}
                                className={field}
                              />
                              <div className="flex flex-wrap gap-2">
                                <input
                                  name="causeType"
                                  placeholder="Type"
                                  defaultValue={c.causeType ?? ""}
                                  className={`${field} flex-1`}
                                />
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    name="validated"
                                    defaultChecked={c.validated === true}
                                  />
                                  Validated
                                </label>
                              </div>
                              <input
                                name="validationMethod"
                                placeholder="Validation method"
                                defaultValue={c.validationMethod ?? ""}
                                className={field}
                              />
                              <button type="submit" className={`${btnSecondary} w-fit`}>
                                Save cause
                              </button>
                            </form>
                            <div className="mt-2 flex justify-end">
                              <ConfirmDialog
                                title="Delete this root cause?"
                                confirmLabel="Delete"
                                onConfirm={() => deleteRootCause(c.id)}
                                trigger={<span className="text-lg leading-none">⋯</span>}
                              />
                            </div>
                          </>
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-2 border-t border-dashed border-zinc-200 pt-2 dark:border-zinc-700">
                {addCauseForBarrierId !== b.id ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
                    onClick={() => setAddCauseForBarrierId(b.id)}
                  >
                    + Add root cause
                  </button>
                ) : (
                  <form
                    action={addRootCause.bind(null, b.id)}
                    className="flex flex-wrap gap-2 text-xs"
                  >
                    <input
                      name="causeText"
                      placeholder="New root cause"
                      required
                      className={`${field} flex-1`}
                    />
                    <button type="submit" className={btnSecondary}>
                      Add
                    </button>
                    <button
                      type="button"
                      className="text-zinc-500"
                      onClick={() => setAddCauseForBarrierId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          {!addBarrierOpen ? (
            <button
              type="button"
              className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
              onClick={() => setAddBarrierOpen(true)}
            >
              + Add barrier
            </button>
          ) : (
            <form
              action={addBarrier.bind(null, frameId)}
              className="flex flex-col gap-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600"
            >
              <input
                name="barrierText"
                placeholder="New barrier"
                required
                className={`${field} min-w-[200px] flex-1`}
              />
              <div className="flex flex-wrap gap-2">
                <select name="severity" className={field} aria-label="Severity">
                  <option value="">Severity (1–5)</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
                <select name="frequency" className={field}>
                  <option value="">Frequency</option>
                  <option value="Rare">Rare</option>
                  <option value="Sometimes">Sometimes</option>
                  <option value="Often">Often</option>
                  <option value="Always">Always</option>
                </select>
              </div>
              <button type="submit" className={`${btnSecondary} w-fit`}>
                Add
              </button>
              <button
                type="button"
                className="text-sm text-zinc-500"
                onClick={() => setAddBarrierOpen(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </section>
      ) : null}

      {show("emotional") ? (
      <section className="mt-8">
        {heading("Emotional impacts")}
        <p className="mt-1 text-xs text-zinc-500">
          Intensity: 1 = mild · 5 = overwhelming.
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
          {frame.emotionalImpacts.map((e) => (
            <li key={e.id}>
              <ClickToEdit
                view={
                  <div>
                    <p>{e.emotionText}</p>
                    {(e.emotionCategory || e.intensity != null) && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {e.emotionCategory}
                        {e.emotionCategory && e.intensity != null ? " · " : null}
                        {e.intensity != null ? `Intensity ${e.intensity}/5` : null}
                      </p>
                    )}
                  </div>
                }
                edit={
                  <>
                    <form
                      action={updateEmotionalImpact.bind(null, e.id)}
                      className="flex flex-col gap-2"
                    >
                      <textarea
                        name="emotionText"
                        required
                        defaultValue={e.emotionText}
                        rows={2}
                        className={field}
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          name="emotionCategory"
                          placeholder="Category"
                          defaultValue={e.emotionCategory ?? ""}
                          className={`${field} flex-1`}
                        />
                        <input
                          name="intensity"
                          type="number"
                          min={1}
                          max={5}
                          placeholder="1–5"
                          defaultValue={e.intensity ?? ""}
                          className={`${field} w-20`}
                        />
                      </div>
                      <button type="submit" className={`${btnSecondary} w-fit`}>
                        Save
                      </button>
                    </form>
                    <div className="mt-2 flex justify-end">
                      <ConfirmDialog
                        title="Delete this emotional impact?"
                        confirmLabel="Delete"
                        onConfirm={() => deleteEmotionalImpact(e.id)}
                        trigger={<span className="text-lg leading-none">⋯</span>}
                      />
                    </div>
                  </>
                }
              />
            </li>
          ))}
        </ul>
        <div className="mt-3">
          {!addEmotionOpen ? (
            <button
              type="button"
              className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
              onClick={() => setAddEmotionOpen(true)}
            >
              + Add emotional impact
            </button>
          ) : (
            <form
              action={addEmotionalImpact.bind(null, frameId)}
              className="flex gap-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600"
            >
              <input
                name="emotionText"
                placeholder="New emotion"
                required
                className={`${field} flex-1`}
              />
              <button type="submit" className={btnSecondary}>
                Add
              </button>
              <button
                type="button"
                className="text-sm text-zinc-500"
                onClick={() => setAddEmotionOpen(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </section>
      ) : null}

      {show("constraints") ? (
      <section className="mt-8">
        {heading("Constraints")}
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
          {frame.constraints.map((c) => (
            <li key={c.id}>
              <ClickToEdit
                view={
                  <div>
                    <p>{c.constraintText}</p>
                    {(c.constraintType || c.isModifiable === false) && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {c.constraintType}
                        {c.constraintType && c.isModifiable === false
                          ? " · "
                          : null}
                        {c.isModifiable === false ? "Not modifiable" : null}
                      </p>
                    )}
                  </div>
                }
                edit={
                  <>
                    <form
                      action={updateConstraintRow.bind(null, c.id)}
                      className="flex flex-col gap-2"
                    >
                      <input
                        name="constraintType"
                        placeholder="Type"
                        defaultValue={c.constraintType ?? ""}
                        className={field}
                      />
                      <textarea
                        name="constraintText"
                        required
                        defaultValue={c.constraintText}
                        rows={2}
                        className={field}
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="isModifiable"
                          defaultChecked={c.isModifiable !== false}
                        />
                        Modifiable
                      </label>
                      <button type="submit" className={`${btnSecondary} w-fit`}>
                        Save
                      </button>
                    </form>
                    <div className="mt-2 flex justify-end">
                      <ConfirmDialog
                        title="Delete this constraint?"
                        confirmLabel="Delete"
                        onConfirm={() => deleteConstraintRow(c.id)}
                        trigger={<span className="text-lg leading-none">⋯</span>}
                      />
                    </div>
                  </>
                }
              />
            </li>
          ))}
        </ul>
        <div className="mt-3">
          {!addConstraintOpen ? (
            <button
              type="button"
              className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
              onClick={() => setAddConstraintOpen(true)}
            >
              + Add constraint
            </button>
          ) : (
            <form
              action={addConstraintRow.bind(null, frameId)}
              className="flex flex-wrap gap-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600"
            >
              <input
                name="constraintText"
                placeholder="New constraint"
                required
                className={`${field} flex-1`}
              />
              <button type="submit" className={btnSecondary}>
                Add
              </button>
              <button
                type="button"
                className="text-sm text-zinc-500"
                onClick={() => setAddConstraintOpen(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </section>
      ) : null}

      {show("assumptions") ? (
      <section className="mt-8">
        {heading("Assumptions")}
        <ul className="mt-2 space-y-2 text-sm">
          {frame.assumptions.map((a) => (
            <li key={a.id}>
              <ClickToEdit
                view={
                  <div>
                    <p>
                      {a.assumptionCode ? (
                        <span className="font-mono text-zinc-600 dark:text-zinc-400">
                          {a.assumptionCode}{" "}
                        </span>
                      ) : null}
                      {a.assumptionText}
                    </p>
                    {a.validationStatus && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {a.validationStatus}
                        {a.validationDate ? ` · ${a.validationDate}` : ""}
                      </p>
                    )}
                  </div>
                }
                edit={
                  <>
                    <form
                      action={updateAssumption.bind(null, a.id)}
                      className="flex flex-col gap-2 text-sm"
                    >
                      <input
                        name="assumptionCode"
                        placeholder="Code (e.g. A1)"
                        defaultValue={a.assumptionCode ?? ""}
                        className={field}
                      />
                      <textarea
                        name="assumptionText"
                        required
                        defaultValue={a.assumptionText}
                        rows={2}
                        className={field}
                      />
                      <div className="flex flex-wrap gap-2">
                        <select
                          name="validationStatus"
                          defaultValue={a.validationStatus ?? ""}
                          className={field}
                        >
                          <option value="">Validation status</option>
                          <option value="Unvalidated">Unvalidated</option>
                          <option value="Pending">Pending</option>
                          <option value="Validated">Validated</option>
                          <option value="Invalidated">Invalidated</option>
                        </select>
                        <input
                          name="validationDate"
                          type="date"
                          defaultValue={a.validationDate ?? ""}
                          className={field}
                        />
                      </div>
                      <textarea
                        name="validationNotes"
                        placeholder="Validation notes"
                        defaultValue={a.validationNotes ?? ""}
                        rows={2}
                        className={field}
                      />
                      <button type="submit" className={`${btnSecondary} w-fit`}>
                        Save
                      </button>
                    </form>
                    <div className="mt-2 flex justify-end">
                      <ConfirmDialog
                        title="Delete this assumption?"
                        confirmLabel="Delete"
                        onConfirm={() => deleteAssumption(a.id)}
                        trigger={<span className="text-lg leading-none">⋯</span>}
                      />
                    </div>
                  </>
                }
              />
            </li>
          ))}
        </ul>
        <div className="mt-3">
          {!addAssumptionOpen ? (
            <button
              type="button"
              className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
              onClick={() => setAddAssumptionOpen(true)}
            >
              + Add assumption
            </button>
          ) : (
            <form
              action={addAssumption.bind(null, frameId)}
              className="flex flex-wrap gap-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600"
            >
              <input
                name="assumptionText"
                placeholder="New assumption"
                required
                className={`${field} flex-1`}
              />
              <button type="submit" className={btnSecondary}>
                Add
              </button>
              <button
                type="button"
                className="text-sm text-zinc-500"
                onClick={() => setAddAssumptionOpen(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </section>
      ) : null}

      {show("hypotheses") ? (
      <section className="mt-8">
        {heading("Hypotheses")}
        <div className="mt-2 space-y-3 text-sm">
          {frame.hypotheses.map((h) => {
            const barrierLabel =
              frame.barriers.find((b) => b.id === h.barrierId)?.barrierText ??
              `Barrier #${h.barrierId}`;
            return (
              <div key={h.id}>
                <ClickToEdit
                  view={
                    <div>
                      <p className="font-medium">{h.hypothesisTitle}</p>
                      <p className="mt-1 text-zinc-500">
                        {barrierLabel.slice(0, 100)}
                        {barrierLabel.length > 100 ? "…" : ""}
                      </p>
                      {(h.status || h.effort || h.impact) && (
                        <p className="mt-1 text-xs text-zinc-500">
                          {[h.status, h.effort, h.impact, h.confidence]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  }
                  edit={
                    <>
                      <form
                        action={updateHypothesis.bind(null, h.id)}
                        className="flex flex-col gap-2"
                      >
                        <label className="flex flex-col gap-1 text-xs">
                          <span>Barrier</span>
                          <select
                            name="barrierId"
                            required
                            defaultValue={h.barrierId}
                            className={field}
                          >
                            {frame.barriers.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.barrierText.slice(0, 80)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <input
                          name="hypothesisTitle"
                          required
                          defaultValue={h.hypothesisTitle}
                          className={field}
                        />
                        <input
                          name="ifStatement"
                          placeholder="If…"
                          defaultValue={h.ifStatement ?? ""}
                          className={field}
                        />
                        <input
                          name="thenStatement"
                          placeholder="Then…"
                          defaultValue={h.thenStatement ?? ""}
                          className={field}
                        />
                        <input
                          name="becauseStatement"
                          placeholder="Because…"
                          defaultValue={h.becauseStatement ?? ""}
                          className={field}
                        />
                        <div className="flex flex-wrap gap-2">
                          <input
                            name="priority"
                            type="number"
                            placeholder="Priority"
                            defaultValue={h.priority ?? ""}
                            className={`${field} w-24`}
                          />
                          <select
                            name="effort"
                            defaultValue={h.effort ?? ""}
                            className={field}
                          >
                            <option value="">Effort</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                          <select
                            name="impact"
                            defaultValue={h.impact ?? ""}
                            className={field}
                          >
                            <option value="">Impact</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                          <select
                            name="confidence"
                            defaultValue={h.confidence ?? ""}
                            className={field}
                          >
                            <option value="">Confidence</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                          <select
                            name="status"
                            defaultValue={h.status ?? "Proposed"}
                            className={field}
                          >
                            <option value="Proposed">Proposed</option>
                            <option value="Testing">Testing</option>
                            <option value="Validated">Validated</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                        <button type="submit" className={`${btnSecondary} w-fit`}>
                          Save hypothesis
                        </button>
                      </form>
                      <div className="mt-2 flex justify-end">
                        <ConfirmDialog
                          title="Delete this hypothesis?"
                          confirmLabel="Delete"
                          onConfirm={() => deleteHypothesis(h.id)}
                          trigger={<span className="text-lg leading-none">⋯</span>}
                        />
                      </div>
                    </>
                  }
                />
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          {!addHypothesisOpen ? (
            <button
              type="button"
              className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
              onClick={() => setAddHypothesisOpen(true)}
            >
              + Add hypothesis
            </button>
          ) : (
            <form
              action={addHypothesis.bind(null, frameId)}
              className="grid gap-2 rounded-lg border border-dashed border-zinc-300 p-3 md:grid-cols-2 dark:border-zinc-600"
            >
              <label className="flex flex-col gap-1 text-xs md:col-span-2">
                <span>Barrier</span>
                <select name="barrierId" required className={field}>
                  <option value="">Select…</option>
                  {frame.barriers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.barrierText.slice(0, 80)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs md:col-span-2">
                <span>Title</span>
                <input name="hypothesisTitle" required className={field} />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span>If</span>
                <input name="ifStatement" className={field} />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span>Then</span>
                <input name="thenStatement" className={field} />
              </label>
              <label className="flex flex-col gap-1 text-xs md:col-span-2">
                <span>Because</span>
                <input name="becauseStatement" className={field} />
              </label>
              <div className="flex gap-2 md:col-span-2">
                <button type="submit" className={btnSecondary}>
                  Add hypothesis
                </button>
                <button
                  type="button"
                  className="text-sm text-zinc-500"
                  onClick={() => setAddHypothesisOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
      ) : null}
    </>
  );
}
