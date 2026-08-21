"use client";

import BarList from "@/components/dashboard/BarList";
import InsightPanel from "@/components/dashboard/InsightPanel";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import TrendSparkline from "@/components/dashboard/TrendSparkline";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { getEffectiveRecordForMonth, useEffectiveRecords, useStrategistDataInputs } from "@/lib/strategistRecords";
import { getMonthShortLabel, monthsInYear, periodYear } from "@/lib/strategists";

const AT_RISK_THRESHOLD = 75;
const NO_DATA_LABEL = "Sin información disponible";

function toneFor(score: number): "good" | "warning" | "danger" {
  if (score >= 90) return "good";
  if (score >= AT_RISK_THRESHOLD) return "warning";
  return "danger";
}

export function QaTab() {
  const rows = useEffectiveRecords();
  const { period } = useDashboardFilters();
  const { filteredStrategists, recordsByStrategist, jiraDeadlines } = useStrategistDataInputs();
  const withData = rows.filter((x) => x.r.qaScore !== null).sort((a, b) => b.r.qaScore! - a.r.qaScore!);

  const teamAvg = withData.length > 0 ? Math.round(withData.reduce((acc, x) => acc + x.r.qaScore!, 0) / withData.length) : null;
  const totalReviews = rows.reduce((acc, x) => acc + (x.r.qaReviewsCount ?? 0), 0);
  const totalIssues = rows.reduce((acc, x) => acc + (x.r.qaIssuesFound ?? 0), 0);
  const atRisk = withData.filter((x) => x.r.qaScore! < AT_RISK_THRESHOLD);

  const teamTrend = monthsInYear(periodYear(period)).map((m) => {
    const scores = filteredStrategists
      .map((s) => getEffectiveRecordForMonth(s, m, recordsByStrategist, jiraDeadlines).qaScore)
      .filter((v): v is number => v !== null);
    return scores.length > 0 ? { label: getMonthShortLabel(m), value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) } : null;
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Calificación QA promedio" value={teamAvg !== null ? `${teamAvg}%` : NO_DATA_LABEL} tone={teamAvg !== null ? toneFor(teamAvg) : "neutral"} />
        <StatTile label="Entregables revisados" value={String(totalReviews)} sublabel="En el periodo seleccionado" />
        <StatTile
          label="Hallazgos de QA"
          value={String(totalIssues)}
          sublabel={`${atRisk.length} estratega${atRisk.length === 1 ? "" : "s"} bajo el umbral de ${AT_RISK_THRESHOLD}%`}
          tone={totalIssues > 0 ? "danger" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Tendencia de calificación QA</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Promedio del equipo por mes, para el año seleccionado.</p>
          <div className="mt-3">
            <TrendSparkline points={teamTrend} color="var(--bp-purple)" />
          </div>
        </div>
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Ranking por calificación QA</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Calificación de calidad de entregables del periodo seleccionado.</p>
          <div className="mt-3">
            {withData.length === 0 ? (
              <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL} para este periodo.</p>
            ) : (
              <BarList items={withData.map((x) => ({ label: x.s.name, value: x.r.qaScore!, tone: toneFor(x.r.qaScore!) }))} />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[560px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              <th className="px-3 py-2 text-right">Revisados</th>
              <th className="px-3 py-2 text-right">Hallazgos</th>
              <th className="px-3 py-2 text-right">Calificación</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  Aún no hay estrategas para este filtro.
                </td>
              </tr>
            ) : (
              rows.map(({ s, r }, i) => (
                <tr key={s.id} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <StrategistAvatar strategist={s} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.qaReviewsCount ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.qaIssuesFound ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {r.qaScore !== null ? `${r.qaScore}%` : <span className="text-[11px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InsightPanel
        alerts={atRisk.map((x) => ({ text: `${x.s.name} tiene una calificación QA de ${x.r.qaScore}% con ${x.r.qaIssuesFound ?? 0} hallazgo${(x.r.qaIssuesFound ?? 0) === 1 ? "" : "s"} en sus entregables.` }))}
      />
    </div>
  );
}

export default QaTab;
