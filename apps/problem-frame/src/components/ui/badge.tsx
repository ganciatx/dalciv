type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "success" | "muted" | "warning";
};

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:
    "bg-[#337882]/15 text-[#2a5f66] dark:bg-[#337882]/25 dark:text-[#7ec4cc]",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  muted: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
