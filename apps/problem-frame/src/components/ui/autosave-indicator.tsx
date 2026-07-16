type AutosaveIndicatorProps = {
  status: "idle" | "saving" | "saved" | "error";
};

export function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  if (status === "idle") return null;
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : "Could not save";
  return (
    <span
      className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400"
      aria-live="polite"
    >
      {label}
    </span>
  );
}
