"use client";

import { useState } from "react";
import { Modal } from "./modal";

type ConfirmDialogProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  trigger: React.ReactNode;
  onConfirm: () => void | Promise<void>;
};

/**
 * Confirmation modal for destructive or important actions (replaces window.confirm in the UX spec).
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  trigger,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label="More actions"
        onClick={() => setOpen(true)}
      >
        {trigger}
      </button>
      <Modal
        open={open}
        title={title}
        onClose={() => !pending && setOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm text-white ${
                danger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              }`}
              disabled={pending}
              onClick={() => void handleConfirm()}
            >
              {pending ? "…" : confirmLabel}
            </button>
          </>
        }
      >
        {description ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        ) : null}
      </Modal>
    </>
  );
}
