"use client";

import Link from "next/link";
import { useState } from "react";
import { Empty, LevelBadge, LightDot, Meter, Panel } from "@/components/dashboard/cerebro/parts";
import HealthDot from "@/components/dashboard/HealthDot";
import ProjectDetail from "@/components/dashboard/ProjectDetail";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import ExportMenu from "@/components/proceso/ExportMenu";
import SegmentedTabs from "@/components/proceso/SegmentedTabs";
import { useHashTab } from "@/components/proceso/useHashTab";
import { usePrintSheet } from "@/components/proceso/usePrintSheet";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { STAGES } from "@/lib/procesoStages";
import { briefOf, DOC_KIND_LABELS, DOC_KIND_ORDER, DRIVE_SYNCED_ON, safeDocUrl, type DocKind } from "@/lib/projectDocs";
import { projectToMarkdown } from "@/lib/projectDocsMarkdown";
import { LIGHT_LABEL } from "@/lib/projectHealth";
import { daysBetween } from "@/lib/projectHours";
import { REPORT_STATUS_LABELS } from "@/lib/projectProcessTypes";
import { PROJECT_STATUS_LABELS, STRATEGISTS } from "@/lib/strategists";
import { useProjectsView } from "@/lib/useProjectsView";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "alcance", label: "Alcance y objetivos" },
  { id: "sprint", label: "Sprint y deadlines" },
  { id: "documentos", label: "Documentos" },
  { id: "proceso", label: "Proceso y salud" },
];
const TAB_IDS = TABS.map((t) => t.id);
const th = "px-3 py-2 font-semibold";
const NAME_BY_ID = new Map(STRATEGISTS.map((s) => [s.id, s]));
const KIND_WASH: Record<DocKind, string> = { figma: "var(--bp-magenta)", sheet: "var(--bp-green)", doc: "var(--bp-blue)", slides: "var(--bp-lime)", pdf: "var(--bp-danger)", video: "var(--bp-purple)", image: "var(--bp-cyan)", folder: "var(--bp-border)", other: "var(--bp-border)" };
const KIND_MARK: Record<DocKind, string> = { figma: "Fg", sheet: "Xl", doc: "Dc", slides: "Pp", pdf: "Pdf", video: "Vid", image: "Img", folder: "Dir", other: "···" };

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

function Bullets({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-[12px] text-[var(--bp-ink-soft)]">{empty}</p>;
  return (
    <ul className="bp-stagger flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-snug text-[var(--bp-ink)]">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function Fact({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{label}</div>
      <div className="mt-0.5 text-[15px] font-bold text-[var(--bp-ink)]">{value}</div>
      {detail && <div className="mt-0.5 text-[11px] leading-snug text-[var(--bp-ink-soft)]">{detail}</div>}
    </div>
  );
}

/** Everything the system knows about one project: scope and objectives, Jira sprint and deadlines, Drive documents, process and health. */
export default function ProyectoView({ projectId }: { projectId: string }) {
  const { rows, hours, week, today } = useProjectsView();
  const { jiraDeadlines } = useDashboardFilters();
  const [tab, setTab] = useHashTab(TAB_IDS, "resumen");
  const [kind, setKind] = useState<DocKind | "all">("all");
  const { printMarkdown, sheet } = usePrintSheet();

  const row = rows.find((r) => r.id === projectId);
  if (!row) return <Empty>No encontramos ese proyecto.</Empty>;

  const { project, data, health, owners, boards } = row;
  const brief = briefOf(row.id);
  const folderUrl = safeDocUrl(data.links.drive) ?? (brief?.folderUrl ? safeDocUrl(brief.folderUrl) : null);
  const daysLeft = daysBetween(today, project.end);
  const stage = STAGES.find((s) => s.id === data.stage)!;
  const docs = brief?.docs ?? [];
  const shownDocs = docs.filter((d) => kind === "all" || d.kind === kind);
  const kindsPresent = DOC_KIND_ORDER.filter((k) => docs.some((d) => d.kind === k));
  const links = [
    ["PRD", safeDocUrl(data.links.prd)],
    ["README", safeDocUrl(data.links.readme)],
    ["Contrato", data.contract ? safeDocUrl(data.contract.contractUrl) : null],
  ] as const;

  // Jira tickets of this project's boards, per owner.
  const ticketRows = owners.flatMap((id) => {
    const person = NAME_BY_ID.get(id);
    if (!person || !jiraDeadlines?.configured || jiraDeadlines.error) return [];
    return project.jiraKeys.flatMap((key) => {
      const stats = jiraDeadlines.projectsByEmail?.[person.email]?.[key];
      return stats ? [{ person, key, stats }] : [];
    });
  });
  const reportRows = STAGES.flatMap((s) => {
    const r = data.reports[s.id];
    return r ? [{ stage: s, r }] : [];
  });

  return (
    <>
      <div className="bp-anim-page flex flex-col gap-4 print:hidden">
        <div>
          <Link href="/dashboard-estrategas/cerebro#proyectos" className="text-[12px] font-semibold text-[var(--bp-blue-600)] underline-offset-2 hover:underline">
            ← Proyectos del cerebro
          </Link>
        </div>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--bp-ink)]">{project.name}</h1>
            <p className="mt-1 text-[13px] text-[var(--bp-ink-soft)]">
              <span className="font-mono">{project.code}</span> · {project.client} · {project.cell} · {PROJECT_STATUS_LABELS[project.status]}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              {owners.length === 0 ? (
                <span className="text-[12px] font-semibold text-[var(--bp-danger)]">Sin estratega asignado</span>
              ) : (
                owners.map((id) => {
                  const s = NAME_BY_ID.get(id);
                  return s ? (
                    <Link key={id} href={`/dashboard-estrategas/perfil/${id}`} className="rounded-[var(--bp-radius-sm)] transition-opacity hover:opacity-80">
                      <StrategistAvatar strategist={s} size={26} />
                    </Link>
                  ) : null;
                })
              )}
              <span className="flex items-center gap-3">
                <HealthDot light={health.schedule.light} label="Cronograma" reason={health.schedule.reason} />
                <HealthDot light={health.scope.light} label="Alcance" reason={health.scope.reason} />
                <HealthDot light={health.finance.light} label="Finanzas" reason={health.finance.reason} />
              </span>
            </div>
          </div>
          <ExportMenu subject="la ficha del proyecto" filename={`ficha-${project.code}`} getMarkdown={() => projectToMarkdown(row, brief, folderUrl, daysLeft)} onPdf={printMarkdown} />
        </header>

        <div className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)]">
          <div className="px-2">
            <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} idPrefix="proy" label="Información del proyecto" />
          </div>
          <div key={tab} role="tabpanel" id={`proy-panel-${tab}`} aria-labelledby={`proy-tab-${tab}`} className="bp-row-in flex flex-col gap-4 p-4 sm:p-5">
            {tab === "resumen" && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Fact label="Etapa" value={row.tracked ? stage.name : "Sin capturar"} detail={row.tracked ? `Checklist ${row.checklist.done}/${row.checklist.total}` : "Proceso sin capturar"} />
                  <Fact label="Fechas" value={`${day(project.start)}`} detail={`hasta ${day(project.end)} · ${daysLeft >= 0 ? `${daysLeft} días restantes` : `terminó hace ${-daysLeft} días`}`} />
                  <Fact label="Horas" value={row.hours > 0 ? `${Math.round(row.hours)} h` : "—"} detail={data.contract?.contractedHours ? `de ${data.contract.contractedHours} contratadas` : "Sin horas contratadas capturadas"} />
                  <Fact label="Hito de la semana" value={data.milestones[week]?.title ?? "Sin definir"} detail={data.milestones[week]?.done ? "Cumplido" : undefined} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Panel title="Salud" hint={`Global: ${LIGHT_LABEL[health.overall]}`}>
                    <ul className="flex flex-col gap-2.5">
                      {(
                        [
                          ["Cronograma", health.schedule],
                          ["Alcance", health.scope],
                          ["Finanzas", health.finance],
                        ] as const
                      ).map(([label, p]) => (
                        <li key={label} className="flex items-start gap-2.5 text-[12px]">
                          <span className="mt-1">
                            <LightDot light={p.light} />
                          </span>
                          <span>
                            <span className="font-semibold text-[var(--bp-ink)]">{label}</span>
                            <span className="block leading-snug text-[var(--bp-ink-soft)]">{p.reason}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                  <Panel title="Alertas abiertas" hint={`${health.alerts.length} en total`}>
                    {health.alerts.length === 0 ? (
                      <Empty>Sin alertas.</Empty>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {health.alerts.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--bp-ink)]">
                            <LevelBadge level={a.level} />
                            <span className="leading-snug">{a.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Panel>
                </div>
                {brief && brief.scope.length > 0 && (
                  <Panel title="Alcance en una mirada" hint={`Según la carpeta de Drive, sincronizada el ${day(DRIVE_SYNCED_ON)}`}>
                    <Bullets items={brief.scope.slice(0, 4)} empty="" />
                  </Panel>
                )}
              </>
            )}

            {tab === "alcance" && (
              <>
                {!brief && (
                  <Empty>
                    Este proyecto no tiene documentación sincronizada de Drive. Se muestran solo los objetivos capturados en Admin.
                  </Empty>
                )}
                {brief && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Panel title="Alcance" hint="Qué incluye el proyecto, según sus documentos.">
                      <Bullets items={brief.scope} empty="Los documentos no detallan el alcance." />
                    </Panel>
                    <Panel title="Objetivos a cubrir" hint="Lo que hay que ejecutar.">
                      <Bullets items={brief.objectives} empty="Los documentos no declaran objetivos." />
                    </Panel>
                    <Panel title="Entregables">
                      <Bullets items={brief.deliverables} empty="Sin entregables declarados." />
                    </Panel>
                    <Panel title="Cronograma de los documentos">
                      <Bullets items={brief.timeline} empty="Sin fechas ni fases declaradas." />
                    </Panel>
                  </div>
                )}
                <Panel title="Objetivos SMART capturados" hint="Los que el equipo registró en Admin, con su avance.">
                  {data.objectives.length === 0 ? (
                    <Empty>Aún no hay objetivos SMART capturados para este proyecto.</Empty>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {data.objectives.map((o) => {
                        const span = o.baseline !== null && o.target !== null ? o.target - o.baseline : null;
                        const pct = span && o.current !== null && o.baseline !== null && span !== 0 ? Math.max(0, Math.min(100, Math.round(((o.current - o.baseline) / span) * 100))) : null;
                        return (
                          <li key={o.id}>
                            <Meter label={o.text} value={pct} color="var(--bp-green)" detail={`${o.metric || "Métrica sin definir"}: ${o.current ?? "—"} ${o.unit} (base ${o.baseline ?? "—"}, meta ${o.target ?? "—"})${o.dueDate ? ` · ${day(o.dueDate)}` : ""}`} />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>
                {data.scopeChanges.length > 0 && (
                  <Panel title="Cambios de alcance">
                    <ul className="divide-y divide-[var(--bp-border)] text-[12px]">
                      {data.scopeChanges.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                          <span className="min-w-0 flex-1 font-medium text-[var(--bp-ink)]">{c.title}</span>
                          <span className="tabular-nums text-[var(--bp-ink-soft)]">{c.impactHours === null ? "sin horas" : `${c.impactHours} h`}</span>
                          <span className="text-[var(--bp-ink-soft)]">{c.status}</span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}
              </>
            )}

            {tab === "sprint" && (
              <>
                <Panel title="Sprint en curso" hint="Avance contra el calendario, según Jira.">
                  {project.jiraKeys.length === 0 ? (
                    <Empty>Este proyecto no tiene tablero de Jira.</Empty>
                  ) : boards.length === 0 ? (
                    <Empty>Jira no devolvió datos de {project.jiraKeys.join(", ")}.</Empty>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {boards.map((b) => (
                        <div key={b.key} className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] p-3">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-[13px] font-bold text-[var(--bp-ink)]">
                              {b.boardName ?? b.key} <span className="font-mono text-[11px] font-normal text-[var(--bp-ink-soft)]">{b.key}</span>
                            </p>
                            {b.boardUrl && safeDocUrl(b.boardUrl) && (
                              <a href={b.boardUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-[var(--bp-blue-600)] hover:underline">
                                Abrir en Jira ↗
                              </a>
                            )}
                          </div>
                          {b.sprint ? (
                            <div className="mt-2 flex flex-col gap-2">
                              <p className="text-[12px] text-[var(--bp-ink-soft)]">
                                {b.sprint.name} · {day(b.sprint.startDate)} a {day(b.sprint.endDate)} · {b.sprint.workingDaysLeft} días hábiles restantes · {b.sprint.pace.replace("_", " ")}
                              </p>
                              <Meter label="Hecho" value={b.sprint.donePct} color="var(--bp-green)" detail={`${b.sprint.done} hechos, ${b.sprint.inProgress} en curso, ${b.sprint.todo} por hacer`} />
                              <Meter label="Esperado hoy" value={b.sprint.expectedPct} color="var(--bp-border)" />
                              {b.sprint.epics.length > 0 && (
                                <ul className="mt-1 divide-y divide-[var(--bp-border)] text-[12px]">
                                  {b.sprint.epics.map((e) => (
                                    <li key={e.key ?? e.name} className="flex items-center gap-3 py-1.5">
                                      <span className="min-w-0 flex-1 truncate text-[var(--bp-ink)]">{e.name}</span>
                                      <span className="tabular-nums text-[var(--bp-ink-soft)]">
                                        {e.done}/{e.total}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-[12px] text-[var(--bp-ink-soft)]">{b.note ?? "Sin sprint en curso."}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title="Deadlines en Jira" hint="Incidencias de este proyecto por estratega asignado.">
                  {ticketRows.length === 0 ? (
                    <Empty>{jiraDeadlines === null ? "Cargando Jira…" : "Jira no tiene incidencias de este proyecto asignadas a su equipo."}</Empty>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] border-collapse text-[12px]">
                        <thead>
                          <tr className="border-b border-[var(--bp-border)] text-left text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                            <th className={th}>Persona</th>
                            <th className={th}>Tablero</th>
                            <th className={`${th} text-right`}>Total</th>
                            <th className={`${th} text-right`}>Hechas</th>
                            <th className={`${th} text-right`}>En curso</th>
                            <th className={`${th} text-right`}>Por hacer</th>
                            <th className={`${th} text-right`}>Vencidas</th>
                            <th className={`${th} text-right`}>Sin fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticketRows.map(({ person, key, stats }) => (
                            <tr key={`${person.id}-${key}`} className="border-b border-[var(--bp-border)] transition-colors last:border-0 hover:bg-[var(--bp-surface-alt)]/60">
                              <td className="px-3 py-2 font-medium text-[var(--bp-ink)]">{person.name}</td>
                              <td className="px-3 py-2 font-mono">{key}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{stats.total}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{stats.done}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{stats.inProgress}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{stats.todo}</td>
                              <td className={`px-3 py-2 text-right tabular-nums ${stats.overdueOpen > 0 ? "font-bold text-[var(--bp-danger)]" : ""}`}>{stats.overdueOpen}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{stats.noDueDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>

                <Panel title="Fechas de entrega" hint={`El proyecto termina el ${day(project.end)}.`}>
                  {reportRows.length === 0 ? (
                    <Empty>Aún no hay reportes de etapa con fecha capturados.</Empty>
                  ) : (
                    <ul className="divide-y divide-[var(--bp-border)] text-[12px]">
                      {reportRows.map(({ stage: s, r }) => (
                        <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                          <span className="w-28 font-semibold text-[var(--bp-ink)]">{s.name}</span>
                          <span className="tabular-nums text-[var(--bp-ink-soft)]">{r.dueDate ? `Límite ${day(r.dueDate)}` : "Sin fecha límite"}</span>
                          <span className={`ml-auto font-medium ${r.dueDate && r.dueDate < today && r.status !== "aceptado" && r.status !== "aceptado_obs" && r.status !== "no_aceptado" ? "text-[var(--bp-danger)]" : "text-[var(--bp-ink)]"}`}>{REPORT_STATUS_LABELS[r.status]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </>
            )}

            {tab === "documentos" && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  {folderUrl ? (
                    <a href={folderUrl} target="_blank" rel="noopener noreferrer" className="bp-tap inline-flex items-center gap-2 rounded-[var(--bp-radius-md)] bg-[var(--bp-blue)] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--bp-blue-600)]">
                      Abrir carpeta de Drive ↗
                    </a>
                  ) : (
                    <Empty>
                      No hay carpeta de Drive vinculada.{" "}
                      <Link href="/dashboard-estrategas/admin#proyectos" className="font-semibold text-[var(--bp-blue-600)] hover:underline">
                        Vincularla en Admin
                      </Link>
                    </Empty>
                  )}
                  {links.map(([label, href]) =>
                    href ? (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="bp-link-chip rounded-full bg-[var(--bp-blue-tint)] px-3 py-1.5 text-[12px] font-semibold text-[var(--bp-blue-600)]">
                        {label} ↗
                      </a>
                    ) : null,
                  )}
                  {brief && <span className="text-[11px] text-[var(--bp-ink-soft)]">Archivos leídos de Drive el {day(DRIVE_SYNCED_ON)}</span>}
                </div>

                {docs.length > 0 ? (
                  <Panel title={`Archivos (${docs.length})`} hint="Figma, hojas de cálculo, documentos y demás que hay en la carpeta del proyecto.">
                    <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tipo">
                      {(["all", ...kindsPresent] as const).map((k) => (
                        <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2.5 py-1 text-[11px] font-medium transition-colors ${kind === k ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]" : "border-[var(--bp-border)] hover:border-[var(--bp-blue)]"}`}>
                          {k === "all" ? "Todos" : `${DOC_KIND_LABELS[k]} (${docs.filter((d) => d.kind === k).length})`}
                        </button>
                      ))}
                    </div>
                    <ul className="bp-stagger divide-y divide-[var(--bp-border)]">
                      {shownDocs.map((d) => {
                        const href = safeDocUrl(d.url);
                        return (
                          <li key={`${d.url}-${d.name}`} className="flex items-center gap-3 py-2">
                            <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-[var(--bp-radius-sm)] text-[10px] font-bold text-[var(--bp-ink)]" style={{ backgroundColor: `color-mix(in srgb, ${KIND_WASH[d.kind]} 30%, white)` }}>
                              {KIND_MARK[d.kind]}
                            </span>
                            <span className="min-w-0 flex-1">
                              {href ? (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="block truncate text-[13px] font-semibold text-[var(--bp-ink)] hover:text-[var(--bp-blue-600)] hover:underline">
                                  {d.name} ↗
                                </a>
                              ) : (
                                <span className="block truncate text-[13px] font-semibold text-[var(--bp-ink)]">{d.name}</span>
                              )}
                              {d.path && <span className="block truncate text-[11px] text-[var(--bp-ink-soft)]">{d.path}</span>}
                            </span>
                            {d.modified && <span className="hidden shrink-0 text-[11px] tabular-nums text-[var(--bp-ink-soft)] sm:block">{day(d.modified)}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </Panel>
                ) : (
                  <Empty>Aún no hay archivos sincronizados de la carpeta de este proyecto.</Empty>
                )}
                {brief?.notes && <p className="text-[12px] text-[var(--bp-ink-soft)]">Nota de la lectura: {brief.notes}</p>}
              </>
            )}

            {tab === "proceso" && <ProjectDetail row={row} hours={hours} week={week} today={today} />}
          </div>
        </div>
      </div>
      {sheet}
    </>
  );
}

