import type { BadgeColor } from "@/components/ui/Badge";
import type { SignalStatus, StageId } from "@/lib/procesoTypes";

/**
 * Brand color of each stage and the text color that stays readable on top of it (white on the brand magenta and purple, ink on
 * the lighter blue, green and cyan).
 */
export const STAGE_STYLE: Record<StageId, { color: string; on: string }> = {
  discovery: { color: "var(--bp-blue)", on: "var(--bp-ink)" },
  build: { color: "var(--bp-magenta)", on: "#fff" },
  testing: { color: "var(--bp-purple)", on: "#fff" },
  entrega: { color: "var(--bp-green)", on: "var(--bp-ink)" },
  futureproof: { color: "var(--bp-cyan)", on: "var(--bp-ink)" },
};

export const STATUS_COLOR: Record<SignalStatus, BadgeColor> = { existe: "success", "por-integrar": "warning", manual: "info" };
