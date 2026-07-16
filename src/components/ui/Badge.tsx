import type { ReactNode } from "react";

export type BadgeColor = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  success: "bg-[var(--bp-success)]/15 text-[#4b7a33]",
  warning: "bg-[var(--bp-warning)]/25 text-[#7a7420]",
  danger: "bg-[var(--bp-danger)]/15 text-[var(--bp-danger)]",
  info: "bg-[var(--bp-info)]/15 text-[var(--bp-blue-600)]",
  neutral: "bg-[var(--bp-surface-alt)] text-[var(--bp-ink-soft)]",
};

/** Status pill for QA report metrics (pass/fail/blocked/etc). */
export function Badge({ color = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--bp-radius-pill)] px-3 py-1 text-xs font-semibold ${COLOR_CLASSES[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
