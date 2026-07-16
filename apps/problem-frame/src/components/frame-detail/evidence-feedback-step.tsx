"use client";

import { addCustomerFeedback, linkFeedbackToBarrier } from "@/actions/frames";
import type { getFrameForOrg } from "@/actions/frames";

type Frame = NonNullable<Awaited<ReturnType<typeof getFrameForOrg>>>;

type FeedbackRow = {
  id: number;
  commentText: string;
  responseDate: string | null;
  questionType: string | null;
  theme: string | null;
  sentiment: string | null;
  createdAt: Date | null;
};

const field =
  "rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950";

/**
 * Step 6: product-level feedback capture + linking evidence to barriers on this frame.
 */
export function EvidenceFeedbackStep({
  productId,
  frame,
  feedbackRows,
}: {
  productId: number;
  frame: Frame;
  feedbackRows: FeedbackRow[];
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Customer feedback
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Log qualitative evidence for this product. Entries appear on all frames under this
          product.
        </p>
        {feedbackRows.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No feedback yet. Add a note from research or support to build your evidence base.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {feedbackRows.map((fb) => (
              <li
                key={fb.id}
                className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <p className="text-zinc-900 dark:text-zinc-100">{fb.commentText}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {fb.questionType ? `${fb.questionType} · ` : ""}
                  {fb.theme ? `${fb.theme} · ` : ""}
                  {fb.sentiment ?? "—"}
                  {fb.responseDate ? ` · ${fb.responseDate}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        <form
          action={addCustomerFeedback.bind(null, productId)}
          className="mt-6 flex flex-wrap items-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700"
        >
          <label className="flex flex-col gap-1 text-xs">
            <span>Date</span>
            <input name="responseDate" type="date" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span>Source</span>
            <input name="questionType" className={field} placeholder="Interview, survey…" />
          </label>
          <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-xs">
            <span>Comment</span>
            <textarea name="commentText" required rows={2} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span>Theme</span>
            <input name="theme" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span>Sentiment</span>
            <select name="sentiment" className={field}>
              <option value="">—</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
              <option value="Neutral">Neutral</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add feedback
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Link feedback to a barrier
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Connect a feedback item to a barrier on this frame to show evidence relationships.
        </p>
        <form action={linkFeedbackToBarrier} className="mt-4 flex flex-wrap gap-2 text-sm">
          <select name="feedbackId" required className={field}>
            <option value="">Feedback…</option>
            {feedbackRows.map((fb) => (
              <option key={fb.id} value={fb.id}>
                #{fb.id} {fb.commentText.slice(0, 48)}
                {fb.commentText.length > 48 ? "…" : ""}
              </option>
            ))}
          </select>
          <select name="barrierId" required className={field}>
            <option value="">Barrier…</option>
            {frame.barriers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.barrierText.slice(0, 72)}
                {b.barrierText.length > 72 ? "…" : ""}
              </option>
            ))}
          </select>
          <input
            name="relevanceScore"
            type="number"
            step="0.01"
            min="0"
            max="1"
            placeholder="0–1"
            className={`${field} w-24`}
          />
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 dark:border-zinc-600"
          >
            Link
          </button>
        </form>
      </section>
    </div>
  );
}
