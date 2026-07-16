"use client";

import { useState } from "react";
import { createPersona } from "@/actions/personas";
import { Modal } from "@/components/ui/modal";

const field =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";

export function PersonaAddModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        + Add Persona
      </button>

      <Modal
        open={open}
        title="Add persona"
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
              form="add-persona-form"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create
            </button>
          </>
        }
      >
        <form
          id="add-persona-form"
          action={async (fd) => {
            await createPersona(fd);
            setOpen(false);
          }}
          className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span>Name</span>
            <input name="personaName" required className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Description</span>
            <textarea name="description" rows={2} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Goals</span>
            <textarea
              name="goals"
              rows={2}
              placeholder="What they are trying to achieve"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Behaviors</span>
            <textarea
              name="behaviors"
              rows={2}
              placeholder="Observable habits and actions"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Context of use</span>
            <textarea
              name="contextOfUse"
              rows={2}
              placeholder="Where and when they use the product"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Tech savviness</span>
            <select name="techSavviness" className={field}>
              <option value="">—</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Segment</span>
            <input name="customerSegment" className={field} />
          </label>
        </form>
      </Modal>
    </>
  );
}
