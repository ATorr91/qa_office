"use client";

import { Fragment, useMemo, useState } from "react";
import HealthDot from "@/components/dashboard/HealthDot";
import ProjectDetail from "@/components/dashboard/ProjectDetail";
import { MiniStageBar } from "@/components/dashboard/StageTrack";
import StatTile from "@/components/dashboard/StatTile";
import Badge from "@/components/ui/Badge";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import type { Light } from "@/lib/projectHealth";
import { useProjectProcess } from "@/lib/projectProcess";
import { STRATEGISTS } from "@/lib/strategists";
import { useProjectsView, type ProjectRow } from "@/lib/useProjectsView";

const NAME_BY_ID = new Map(STRATEGISTS.map((s) => [s.id, s.name.split(" ")[0]]));
const RANK: Record<Light, number> = { rojo: 3, amarillo: 2, verde: 1, gris: 0 };

type Scope = "activos" | "todos";

export function ProyectosTab() {
  const { rows, hours, sprint, sprintFailed, week, today } = useProjectsView();
  const { storage, dbError, hydrated, jiraHours } = useProjectProcess();
  const { filteredStrategists, employment, searchQuery } = useDashboardFilters();
  const [scope, setScope] = useState<Scope>("activos");
  const [open, setOpen] = useState<string | null>(null);

  const shown = useMemo(() => {
    const ids = new Set(filteredStrategists.map((s) => s.id));
    const filtering = employment !== "all" || searchQuery.trim() !== "";
    return rows
      .filter((r) => (scope === "todos" ? true : r.project.status === "active"))
      .filter((r) => !filtering || r.owners.some((o) => ids.has(o)))
      .sort((a, b) => RANK[b.health.overall] - RANK[a.health.overall] || b.health.alerts.length - a.health.alerts.length || a.project.code.localeCompare(b.project.code));
  }, [rows, scope, filteredStrategists, employment, searchQuery]);

  const active = shown.filter((r) => r.project.status === "active");
  const red = active.filter((r) => r.health.overall === "rojo").length;
  const yellow = active.filter((r) => r.health.overall === "amarillo").length;
  const unassigned = active.filter((r) => r.owners.length === 0);
  const alerts = shown.flatMap((r) => r.health.alerts.filter((a) => a.level !== "medio").map((a) => ({ row: r, alert: a }))).slice(0, 8);

  if (!hydrated) return <p className="text-[12px] text-[var(--bp-ink-soft)]">Cargando proyectos…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--bp-ink-soft)]">
        <div className="flex gap-1" role="group" aria-label="Qué proyectos mostrar">
          {(["activos", "todos"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scope === s}
              onClick={() => setScope(s)}
              className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2.5 py-1 text-[11px] font-medium transition-colors ${scope === s ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]" : "border-[var(--bp-border)] hover:border-[var(--bp-blue)]"}`}
            >
              {s === "activos" ? "Activos" : "Todos los del catálogo"}
            </button>
          ))}
        </div>
        <span>
          {storage === "db" ? "Datos compartidos del equipo (base de datos)" : "Datos de este navegador: no hay base de datos conectada"}
          {dbError ? ` · ${dbError}` : ""}
        </span>
      </div>

      {sprintFailed && !sprint && <p className="text-[12px] text-[var(--bp-danger)]">No se pudo leer Jira: el cronograma se muestra sin datos de sprint.</p>}
      {jiraHours?.error && <p className="text-[12px] text-[var(--bp-danger)]">No se pudieron leer las horas de Jira: {jiraHours.error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Proyectos activos" value={String(active.length)} sublabel={`${active.filter((r) => r.tracked).length} con proceso capturado`} />
        <StatTile label="En rojo" value={String(red)} tone={red > 0 ? "danger" : "good"} sublabel="Cronograma, alcance o finanzas" />
        <StatTile label="En amarillo" value={String(yellow)} tone={yellow > 0 ? "warning" : "good"} />
        <StatTile label="Alertas críticas y altas" value={String(shown.reduce((n, r) => n + r.health.alerts.filter((a) => a.level !== "medio").length, 0))} tone="warning" />
        <StatTile label="Sin estratega" value={String(unassigned.length)} tone={unassigned.length > 0 ? "danger" : "good"} sublabel="Proyectos activos sin dueño" />
      </div>

      {alerts.length > 0 && (
        <section aria-label="Alertas de criticidad" className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--bp-ink-soft)]">Alertas de criticidad, bloqueos y riesgos</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {alerts.map(({ row, alert }, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]">
                <Badge color={alert.level === "critico" ? "danger" : "warning"} dot={false}>
                  {alert.level === "critico" ? "Crítica" : "Alta"}
                </Badge>
                <button type="button" onClick={() => setOpen(row.id)} className="text-left leading-snug hover:underline">
                  <span className="font-semibold text-[var(--bp-ink)]">{row.project.name}</span> <span className="text-[var(--bp-ink-soft)]">— {alert.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shown.length === 0 ? (
        <p className="rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface)] p-6 text-center text-[12px] text-[var(--bp-ink-soft)]">Ningún proyecto coincide con el filtro.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)]">
          <table className="w-full min-w-[920px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-[var(--bp-border)] text-left text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                <th className="px-3 py-2 font-semibold">Proyecto</th>
                <th className="px-3 py-2 font-semibold">Equipo</th>
                <th className="px-3 py-2 font-semibold">Etapa</th>
                <th className="px-3 py-2 font-semibold">Salud</th>
                <th className="px-3 py-2 font-semibold">Sprint</th>
                <th className="px-3 py-2 font-semibold">Hito de la semana</th>
                <th className="px-3 py-2 font-semibold">Horas</th>
                <th className="px-3 py-2 text-right font-semibold">Alertas</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <ProjectTableRow key={r.id} row={r} week={week} today={today} isOpen={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} hours={hours} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProjectTableRow({ row, week, today, isOpen, onToggle, hours }: { row: ProjectRow; week: string; today: string; isOpen: boolean; onToggle: () => void; hours: ReturnType<typeof useProjectsView>["hours"] }) {
  const { project, data, health, owners, boards } = row;
  const sprint = boards.find((b) => b.sprint)?.sprint ?? null;
  const milestone = data.milestones[week];
  const contractedHours = data.contract?.contractedHours;
  const alertCount = health.alerts.length;

  return (
    <Fragment>
      <tr className="border-b border-[var(--bp-border)] align-middle last:border-0 hover:bg-[var(--bp-surface-alt)]/60">
        <td className="px-3 py-2">
          <button type="button" onClick={onToggle} aria-expanded={isOpen} className="flex items-start gap-2 text-left">
            <span aria-hidden className={`mt-0.5 inline-block text-[10px] transition-transform ${isOpen ? "rotate-90" : ""}`}>
              ▶
            </span>
            <span>
              <span className="block font-semibold text-[var(--bp-ink)]">{project.name}</span>
              <span className="block font-mono text-[10px] text-[var(--bp-ink-soft)]">
                {project.code} · {project.client}
              </span>
            </span>
          </button>
        </td>
        <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{owners.length > 0 ? owners.map((id) => NAME_BY_ID.get(id) ?? id).join(", ") : <span className="font-semibold text-[var(--bp-danger)]">Sin asignar</span>}</td>
        <td className="px-3 py-2">
          <MiniStageBar data={data} today={today} tracked={row.tracked} />
          {row.tracked && row.checklist.total > 0 && (
            <span className="mt-0.5 block text-[10px] tabular-nums text-[var(--bp-ink-soft)]">
              checklist {row.checklist.done}/{row.checklist.total}
            </span>
          )}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2.5">
            <HealthDot light={health.schedule.light} reason={`Cronograma · ${health.schedule.reason}`} />
            <HealthDot light={health.scope.light} reason={`Alcance · ${health.scope.reason}`} />
            <HealthDot light={health.finance.light} reason={`Finanzas · ${health.finance.reason}`} />
          </div>
        </td>
        <td className="px-3 py-2 tabular-nums text-[var(--bp-ink-soft)]">{sprint ? `${sprint.donePct}% / ${sprint.expectedPct}%` : "—"}</td>
        <td className="max-w-[200px] px-3 py-2 text-[var(--bp-ink-soft)]">{milestone ? <span className="line-clamp-2">{`${milestone.done ? "✅ " : ""}${milestone.title}`}</span> : "—"}</td>
        <td className="px-3 py-2 tabular-nums text-[var(--bp-ink-soft)]">{row.hours > 0 || contractedHours ? `${Math.round(row.hours)}${contractedHours ? ` / ${contractedHours}` : ""} h` : "—"}</td>
        <td className="px-3 py-2 text-right">{alertCount > 0 ? <Badge color={health.alerts.some((a) => a.level !== "medio") ? "danger" : "warning"} dot={false}>{alertCount}</Badge> : <span className="text-[var(--bp-ink-soft)]">0</span>}</td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={8} className="p-0">
            <ProjectDetail row={row} hours={hours} week={week} today={today} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export default ProyectosTab;
