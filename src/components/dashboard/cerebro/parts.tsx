import type { ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import type { AlertLevel, Light } from "@/lib/projectHealth";

export const LIGHT_COLOR: Record<Light, string> = { verde: "var(--bp-green)", amarillo: "#d4a017", rojo: "var(--bp-danger)", gris: "var(--bp-border)" };

export const panel = "rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4";

export function Panel({ title, hint, children, className = "" }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`${panel} ${className}`}>
      <h3 className="text-[13px] font-bold text-[var(--bp-ink)]">{title}</h3>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export const pctText = (v: number | null) => (v === null ? "—" : `${v}%`);

export function toneOf(score: number | null): "good" | "warning" | "danger" | "neutral" {
  if (score === null) return "neutral";
  if (score >= 85) return "good";
  if (score >= 70) return "warning";
  return "danger";
}

/** One bar split in parts (health lights, report statuses...), with its legend: the proportions and the counts are both readable. */
export function StackBar({ parts, label }: { parts: { label: string; value: number; color: string }[]; label: string }) {
  const total = parts.reduce((n, p) => n + p.value, 0);
  return (
    <div>
      <div role="img" aria-label={`${label}: ${parts.map((p) => `${p.label} ${p.value}`).join(", ")}`} className="bp-stagger flex h-3 w-full overflow-hidden rounded-full bg-[var(--bp-surface-alt)]">
        {total > 0 &&
          parts
            .filter((p) => p.value > 0)
            .map((p) => <span key={p.label} data-tip={`${p.label}: ${p.value}`} className="h-full transition-[filter] hover:brightness-95" style={{ flexGrow: p.value, flexBasis: 0, backgroundColor: p.color }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5 text-[12px] text-[var(--bp-ink)]">
            <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label} <span className="font-semibold tabular-nums">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LevelBadge({ level }: { level: AlertLevel }) {
  return (
    <Badge color={level === "critico" ? "danger" : level === "alto" ? "warning" : "neutral"} dot={false}>
      {level === "critico" ? "Crítica" : level === "alto" ? "Alta" : "Media"}
    </Badge>
  );
}

export function LightDot({ light }: { light: Light }) {
  return <span aria-hidden className={`inline-block h-3 w-3 rounded-full ${light === "rojo" ? "bp-pulse" : ""}`} style={{ backgroundColor: LIGHT_COLOR[light] }} />;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] p-4 text-center text-[12px] text-[var(--bp-ink-soft)]">{children}</p>;
}

/** A labelled number with a bar under it. */
export function Meter({ label, value, color = "var(--bp-blue)", detail }: { label: string; value: number | null; color?: string; detail?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[12px]">
        <span className="text-[var(--bp-ink)]">{label}</span>
        <span className="font-bold tabular-nums text-[var(--bp-ink)]">{pctText(value)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bp-surface-alt)]">
        <div className="bp-bar h-full rounded-full" style={{ width: `${Math.min(100, value ?? 0)}%`, backgroundColor: color }} />
      </div>
      {detail && <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">{detail}</p>}
    </div>
  );
}
