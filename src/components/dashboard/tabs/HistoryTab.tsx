"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { useStrategistRecords } from "@/lib/strategistRecords";
import { getEffectiveRecordForMonth, useStrategistDataInputs } from "@/lib/strategistRecords";
import { allMonthsWithData, getMonthLabel, STRATEGISTS } from "@/lib/strategists";

const NO_DATA = "—";

function fmtPct(v: number | null): string {
  return v !== null ? `${v}%` : NO_DATA;
}

function MonthlyHistory() {
  const { filteredStrategists, recordsByStrategist, jiraDeadlines } = useStrategistDataInputs();
  const months = [...allMonthsWithData()].reverse();

  const rows = months.map((m) => {
    const records = filteredStrategists.map((s) => getEffectiveRecordForMonth(s, m, recordsByStrategist, jiraDeadlines));
    const avg = (sel: (r: (typeof records)[number]) => number | null) => {
      const vals = records.map(sel).filter((v): v is number => v !== null);
      return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    };
    return {
      month: m,
      performance: avg((r) => r.performanceScore),
      deadlines: avg((r) => r.deadlineComplianceRate),
      qa: avg((r) => r.qaScore),
      nps: avg((r) => r.npsScore),
      hasAnyData: records.some((r) => r.hasAnyData),
    };
  });

  return (
    <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
      <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
            <th className="px-3 py-2">Mes</th>
            <th className="px-3 py-2 text-right">Desempeño</th>
            <th className="px-3 py-2 text-right">Deadlines</th>
            <th className="px-3 py-2 text-right">QA</th>
            <th className="px-3 py-2 text-right">NPS</th>
          </tr>
        </thead>
        <tbody>
          {rows.every((r) => !r.hasAnyData) ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                Aún no hay historial cargado. Ve a Admin para empezar a registrar meses.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.month} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
                <td className="px-3 py-2.5 font-semibold text-[var(--bp-ink)]">{getMonthLabel(r.month)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtPct(r.performance)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtPct(r.deadlines)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtPct(r.qa)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{r.nps ?? NO_DATA}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ProjectsHistory() {
  const { projectsByStrategist } = useStrategistRecords();
  const [strategistId, setStrategistId] = useState(STRATEGISTS[0].id);
  const strategist = STRATEGISTS.find((s) => s.id === strategistId)!;
  const projects = [...(projectsByStrategist[strategistId] ?? [])].sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {STRATEGISTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStrategistId(s.id)}
            className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2.5 py-1 text-[11px] font-medium transition-colors duration-[var(--bp-dur)] ${
              strategistId === s.id
                ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]"
                : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <StrategistAvatar strategist={strategist} />

        {projects.length === 0 ? (
          <p className="mt-4 text-[12px] text-[var(--bp-ink-soft)]">
            Aún no hay proyectos registrados para {strategist.name}. Agrégalos desde Admin → Historial de proyectos.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {projects.map((p) => (
              <div key={p.id} className="border-t border-[var(--bp-border)] pt-3 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-[var(--bp-ink)]">{p.projectName || "Proyecto sin nombre"}</span>
                  {p.client && <span className="text-[12px] text-[var(--bp-ink-soft)]">· {p.client}</span>}
                  {!p.endDate && <Badge color="success">En curso</Badge>}
                </div>
                <div className="mt-0.5 text-[12px] text-[var(--bp-ink-soft)]">
                  {p.role || "Sin rol especificado"} · {p.startDate || "sin fecha de inicio"} — {p.endDate ?? "presente"}
                </div>
                {p.notes && <p className="mt-1 text-[12px] leading-relaxed text-[var(--bp-ink)]">{p.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HistoryTab() {
  const [view, setView] = useState<"months" | "projects">("months");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-[var(--bp-radius-pill)] border border-[var(--bp-border)] bg-[var(--bp-surface-alt)] p-1 sm:w-fit">
        <button
          type="button"
          onClick={() => setView("months")}
          className={`rounded-[var(--bp-radius-pill)] px-3 py-1.5 text-[12px] font-medium transition-colors duration-[var(--bp-dur)] ${
            view === "months" ? "bg-[var(--bp-surface)] text-[var(--bp-blue-600)] shadow-[var(--bp-shadow-sm)]" : "text-[var(--bp-ink-soft)]"
          }`}
        >
          Métricas por mes
        </button>
        <button
          type="button"
          onClick={() => setView("projects")}
          className={`rounded-[var(--bp-radius-pill)] px-3 py-1.5 text-[12px] font-medium transition-colors duration-[var(--bp-dur)] ${
            view === "projects" ? "bg-[var(--bp-surface)] text-[var(--bp-blue-600)] shadow-[var(--bp-shadow-sm)]" : "text-[var(--bp-ink-soft)]"
          }`}
        >
          Proyectos por estratega
        </button>
      </div>

      {view === "months" ? <MonthlyHistory /> : <ProjectsHistory />}
    </div>
  );
}

export default HistoryTab;
