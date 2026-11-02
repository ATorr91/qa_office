"use client";

import { performanceComponents, type EffectiveRecord } from "@/lib/strategistRecords";

export function scoreColor(score: number | null): string {
  if (score === null) return "var(--bp-ink-soft)";
  if (score >= 85) return "var(--bp-green)";
  if (score >= 70) return "#9a8c10";
  return "var(--bp-danger)";
}

/** The final average and the five inputs behind it, exactly as the dashboard computes them. */
export function ScoreBreakdown({ record, caption }: { record: EffectiveRecord; caption: string }) {
  const components = performanceComponents(record);
  const counted = components.filter((c) => c.value !== null).length;
  return (
    <div className="flex flex-col gap-3 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4 sm:flex-row sm:items-center">
      <div className="shrink-0 sm:w-44">
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Promedio calculado</div>
        <div className="mt-0.5 text-3xl font-bold tabular-nums transition-colors duration-[var(--bp-dur)]" style={{ color: scoreColor(record.performanceScore) }}>
          {record.performanceScore !== null ? `${record.performanceScore}%` : "Sin datos"}
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">
          {caption} · {counted} de {components.length} métricas
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-5">
        {components.map((c) => (
          <div key={c.key} className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] px-2.5 py-1.5">
            <div className="text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{c.label}</div>
            <div className="text-[14px] font-bold tabular-nums" style={{ color: c.value !== null ? "var(--bp-ink)" : "var(--bp-ink-soft)" }}>
              {c.value !== null ? `${c.value}%` : c.key === "peer" ? "NA" : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScoreBreakdown;
