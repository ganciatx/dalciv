"use client";

import { useState } from "react";

type Props = {
  /**
   * Read-only content (styled like normal page copy — no inputs).
   * Clicking anywhere on this shell opens the edit form.
   */
  view: React.ReactNode;
  /** Server-action forms and controls (Save, Delete). Hidden until opened. */
  edit: React.ReactNode;
  /** Extra classes for the collapsed (static) container. */
  className?: string;
};

/**
 * Click-to-edit shell: shows static text first; expands to inputs on click.
 * Cancel closes without submitting (unsaved edits are discarded on next open after refresh).
 */
export function ClickToEdit({ view, edit, className = "" }: Props) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="rounded-lg border border-zinc-300 bg-zinc-50/90 p-3 dark:border-zinc-600 dark:bg-zinc-900/60">
        {edit}
        <button
          type="button"
          className="mt-3 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`cursor-pointer rounded-lg border border-transparent p-2 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/40 ${className}`}
      onClick={() => setOpen(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
        }
      }}
    >
      {view}
    </div>
  );
}
