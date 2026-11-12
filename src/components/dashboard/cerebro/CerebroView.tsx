"use client";

import Link from "next/link";
import BarList from "@/components/dashboard/BarList";
import AnalisisEquipo from "@/components/dashboard/cerebro/AnalisisEquipo";
import { Empty, LevelBadge, LightDot, LIGHT_COLOR, Meter, Panel, pctText, StackBar, toneOf } from "@/components/dashboard/cerebro/parts";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import TrendSparkline from "@/components/dashboard/TrendSparkline";
import ExportMenu from "@/components/proceso/ExportMenu";
import SegmentedTabs from "@/components/proceso/SegmentedTabs";
import { STAGE_STYLE } from "@/components/proceso/procesoUi";
import { useHashTab } from "@/components/proceso/useHashTab";
import { usePrintSheet } from "@/components/proceso/usePrintSheet";
import { AT_RISK_BELOW, fmtMoney, projectHref } from "@/lib/cerebro";
import { cerebroToMarkdown } from "@/lib/cerebroMarkdown";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { STAGES } from "@/lib/procesoStages";
import { LIGHT_LABEL } from "@/lib/projectHealth";
import { REPORT_STATUS_LABELS } from "@/lib/projectProcessTypes";
import { getEffectiveRecordForMonth, useStrategistRecords } from "@/lib/strategistRecords";
import { EMPLOYMENT_LABELS, getMonthShortLabel, getPeriodLabel, monthsInYear, periodYear, STRATEGISTS } from "@/lib/strategists";
import { useCerebro } from "@/lib/useCerebro";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "portafolio", label: "Portafolio" },
  { id: "proyectos", label: "Proyectos" },
  { id: "finanzas", label: "Finanzas" },
  { id: "equipo", label: "Equipo" },
  { id: "analisis", label: "Análisis del equipo" },
  { id: "cliente", label: "Cliente y calidad" },
  { id: "datos", label: "Cobertura de datos" },
];
const TAB_IDS = TABS.map((t) => t.id);
const REPORT_COLORS = { pendiente: "var(--bp-border)", enviado: "var(--bp-blue)", aceptado: "var(--bp-green)", aceptado_obs: "#d4a017", no_aceptado: "var(--bp-danger)" } as const;
const th = "px-3 py-2 font-semibold";

/** The executive reading of the whole system: portfolio health, delivery, money, team, client and how much of it rests on captured data. */
export default function CerebroView() {
  const { cerebro: c, hydrated, period } = useCerebro();
  const { recordsByStrategist } = useStrategistRecords();
  const { jiraDeadlines, bitacorasSync, externalScores } = useDashboardFilters();
  const [tab, setTab] = useHashTab(TAB_IDS, "resumen");
  const { printMarkdown, sheet } = usePrintSheet();
  const generatedOn = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
  const p = c.portfolio;
  const urgent = c.attention.filter((a) => a.level !== "medio").length;

  const trend = monthsInYear(periodYear(period))
    .map((m) => {
      const scores = STRATEGISTS.map((s) => getEffectiveRecordForMonth(s, m, recordsByStrategist, jiraDeadlines, bitacorasSync, externalScores).performanceScore).filter((v): v is number => v !== null);
      return scores.length > 0 ? { label: getMonthShortLabel(m), value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  if (!hydrated) return <p className="text-[12px] text-[var(--bp-ink-soft)]">Cargando datos…</p>;

  return (
    <>
      <div className="bp-anim-page flex flex-col gap-4 print:hidden">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--bp-ink)]">Cerebro</h1>
            <p className="mt-1 text-[13px] text-[var(--bp-ink-soft)]">
              Lectura ejecutiva de todo el sistema · desempeño de {getPeriodLabel(period)} · cobertura de datos <strong className="text-[var(--bp-ink)]">{c.coverage.pct}%</strong>
            </p>
          </div>
          <ExportMenu subject="el reporte ejecutivo" filename="reporte-ejecutivo-estrategas" getMarkdown={() => cerebroToMarkdown(c, getPeriodLabel(period), generatedOn)} onPdf={printMarkdown} />
        </header>

        <div className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)]">
          <div className="px-2">
            <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} idPrefix="cerebro" label="Secciones del cerebro" />
          </div>
          <div key={tab} role="tabpanel" id={`cerebro-panel-${tab}`} aria-labelledby={`cerebro-tab-${tab}`} className="bp-row-in flex flex-col gap-4 p-4 sm:p-5">
            {tab === "resumen" && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile label="Proyectos activos" value={String(p.active)} sublabel={`${p.tracked} con proceso capturado`} />
                  <StatTile label="En rojo" value={String(p.lights.rojo)} tone={p.lights.rojo > 0 ? "danger" : "good"} sublabel={`${p.lights.amarillo} en amarillo`} />
                  <StatTile label="Alertas críticas y altas" value={String(urgent)} tone={urgent > 0 ? "warning" : "good"} sublabel={`${p.risks.open} riesgos abiertos`} />
                  <StatTile label="Desempeño del equipo" value={pctText(c.team.average)} tone={toneOf(c.team.average)} sublabel={`${c.team.atRisk.length} bajo ${AT_RISK_BELOW}%`} />
                  <StatTile label="Aceptación a la primera" value={pctText(c.delivery.firstTimePct)} tone={toneOf(c.delivery.firstTimePct)} sublabel="Reportes sin observaciones" />
                  <StatTile label="Reportes a tiempo" value={pctText(c.delivery.onTimePct)} tone={toneOf(c.delivery.onTimePct)} sublabel={`${p.overdueReports} vencidos`} />
                  <StatTile label="Satisfacción (CSAT)" value={pctText(c.client.csat)} tone={toneOf(c.client.csat)} sublabel={`${c.client.csatResponses} respuestas`} />
                  <StatTile label="Cobertura de datos" value={`${c.coverage.pct}%`} tone={toneOf(c.coverage.pct)} sublabel="Qué tanto está capturado" />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Panel title="Salud del portafolio" hint="Proyectos activos por semáforo: cronograma, alcance y finanzas.">
                    <StackBar label="Salud del portafolio" parts={(["verde", "amarillo", "rojo", "gris"] as const).map((l) => ({ label: LIGHT_LABEL[l], value: p.lights[l], color: LIGHT_COLOR[l] }))} />
                  </Panel>
                  <Panel title="Proyectos por etapa" hint="Solo proyectos con proceso capturado.">
                    <StackBar label="Proyectos por etapa" parts={STAGES.map((s) => ({ label: s.name, value: p.byStage[s.id], color: STAGE_STYLE[s.id].color }))} />
                  </Panel>
                </div>

                <Panel title="Requiere atención" hint="Ordenado por gravedad, de todo el sistema.">
                  {c.attention.length === 0 ? (
                    <Empty>Sin alertas críticas ni altas.</Empty>
                  ) : (
                    <ul className="bp-stagger divide-y divide-[var(--bp-border)]">
                      {c.attention.slice(0, 10).map((a, i) => (
                        <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[13px]">
                          <LevelBadge level={a.level} />
                          <span className="w-20 shrink-0 text-[11px] font-semibold text-[var(--bp-ink-soft)]">{a.area}</span>
                          {a.href ? (
                            <Link href={a.href} className="min-w-0 flex-1 text-[var(--bp-ink)] hover:text-[var(--bp-blue-600)] hover:underline">
                              {a.text}
                            </Link>
                          ) : (
                            <span className="min-w-0 flex-1 text-[var(--bp-ink)]">{a.text}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.attention.length > 10 && <p className="mt-2 text-[11px] text-[var(--bp-ink-soft)]">y {c.attention.length - 10} más en el reporte ejecutivo.</p>}
                </Panel>
              </>
            )}

            {tab === "portafolio" && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile label="Riesgos abiertos" value={String(p.risks.open)} tone={p.risks.open > 0 ? "warning" : "good"} sublabel={`${p.risks.overdue} vencidos`} />
                  <StatTile label="Bloqueos y criticidades" value={String(p.risks.blockers + p.risks.critical)} tone={p.risks.blockers + p.risks.critical > 0 ? "danger" : "good"} />
                  <StatTile label="Cambios de alcance sin aceptar" value={String(p.pendingScopeChanges)} tone={p.pendingScopeChanges > 0 ? "warning" : "good"} />
                  <StatTile label="Hito de la semana definido" value={`${p.milestonesDefined}/${p.active}`} sublabel="Proyectos activos" />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Panel title="Reportes de aceptación" hint="Estado de los reportes de etapa de todos los proyectos.">
                    <StackBar label="Reportes" parts={(Object.keys(p.reports) as (keyof typeof p.reports)[]).map((k) => ({ label: REPORT_STATUS_LABELS[k], value: p.reports[k], color: REPORT_COLORS[k] }))} />
                    <p className="mt-2 text-[12px] text-[var(--bp-ink)]">
                      <span className="font-semibold">{p.overdueReports}</span> vencidos sin aceptación
                    </p>
                  </Panel>
                  <Panel title="Sprints en curso" hint="Avance contra el calendario, según Jira.">
                    <StackBar label="Sprints" parts={[{ label: "Al día", value: p.sprints.al_dia, color: "var(--bp-green)" }, { label: "Atrasados", value: p.sprints.atrasado, color: "#d4a017" }, { label: "En riesgo", value: p.sprints.en_riesgo, color: "var(--bp-danger)" }, { label: "Sin trabajo", value: p.sprints.sin_trabajo, color: "var(--bp-border)" }]} />
                  </Panel>
                </div>
                <Panel title="Proyectos en amarillo o rojo" hint="Los de mayor gravedad primero.">
                  {p.critical.length === 0 ? (
                    <Empty>Ningún proyecto activo en amarillo o rojo.</Empty>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] border-collapse text-[12px]">
                        <thead>
                          <tr className="border-b border-[var(--bp-border)] text-left text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                            <th className={th}>Proyecto</th>
                            <th className={th}>Salud</th>
                            <th className={`${th} text-right`}>Alertas</th>
                            <th className={th}>Principal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.critical.slice(0, 15).map((r) => (
                            <tr key={r.id} className="border-b border-[var(--bp-border)] align-top transition-colors last:border-0 hover:bg-[var(--bp-surface-alt)]/60">
                              <td className="px-3 py-2 font-semibold text-[var(--bp-ink)]">
                                <Link href={projectHref(r.id)} className="hover:text-[var(--bp-blue-600)] hover:underline">
                                  {r.name}
                                </Link>
                              </td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-2">
                                  <LightDot light={r.light} />
                                  {LIGHT_LABEL[r.light]}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">{r.alerts}</td>
                              <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{r.top}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </>
            )}

            {tab === "proyectos" && (
              <Panel title={`Proyectos activos (${p.list.length})`} hint="Entra a cada uno para ver su alcance, sprint, deadlines y documentos de Drive.">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-[12px]">
                    <thead>
                      <tr className="border-b border-[var(--bp-border)] text-left text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                        <th className={th}>Proyecto</th>
                        <th className={th}>Equipo</th>
                        <th className={th}>Etapa</th>
                        <th className={th}>Salud</th>
                        <th className={`${th} text-right`}>Sprint</th>
                        <th className={`${th} text-right`}>Alertas</th>
                        <th className={th}>Drive</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.list.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--bp-border)] align-middle transition-colors last:border-0 hover:bg-[var(--bp-surface-alt)]/60">
                          <td className="px-3 py-2">
                            <Link href={projectHref(r.id)} className="block font-semibold text-[var(--bp-ink)] hover:text-[var(--bp-blue-600)] hover:underline">
                              {r.name}
                            </Link>
                            <span className="font-mono text-[10px] text-[var(--bp-ink-soft)]">
                              {r.code} · {r.client}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{r.owners.length > 0 ? r.owners.map((id) => STRATEGISTS.find((s) => s.id === id)?.name.split(" ")[0] ?? id).join(", ") : <span className="font-semibold text-[var(--bp-danger)]">Sin asignar</span>}</td>
                          <td className="px-3 py-2 text-[var(--bp-ink)]">{r.stage ? STAGES.find((s) => s.id === r.stage)!.name : <span className="text-[var(--bp-ink-soft)]">Sin capturar</span>}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-2">
                              <LightDot light={r.light} />
                              {LIGHT_LABEL[r.light]}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-[var(--bp-ink-soft)]">{r.sprintDonePct === null ? "—" : `${r.sprintDonePct}% / ${r.sprintExpectedPct}%`}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r.alerts}</td>
                          <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{r.docs > 0 ? `${r.docs} archivos` : r.hasFolder ? "Carpeta vinculada" : "Sin carpeta"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {tab === "finanzas" && (
              <>
                {c.finance.withContract === 0 ? (
                  <Empty>
                    Ningún proyecto activo tiene contrato capturado, así que las finanzas no se pueden leer.{" "}
                    <Link href="/dashboard-estrategas/admin#proyectos" className="font-semibold text-[var(--bp-blue-600)] hover:underline">
                      Capturar contratos
                    </Link>
                  </Empty>
                ) : (
                  <>
                    {c.finance.money.map((m) => (
                      <div key={m.currency} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                        <StatTile label={`Contratado ${m.currency}`} value={fmtMoney(m.contracted, m.currency)} />
                        <StatTile label="Facturado" value={fmtMoney(m.invoiced, m.currency)} sublabel={`${m.contracted > 0 ? Math.round((m.invoiced / m.contracted) * 100) : 0}% del contrato`} />
                        <StatTile label="Cobrado" value={fmtMoney(m.paid, m.currency)} tone="good" sublabel={`${m.contracted > 0 ? Math.round((m.paid / m.contracted) * 100) : 0}% del contrato`} />
                        <StatTile label="Cobro vencido" value={fmtMoney(m.overdue, m.currency)} tone={m.overdue > 0 ? "danger" : "good"} sublabel={`Por cobrar: ${fmtMoney(m.toCollect, m.currency)}`} />
                        <StatTile label="Por facturar vencido" value={fmtMoney(m.unbilledDue, m.currency)} tone={m.unbilledDue > 0 ? "warning" : "good"} />
                      </div>
                    ))}
                    <Panel title="Horas contra contrato" hint="Horas ejecutadas de los proyectos con horas contratadas.">
                      <Meter label={`${c.finance.hoursExecuted} h de ${c.finance.hoursContracted} h contratadas`} value={c.finance.hoursContracted > 0 ? Math.round((c.finance.hoursExecuted / c.finance.hoursContracted) * 100) : null} color={c.finance.hoursExecuted > c.finance.hoursContracted ? "var(--bp-danger)" : "var(--bp-blue)"} />
                    </Panel>
                    <Panel title="Por proyecto" hint={`${c.finance.withContract} con contrato · ${c.finance.overBudget} en rojo`}>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse text-[12px]">
                          <thead>
                            <tr className="border-b border-[var(--bp-border)] text-left text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                              <th className={th}>Proyecto</th>
                              <th className={`${th} text-right`}>Monto</th>
                              <th className={`${th} text-right`}>Facturado</th>
                              <th className={`${th} text-right`}>Cobrado</th>
                              <th className={`${th} text-right`}>Horas</th>
                              <th className={th}>Salud</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.finance.rows.map((r) => (
                              <tr key={r.id} className="border-b border-[var(--bp-border)] transition-colors last:border-0 hover:bg-[var(--bp-surface-alt)]/60">
                                <td className="px-3 py-2 font-semibold text-[var(--bp-ink)]">{r.name}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{r.amount === null ? "—" : fmtMoney(r.amount, r.currency)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{pctText(r.invoicedPct)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{pctText(r.paidPct)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{pctText(r.hoursPct)}</td>
                                <td className="px-3 py-2">
                                  <LightDot light={r.light} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  </>
                )}
              </>
            )}

            {tab === "equipo" && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {c.team.groups.map((g) => (
                    <Panel key={g.employment} title={g.employment === "nomina" ? "Estrategas de nómina" : "Estrategas proveedores"} hint={`${g.people} ${g.people === 1 ? "persona" : "personas"}`}>
                      <div className="flex flex-col gap-3">
                        <Meter label="Desempeño" value={g.performance} color="var(--bp-blue)" />
                        <Meter label="Checklist del proceso" value={g.checklist} color="var(--bp-green)" />
                        <Meter label="Aceptación a la primera" value={g.firstTime} color="var(--bp-purple)" />
                        <Meter label="Reportes a tiempo" value={g.onTime} color="var(--bp-cyan)" />
                      </div>
                    </Panel>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Panel title="Promedio por métrica" hint="Media del equipo en cada una de las cinco métricas de desempeño.">
                    <BarList items={c.team.components.filter((m) => m.value !== null).map((m) => ({ label: m.label, value: m.value!, tone: m.value! >= 85 ? "good" : m.value! >= 70 ? "warning" : "danger" }))} />
                    {c.team.components.every((m) => m.value === null) && <Empty>Sin datos en el periodo.</Empty>}
                  </Panel>
                  <Panel title="Tendencia del equipo" hint="Desempeño promedio por mes del año.">
                    <div className="min-h-[150px]">
                      <TrendSparkline points={trend} />
                    </div>
                  </Panel>
                </div>
                <Panel title="Ranking" hint={`${c.team.atRisk.length} bajo ${AT_RISK_BELOW}%`}>
                  {c.team.ranked.length === 0 ? (
                    <Empty>Nadie tiene desempeño medido en el periodo.</Empty>
                  ) : (
                    <ul className="divide-y divide-[var(--bp-border)]">
                      {c.team.ranked.map((x, i) => (
                        <li key={x.s.id}>
                          <Link href={`/dashboard-estrategas/perfil/${x.s.id}`} className="flex items-center gap-3 rounded-[var(--bp-radius-sm)] px-1 py-2 transition-colors hover:bg-[var(--bp-surface-alt)]">
                            <span className="w-5 text-[12px] font-bold tabular-nums text-[var(--bp-ink-soft)]">{i + 1}</span>
                            <span className="min-w-0 flex-1">
                              <StrategistAvatar strategist={x.s} size={26} />
                            </span>
                            <span className="hidden text-[11px] text-[var(--bp-ink-soft)] sm:block">{EMPLOYMENT_LABELS[x.s.employment]}</span>
                            <span className="w-12 text-right text-[14px] font-bold tabular-nums" style={{ color: toneColor(x.r.performanceScore!) }}>
                              {x.r.performanceScore}%
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </>
            )}

            {tab === "analisis" && <AnalisisEquipo cerebro={c} periodLabel={getPeriodLabel(period)} onPdf={printMarkdown} />}

            {tab === "cliente" && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile label="CSAT" value={pctText(c.client.csat)} tone={toneOf(c.client.csat)} sublabel={`${c.client.csatResponses} respuestas`} />
                  <StatTile label="NPS" value={c.client.nps === null ? "—" : String(c.client.nps)} sublabel={`${c.client.npsResponses} encuestas`} />
                  <StatTile label="Satisfacción" value={c.client.satisfaction === null ? "—" : `${(1 + (c.client.satisfaction / 100) * 4).toFixed(1)} / 5`} sublabel="Promedio de las encuestas" />
                  <StatTile label="Calificación QA" value={pctText(c.client.qa)} tone={toneOf(c.client.qa)} sublabel={`${c.client.qaReports} reportes`} />
                </div>
                <Panel title="Por estratega" hint="La percepción del cliente se evalúa aparte: no entra al desempeño.">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] border-collapse text-[12px]">
                      <thead>
                        <tr className="border-b border-[var(--bp-border)] text-left text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                          <th className={th}>Estratega</th>
                          <th className={`${th} text-right`}>QA</th>
                          <th className={`${th} text-right`}>NPS</th>
                          <th className={`${th} text-right`}>CSAT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.team.people.map((x) => (
                          <tr key={x.s.id} className="border-b border-[var(--bp-border)] transition-colors last:border-0 hover:bg-[var(--bp-surface-alt)]/60">
                            <td className="px-3 py-2 font-medium text-[var(--bp-ink)]">{x.s.name}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{pctText(x.r.qaScore)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{x.r.npsScore ?? "—"}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{pctText(x.r.csatScore)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </>
            )}

            {tab === "datos" && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Qué tanto está capturado" hint="Cada número del cerebro es tan confiable como esto.">
                  <div className="flex flex-col gap-3">
                    {c.coverage.items.map((i) => (
                      <div key={i.label}>
                        <Meter label={i.label} value={i.total > 0 ? Math.round((i.done / i.total) * 100) : null} color={i.done === i.total ? "var(--bp-green)" : "var(--bp-blue)"} detail={`${i.done} de ${i.total}`} />
                        {i.fix && i.done < i.total && (
                          <Link href={i.fix} className="text-[11px] font-semibold text-[var(--bp-blue-600)] hover:underline">
                            Capturar en Admin
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Fuentes" hint="Lo que se lee solo, sin captura.">
                  <ul className="divide-y divide-[var(--bp-border)]">
                    {c.coverage.sources.map((s) => (
                      <li key={s.name} className="flex items-start gap-3 py-2 text-[13px]">
                        <span aria-hidden className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${s.ok === false ? "bp-pulse" : ""}`} style={{ backgroundColor: s.ok === null ? "var(--bp-border)" : s.ok ? "var(--bp-green)" : "var(--bp-danger)" }} />
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold text-[var(--bp-ink)]">{s.name}</span>
                          <span className="block text-[12px] text-[var(--bp-ink-soft)]">{s.ok === null ? "Cargando" : s.ok ? "Conectada" : "Con problema"}: {s.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            )}
          </div>
        </div>
      </div>
      {sheet}
    </>
  );
}

function toneColor(score: number): string {
  return score >= 85 ? "var(--bp-green)" : score >= 70 ? "#9a8c10" : "var(--bp-danger)";
}
