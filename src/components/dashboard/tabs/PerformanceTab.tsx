"use client";

import Link from "next/link";
import BarList from "@/components/dashboard/BarList";
import LowSampleBadge from "@/components/dashboard/LowSampleBadge";
import ManualDeadlinesNotice from "@/components/dashboard/ManualDeadlinesNotice";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import TrendSparkline from "@/components/dashboard/TrendSparkline";
import Badge from "@/components/ui/Badge";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { processMetricsFor, type ProcessMetrics } from "@/lib/processMetrics";
import { todayInMexico } from "@/lib/projectHours";
import { useProjectProcess } from "@/lib/projectProcess";
import { getEffectiveRecordForMonth, performanceComponents, useEffectiveRecords, useStrategistDataInputs, useStrategistRecords } from "@/lib/strategistRecords";
import { EMPLOYMENT_LABELS, getMonthShortLabel, monthsInYear, periodYear, type Employment } from "@/lib/strategists";

const AT_RISK_THRESHOLD = 70;
const NO_DATA_LABEL = "Sin información disponible";
// Same five inputs, same order, as the average they roll up into (see performanceComponents).
const COMPONENT_LABELS = ["Peer review", "OKRs y KPIs", "Deadlines", "Bitácoras", "QA"];

const pctLabel = (v: number | null) => (v === null ? "—" : `${v}%`);
const average = (values: (number | null)[]) => {
  const present = values.filter((v): v is number => v !== null);
  return present.length === 0 ? null : Math.round(present.reduce((a, b) => a + b, 0) / present.length);
};

function toneFor(score: number): "good" | "warning" | "danger" {
  if (score >= 85) return "good";
  if (score >= AT_RISK_THRESHOLD) return "warning";
  return "danger";
}

export function PerformanceTab() {
  const rows = useEffectiveRecords();
  const { period } = useDashboardFilters();
  const { filteredStrategists, recordsByStrategist, jiraDeadlines, bitacorasSync, externalScores } = useStrategistDataInputs();
  const { getSources } = useStrategistRecords();
  const { projects } = useProjectProcess();
  const today = todayInMexico();
  const processById: Record<string, ProcessMetrics> = Object.fromEntries(rows.map(({ s }) => [s.id, processMetricsFor(s.id, projects, today)]));
  const groups = (["nomina", "proveedor"] as Employment[])
    .map((employment) => {
      const members = rows.filter((x) => x.s.employment === employment);
      return {
        employment,
        people: members.length,
        performance: average(members.map((x) => x.r.performanceScore)),
        checklist: average(members.map((x) => processById[x.s.id].checklistPct)),
        firstTime: average(members.map((x) => processById[x.s.id].firstTimePct)),
        onTime: average(members.map((x) => processById[x.s.id].onTimePct)),
      };
    })
    .filter((g) => g.people > 0);

  const withData = rows.filter((x) => x.r.performanceScore !== null).sort((a, b) => b.r.performanceScore! - a.r.performanceScore!);

  const teamAvg = withData.length > 0 ? Math.round(withData.reduce((acc, x) => acc + x.r.performanceScore!, 0) / withData.length) : null;
  const top3 = withData.slice(0, 3);
  const atRisk = withData.filter((x) => x.r.performanceScore! < AT_RISK_THRESHOLD);

  const teamTrend = monthsInYear(periodYear(period)).map((m) => {
    const scores = filteredStrategists
      .map((s) => getEffectiveRecordForMonth(s, m, recordsByStrategist, jiraDeadlines, bitacorasSync, externalScores).performanceScore)
      .filter((v): v is number => v !== null);
    return scores.length > 0 ? { label: getMonthShortLabel(m), value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) } : null;
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Desempeño promedio del equipo"
          value={teamAvg !== null ? `${teamAvg}%` : NO_DATA_LABEL}
          tone={teamAvg !== null ? toneFor(teamAvg) : "neutral"}
          sublabel="Promedio de peer review, OKRs y KPIs, deadlines, bitácoras y QA. NPS y CSAT se ven aparte."
        />
        <div className="bp-row-in flex flex-col gap-1.5 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Mejor desempeño</div>
          {top3.length === 0 ? (
            <div className="text-[13px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}</div>
          ) : (
            <div className="mt-0.5 flex flex-col gap-1">
              {top3.map((x, i) => (
                <div key={x.s.id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--bp-surface-alt)] text-[10px] font-bold text-[var(--bp-ink-soft)]">
                      {i + 1}
                    </span>
                    <span className="truncate text-[13px] text-[var(--bp-ink)]">{x.s.name}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-bold text-[var(--bp-green)]">{x.r.performanceScore}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <StatTile
          label="Estrategas en zona de riesgo"
          value={String(atRisk.length)}
          sublabel={`Score < ${AT_RISK_THRESHOLD}%`}
          tone={atRisk.length > 0 ? "danger" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {groups.map((g) => (
          <section key={g.employment} className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4" aria-label={`Resumen de ${EMPLOYMENT_LABELS[g.employment]}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">{g.employment === "nomina" ? "Estrategas de nómina" : "Estrategas proveedores"}</h3>
              <span className="text-[11px] text-[var(--bp-ink-soft)]">{g.people} {g.people === 1 ? "persona" : "personas"}</span>
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                ["Desempeño", g.performance],
                ["Checklist", g.checklist],
                ["Aceptación 1.ª", g.firstTime],
                ["Reportes a tiempo", g.onTime],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{label as string}</dt>
                  <dd className="mt-0.5 text-[18px] font-bold text-[var(--bp-ink)]">{pctLabel(value as number | null)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4 flex flex-col">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Tendencia de desempeño del equipo</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Promedio del equipo por mes, para el año seleccionado.</p>
          <div className="mt-3 min-h-[160px] flex-1">
            <TrendSparkline points={teamTrend} />
          </div>
        </div>
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Ranking por desempeño</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Score de evaluación de desempeño del periodo seleccionado.</p>
          <div className="mt-3">
            {withData.length === 0 ? (
              <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL} para este periodo.</p>
            ) : (
              <BarList items={withData.map((x) => ({ label: x.s.name, value: x.r.performanceScore!, tone: toneFor(x.r.performanceScore!) }))} />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[960px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              {COMPONENT_LABELS.map((label) => (
                <th key={label} className="px-3 py-2 text-right">
                  {label}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Desempeño</th>
              <th className="px-3 py-2 text-right" data-tip="Parte del checklist de las etapas alcanzadas que está hecha. No entra todavía al puntaje de desempeño.">Checklist</th>
              <th className="px-3 py-2 text-right" data-tip="Reportes que el cliente aceptó sin observaciones. No entra todavía al puntaje de desempeño.">Aceptación 1.ª</th>
              <th className="px-3 py-2 text-right" data-tip="Reportes entregados antes de su fecha límite. No entra todavía al puntaje de desempeño.">A tiempo</th>
              <th className="px-3 py-2 text-right">Perfil</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COMPONENT_LABELS.length + 6} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  Aún no hay estrategas para este filtro.
                </td>
              </tr>
            ) : (
              rows.map(({ s, r }, i) => (
                <tr key={s.id} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <Link href={`/dashboard-estrategas/perfil/${s.id}`} className="block rounded-[var(--bp-radius-sm)] hover:opacity-80" title={`Ver el perfil de ${s.name}`}>
                      <StrategistAvatar strategist={s} />
                    </Link>
                    <Badge color={s.employment === "nomina" ? "info" : "neutral"} dot={false} className="mt-1">
                      {EMPLOYMENT_LABELS[s.employment]}
                    </Badge>
                  </td>
                  {performanceComponents(r).map((c) => (
                    <td key={c.key} className="px-3 py-2.5 text-right font-mono">
                      {c.value !== null ? `${c.value}%` : c.key === "peer" ? "NA" : "—"}
                      {c.key === "deadlines" && !getSources(s.id).jira && <span data-tip="Se captura a mano: no usa Jira"> *</span>}
                      {c.key === "deadlines" && r.deadlinesAssigned > 0 && (
                        <>
                          <span className="ml-1 text-[10px] text-[var(--bp-ink-soft)]">{r.deadlinesOnTime}/{r.deadlinesAssigned}</span>
                          <LowSampleBadge assigned={r.deadlinesAssigned} />
                        </>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right font-mono">
                    {r.performanceScore !== null ? `${r.performanceScore}%` : <span className="text-[11px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}</span>}
                  </td>
                  {(["checklistPct", "firstTimePct", "onTimePct"] as const).map((k) => (
                    <td key={k} className="px-3 py-2.5 text-right font-mono" data-tip={processById[s.id].trackedProjects === 0 ? "Sin proyectos con proceso capturado" : `${processById[s.id].trackedProjects} proyecto(s) con proceso capturado`}>
                      {pctLabel(processById[s.id][k])}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/dashboard-estrategas/perfil/${s.id}`}
                      className="bp-tap inline-flex items-center gap-1 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] px-2 py-1 text-[11px] font-semibold text-[var(--bp-ink)] transition-colors duration-[var(--bp-dur)] hover:border-[var(--bp-blue)]"
                    >
                      Ver perfil <span aria-hidden>→</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[var(--bp-ink-soft)]">
        Checklist, aceptación a la primera y reportes a tiempo se miden sobre los proyectos confirmados de cada persona que ya tienen el proceso capturado, no por mes, y por ahora no entran al puntaje de desempeño. Los proyectos con asignación provisional no cuentan.
      </p>

      <ManualDeadlinesNotice compact />

    </div>
  );
}

export default PerformanceTab;
