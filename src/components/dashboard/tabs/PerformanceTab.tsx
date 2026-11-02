"use client";

import Link from "next/link";
import BarList from "@/components/dashboard/BarList";
import LowSampleBadge from "@/components/dashboard/LowSampleBadge";
import ManualDeadlinesNotice from "@/components/dashboard/ManualDeadlinesNotice";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import TrendSparkline from "@/components/dashboard/TrendSparkline";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { getEffectiveRecordForMonth, performanceComponents, useEffectiveRecords, useStrategistDataInputs, useStrategistRecords } from "@/lib/strategistRecords";
import { getMonthShortLabel, monthsInYear, periodYear } from "@/lib/strategists";

const AT_RISK_THRESHOLD = 70;
const NO_DATA_LABEL = "Sin información disponible";
// Same five inputs, same order, as the average they roll up into (see performanceComponents).
const COMPONENT_LABELS = ["Peer review", "OKRs y KPIs", "Deadlines", "Bitácoras", "QA"];

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
        <table className="w-full min-w-[760px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              {COMPONENT_LABELS.map((label) => (
                <th key={label} className="px-3 py-2 text-right">
                  {label}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Desempeño</th>
              <th className="px-3 py-2 text-right">Perfil</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COMPONENT_LABELS.length + 3} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
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
                  </td>
                  {performanceComponents(r).map((c) => (
                    <td key={c.key} className="px-3 py-2.5 text-right font-mono">
                      {c.value !== null ? `${c.value}%` : c.key === "peer" ? "NA" : "—"}
                      {c.key === "deadlines" && !getSources(s.id).jira && <span title="Se captura a mano: no usa Jira"> *</span>}
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

      <ManualDeadlinesNotice compact />

    </div>
  );
}

export default PerformanceTab;
