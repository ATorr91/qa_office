"use client";

import { Fragment, useState } from "react";
import Badge from "@/components/ui/Badge";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { useStrategistRecords } from "@/lib/strategistRecords";
import { getEffectiveRecordForMonth, useStrategistDataInputs, type EffectiveRecord } from "@/lib/strategistRecords";
import { CURRENT_YEAR, getMonthLabel, monthsInYear, STRATEGISTS, type MonthKey, type Strategist } from "@/lib/strategists";

const NO_DATA = "—";

function fmtPct(v: number | null): string {
  return v !== null ? `${v}%` : NO_DATA;
}

function MonthBreakdown({ month, entries }: { month: MonthKey; entries: { s: Strategist; r: EffectiveRecord }[] }) {
  return (
    <tr>
      <td colSpan={6} className="bg-[var(--bp-surface-alt)] px-3 py-3">
        <div className="overflow-x-auto rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)]">
          <table className="w-full min-w-[480px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[var(--bp-border)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                <th className="px-3 py-2">Estratega</th>
                <th className="px-3 py-2 text-right">Desempeño</th>
                <th className="px-3 py-2 text-right">Deadlines</th>
                <th className="px-3 py-2 text-right">Bitácoras</th>
                <th className="px-3 py-2 text-right">QA</th>
                <th className="px-3 py-2 text-right">NPS</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(({ s, r }) => (
                <tr key={s.id} className="border-b border-[var(--bp-border)] last:border-0">
                  <td className="px-3 py-2">
                    <StrategistAvatar strategist={s} />
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmtPct(r.performanceScore)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtPct(r.deadlineComplianceRate)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtPct(r.bitacoraComplianceRate)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtPct(r.qaScore)}</td>
                  <td className="px-3 py-2 text-right font-mono">{r.npsScore ?? NO_DATA}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

function MonthlyHistory() {
  const { filteredStrategists, recordsByStrategist, jiraDeadlines, bitacorasSync } = useStrategistDataInputs();
  const [expandedMonth, setExpandedMonth] = useState<MonthKey | null>(null);
  const months = [...monthsInYear(CURRENT_YEAR)].reverse();

  const rows = months.map((m) => {
    const entries = filteredStrategists.map((s) => ({ s, r: getEffectiveRecordForMonth(s, m, recordsByStrategist, jiraDeadlines, bitacorasSync) }));
    const avg = (sel: (r: EffectiveRecord) => number | null) => {
      const vals = entries.map(({ r }) => sel(r)).filter((v): v is number => v !== null);
      return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    };
    return {
      month: m,
      entries,
      performance: avg((r) => r.performanceScore),
      deadlines: avg((r) => r.deadlineComplianceRate),
      bitacoras: avg((r) => r.bitacoraComplianceRate),
      qa: avg((r) => r.qaScore),
      nps: avg((r) => r.npsScore),
      hasAnyData: entries.some(({ r }) => r.hasAnyData),
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
            <th className="px-3 py-2 text-right">Bitácoras</th>
            <th className="px-3 py-2 text-right">QA</th>
            <th className="px-3 py-2 text-right">NPS</th>
          </tr>
        </thead>
        <tbody>
          {rows.every((r) => !r.hasAnyData) ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                Aún no hay historial cargado. Ve a Admin para empezar a registrar meses.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const expanded = expandedMonth === r.month;
              return (
                <Fragment key={r.month}>
                  <tr
                    className="bp-row-in cursor-pointer border-b border-[var(--bp-border)] last:border-0 hover:bg-[var(--bp-surface-alt)]"
                    style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
                    onClick={() => setExpandedMonth(expanded ? null : r.month)}
                  >
                    <td className="px-3 py-2.5 font-semibold text-[var(--bp-ink)]">
                      <span className="mr-1.5 inline-block w-3 text-[var(--bp-ink-soft)]">{expanded ? "▾" : "▸"}</span>
                      {getMonthLabel(r.month)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtPct(r.performance)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtPct(r.deadlines)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtPct(r.bitacoras)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtPct(r.qa)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{r.nps ?? NO_DATA}</td>
                  </tr>
                  {expanded && <MonthBreakdown month={r.month} entries={r.entries} />}
                </Fragment>
              );
            })
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
