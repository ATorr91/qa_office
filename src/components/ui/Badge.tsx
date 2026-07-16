import type { ReactNode } from "react";

export type BadgeColor = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  success: "bg-[var(--bp-success)]/10 text-[#3f6b29] border-[var(--bp-success)]/25",
  warning: "bg-[var(--bp-warning)]/15 text-[#6b6418] border-[var(--bp-warning)]/30",
  danger: "bg-[var(--bp-danger)]/10 text-[var(--bp-danger)] border-[var(--bp-danger)]/25",
  info: "bg-[var(--bp-info)]/10 text-[var(--bp-blue-600)] border-[var(--bp-info)]/25",
  neutral: "bg-[var(--bp-surface-alt)] text-[var(--bp-ink-soft)] border-[var(--bp-border)]",
};

const DOT_CLASSES: Record<BadgeColor, string> = {
  success: "bg-[var(--bp-success)]",
  warning: "bg-[#b8ae1f]",
  danger: "bg-[var(--bp-danger)]",
  info: "bg-[var(--bp-info)]",
  neutral: "bg-[var(--bp-ink-soft)]",
};

/** Compact status pill for QA report metrics, styled after dense dashboard badges. */
export function Badge({ color = "neutral", children, className = "", dot = true }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--bp-radius-pill)] border px-2 py-0.5 text-[11px] font-medium leading-4 ${COLOR_CLASSES[color]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[color]}`} />}
      {children}
    </span>
  );
}

export default Badge;
