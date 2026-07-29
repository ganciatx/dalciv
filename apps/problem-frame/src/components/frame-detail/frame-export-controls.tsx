"use client";

import { useState } from "react";

type Format = "pdf" | "csv";

/**
 * Header controls that fetch org-gated export URLs with cookie session.
 * Triggers a same-origin download via blob URL so we can show loading state.
 */
export function FrameExportControls({ frameId }: { frameId: number }) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(format: Format) {
    setError(null);
    setBusy(format);
    try {
      const res = await fetch(`/api/frames/${frameId}/export/${format}`, {
        method: "GET",
        credentials: "same-origin",
      });
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Frame not found." : "Export failed.");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename =
        match?.[1] ??
        (format === "pdf" ? `frame-export.pdf` : `frame-export.zip`);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  }

  const btn =
    "rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          onClick={() => void download("pdf")}
        >
          {busy === "pdf" ? "Exporting…" : "Export PDF"}
        </button>
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          onClick={() => void download("csv")}
        >
          {busy === "csv" ? "Exporting…" : "Export CSV"}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
