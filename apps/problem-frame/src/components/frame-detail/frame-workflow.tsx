"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { patchProblemFrame, saveFrameVersion } from "@/actions/frames";
import type { getFrameForOrg } from "@/actions/frames";
import { AutosaveIndicator } from "@/components/ui/autosave-indicator";
import { useAutosavePatch } from "@/hooks/use-autosave-patch";
import {
  completedStepCount,
  stepLabel,
  stepStates,
  type FrameModel,
} from "@/lib/workflow-step-status";
import { EvidenceFeedbackStep } from "./evidence-feedback-step";
import { FrameChildSections } from "./frame-child-sections";

const STEPS = [
  { id: 1, title: "Define Problem" },
  { id: 2, title: "Understand User" },
  { id: 3, title: "Define Outcomes" },
  { id: 4, title: "Constraints & Assumptions" },
  { id: 5, title: "Hypotheses" },
  { id: 6, title: "Evidence & Feedback" },
] as const;

const field =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";

type PersonaOption = { id: number; personaName: string };

type VersionRow = {
  id: number;
  versionNumber: number;
  label: string | null;
  createdAt: Date | null;
};

type FeedbackRow = {
  id: number;
  commentText: string;
  responseDate: string | null;
  questionType: string | null;
  theme: string | null;
  sentiment: string | null;
  createdAt: Date | null;
};

export function FrameWorkflow({
  frame,
  frameId,
  productId,
  personas,
  versions,
  feedbackRows,
}: {
  frame: FrameModel;
  frameId: number;
  productId: number;
  personas: PersonaOption[];
  versions: VersionRow[];
  feedbackRows: FeedbackRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStep = Number(searchParams.get("step"));
  const step = useMemo(() => {
    if (!Number.isFinite(rawStep) || rawStep < 1) return 1;
    if (rawStep > 6) return 6;
    return rawStep;
  }, [rawStep]);

  const feedbackCount = feedbackRows.length;
  const states = stepStates(frame, feedbackCount);
  const done = completedStepCount(frame, feedbackCount);

  function goToStep(n: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("step", String(n));
    router.push(`?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
      <nav
        className="lg:w-56 lg:shrink-0"
        aria-label="Problem frame steps"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Workflow
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {done} of 6 complete
        </p>
        <ol className="mt-4 space-y-1">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const st = states[i];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goToStep(s.id)}
                  className={`flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-[#337882]/15 font-medium text-[#2a5f66] dark:bg-[#337882]/25 dark:text-[#9fd4dc]"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span>
                      {s.id}. {s.title}
                    </span>
                  </span>
                  <span className="mt-0.5 text-xs font-normal text-zinc-500">
                    {stepLabel(st)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="min-w-0 flex-1 space-y-6">
        {step === 1 ? (
          <StepDefineProblem
            frame={frame}
            frameId={frameId}
            personas={personas}
            versions={versions}
            productId={productId}
          />
        ) : null}

        {step === 2 ? (
          <section className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Understand User
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Barriers block progress; emotional impacts capture how the problem feels.
            </p>
            <div className="mt-6 space-y-10">
              <FrameChildSections
                frame={frame}
                frameId={frameId}
                sections={["barriers", "emotional"]}
              />
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Define Outcomes
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              What success looks like if this problem is solved well.
            </p>
            <div className="mt-6">
              <FrameChildSections
                frame={frame}
                frameId={frameId}
                sections={["outcomes"]}
              />
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Constraints & Assumptions
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Real-world limits and beliefs that shape your solution space.
            </p>
            <div className="mt-6 space-y-10">
              <FrameChildSections
                frame={frame}
                frameId={frameId}
                sections={["constraints", "assumptions"]}
              />
            </div>
          </section>
        ) : null}

        {step === 5 ? (
          <section className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Hypotheses
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              What you believe will work — tied to a barrier, with an explicit confidence
              level.
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Hypothesis: what do you believe will solve this problem?
            </p>
            <div className="mt-6">
              <FrameChildSections
                frame={frame}
                frameId={frameId}
                sections={["hypotheses"]}
              />
            </div>
          </section>
        ) : null}

        {step === 6 ? (
          <section className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Evidence & Feedback
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Ground the frame in real signals from customers and stakeholders.
            </p>
            <div className="mt-6">
              <EvidenceFeedbackStep
                productId={productId}
                frame={frame}
                feedbackRows={feedbackRows}
              />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function StepDefineProblem({
  frame,
  frameId,
  productId,
  personas,
  versions,
}: {
  frame: FrameModel;
  frameId: number;
  productId: number;
  personas: PersonaOption[];
  versions: VersionRow[];
}) {
  const { status, update, onBlurSave } = useAutosavePatch(frameId, patchProblemFrame, {
    frameTitle: frame.frameTitle,
    problemStatement: frame.problemStatement,
    status: frame.status,
    personaId: frame.personaId,
  });

  const [frameTitle, setFrameTitle] = useState(frame.frameTitle);
  const [problemStatement, setProblemStatement] = useState(
    frame.problemStatement ?? "",
  );
  const [statusVal, setStatusVal] = useState(frame.status);
  const [personaId, setPersonaId] = useState(String(frame.personaId));

  useEffect(() => {
    setFrameTitle(frame.frameTitle);
    setProblemStatement(frame.problemStatement ?? "");
    setStatusVal(frame.status);
    setPersonaId(String(frame.personaId));
  }, [
    frame.frameTitle,
    frame.problemStatement,
    frame.status,
    frame.personaId,
    frame.lastUpdated,
  ]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Define Problem
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Title, statement, persona, and status auto-save when you leave a field or pause
            typing.
          </p>
        </div>
        <AutosaveIndicator status={status} />
      </div>

      <div className="mt-6 grid gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Title <span className="text-red-600">*</span>
          </span>
          <input
            className={field}
            value={frameTitle}
            onChange={(e) => {
              setFrameTitle(e.target.value);
              update({ frameTitle: e.target.value });
            }}
            onBlur={onBlurSave}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Problem statement
          </span>
          <textarea
            className={field}
            rows={4}
            value={problemStatement}
            onChange={(e) => {
              setProblemStatement(e.target.value);
              update({ problemStatement: e.target.value || null });
            }}
            onBlur={onBlurSave}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Persona
            </span>
            <select
              className={field}
              value={personaId}
              onChange={(e) => {
                const v = e.target.value;
                setPersonaId(v);
                update({ personaId: Number(v) });
              }}
              onBlur={onBlurSave}
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.personaName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Status
            </span>
            <select
              className={field}
              value={statusVal}
              onChange={(e) => {
                setStatusVal(e.target.value);
                update({ status: e.target.value });
              }}
              onBlur={onBlurSave}
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Validated">Validated</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Version history
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Snapshots are manual checkpoints; day-to-day edits use auto-save above.
        </p>
        <form
          action={saveFrameVersion.bind(null, frameId)}
          className="mt-3 flex flex-wrap items-end gap-2"
        >
          <label className="flex flex-col gap-1 text-xs">
            <span>Label</span>
            <input
              name="label"
              placeholder="optional"
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
          >
            Save snapshot
          </button>
        </form>
        <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {versions.length === 0 ? (
            <li>No snapshots yet.</li>
          ) : (
            versions.map((v) => (
              <li key={v.id}>
                v{v.versionNumber}
                {v.label ? ` — ${v.label}` : ""}{" "}
                <span className="text-zinc-400">
                  ({v.createdAt ? new Date(v.createdAt).toLocaleString() : "—"})
                </span>
              </li>
            ))
          )}
        </ul>
        <p className="mt-2 text-xs text-zinc-500">
          Current version: {frame.version} ·{" "}
          <Link
            href={`/products/${productId}/frames`}
            className="text-[#337882] underline hover:no-underline"
          >
            Back to frames
          </Link>
        </p>
      </div>
    </section>
  );
}
