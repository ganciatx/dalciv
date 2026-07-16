"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createProblemFrame } from "@/actions/frames";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

type FrameRow = {
  id: number;
  frameTitle: string;
  status: string;
  lastUpdated: Date;
  createdDate: string | null;
  persona: { id: number; personaName: string } | null;
  barrierCount: number;
  hypothesisCount: number;
};

type PersonaOpt = { id: number; personaName: string };

const field =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";

type SortKey = "lastUpdated" | "created";

export function FramesListClient({
  productId,
  productName,
  frames,
  personas,
}: {
  productId: number;
  productName: string;
  frames: FrameRow[];
  personas: PersonaOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [personaFilter, setPersonaFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("lastUpdated");

  const filtered = useMemo(() => {
    let list = [...frames];
    if (personaFilter) {
      list = list.filter((f) => String(f.persona?.id ?? "") === personaFilter);
    }
    if (statusFilter) {
      list = list.filter((f) => f.status === statusFilter);
    }
    list.sort((a, b) => {
      if (sort === "lastUpdated") {
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      }
      const ad = a.createdDate ?? "";
      const bd = b.createdDate ?? "";
      return bd.localeCompare(ad);
    });
    return list;
  }, [frames, personaFilter, statusFilter, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + New Problem Frame
        </button>
      </div>

      <Modal
        open={open}
        title="New problem frame"
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
              form="new-frame-form"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create
            </button>
          </>
        }
      >
        <form
          id="new-frame-form"
          action={async (fd) => {
            await createProblemFrame(fd);
            setOpen(false);
          }}
          className="grid gap-4"
        >
          <input type="hidden" name="productId" value={productId} />
          <label className="flex flex-col gap-1 text-sm">
            <span>Title</span>
            <input name="frameTitle" required className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Persona</span>
            <select name="personaId" required className={field}>
              <option value="">Select…</option>
              {personas.map((pe) => (
                <option key={pe.id} value={pe.id}>
                  {pe.personaName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Problem statement (optional)</span>
            <textarea name="problemStatement" rows={3} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Status</span>
            <select name="status" className={field} defaultValue="Draft">
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Validated">Validated</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
        </form>
      </Modal>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Persona
          <select
            className={field}
            value={personaFilter}
            onChange={(e) => setPersonaFilter(e.target.value)}
          >
            <option value="">All</option>
            {personas.map((pe) => (
              <option key={pe.id} value={String(pe.id)}>
                {pe.personaName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Status
          <select
            className={field}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Validated">Validated</option>
            <option value="Archived">Archived</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Sort by
          <select
            className={field}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="lastUpdated">Last updated</option>
            <option value="created">Creation date</option>
          </select>
        </label>
      </div>

      <ul className="mt-8 space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            {frames.length === 0
              ? "No problem frames yet. Create one to start defining user problems."
              : "No frames match your filters."}
          </li>
        ) : (
          filtered.map((f) => (
            <li key={f.id}>
              <Link
                href={`/products/${productId}/frames/${f.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-[#337882]/40 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {f.frameTitle}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Persona: {f.persona?.personaName ?? "—"}
                    </p>
                  </div>
                  <Badge>{f.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                  <span>{f.barrierCount} barriers</span>
                  <span>{f.hypothesisCount} hypotheses</span>
                  <span>
                    Updated {f.lastUpdated.toLocaleString()}
                  </span>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>

      <p className="mt-4 text-xs text-zinc-500">
        Product: <span className="text-zinc-700 dark:text-zinc-300">{productName}</span>
      </p>
    </div>
  );
}
