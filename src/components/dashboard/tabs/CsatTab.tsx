"use client";

import BarList from "@/components/dashboard/BarList";
import EmptyPeriodHint from "@/components/dashboard/EmptyPeriodHint";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import TrendSparkline from "@/components/dashboard/TrendSparkline";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { getEffectiveRecordForMonth, useEffectiveRecords, useStrategistDataInputs } from "@/lib/strategistRecords";
import { getMonthShortLabel, monthsInYear, periodYear, type MonthKey } from "@/lib/strategists";

const AT_RISK_THRESHOLD = 70;
const NO_DATA_LABEL = "Sin información disponible";

function toneFor(score: number): "good" | "warning" | "danger" {
  if (score >= 85) return "good";
  if (score >= AT_RISK_THRESHOLD) return "warning";
  return "danger";
}

/** Client satisfaction (CSAT) per strategist. Informational: it does not feed the performance average. */
export function CsatTab() {
  const rows = useEffectiveRecords();
  const { period } = useDashboardFilters();
  const { filteredStrategists, recordsByStrategist, jiraDeadlines, bitacorasSync, externalScores } = useStrategistDataInputs();
  const withData = rows.filter((x) => x.r.csatScore !== null).sort((a, b) => b.r.csatScore! - a.r.csatScore!);

  const teamAvg = withData.length > 0 ? Math.round(withData.reduce((acc, x) => acc + x.r.csatScore!, 0) / withData.length) : null;
  const totalResponses = rows.reduce((acc, x) => acc + x.r.csatResponses, 0);
  const lowest = withData.length > 1 ? withData[withData.length - 1] : null;
  const lastSync = externalScores?.lastSync.csat ?? null;
  const monthsWithData = [
    ...new Set(filteredStrategists.flatMap((s) => Object.entries(externalScores?.byStrategistId[s.id] ?? {}).filter(([, v]) => v.csat !== null).map(([m]) => m as MonthKey))),
  ].filter((m) => monthsInYear(periodYear(period)).includes(m));

  const teamTrend = monthsInYear(periodYear(period))
    .map((m) => {
      const scores = filteredStrategists
        .map((s) => getEffectiveRecordForMonth(s, m, recordsByStrategist, jiraDeadlines, bitacorasSync, externalScores).csatScore)
        .filter((v): v is number => v !== null);
      return scores.length > 0 ? { label: getMonthShortLabel(m), value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  return (
    <div className="flex flex-col gap-4">
      {withData.length === 0 && <EmptyPeriodHint monthsWithData={monthsWithData} metric="El CSAT" />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="CSAT promedio del equipo" value={teamAvg !== null ? `${teamAvg}%` : NO_DATA_LABEL} tone={teamAvg !== null ? toneFor(teamAvg) : "neutral"} />
        <StatTile label="Respuestas en el periodo" value={String(totalResponses)} sublabel="Suma de las respuestas de sus cuentas" />
        <StatTile
          label="Sincronización"
          value={lastSync ? new Date(lastSync).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "Pendiente"}
          sublabel={lowest ? `Más bajo: ${lowest.s.name} (${lowest.r.csatScore}%)` : lastSync ? "Última actualización de la hoja" : "Aún no llega la primera sincronización de la hoja"}
          tone={lastSync ? "neutral" : "warning"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex flex-col rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Tendencia de CSAT</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Promedio del equipo por mes, para el año seleccionado.</p>
          <div className="mt-3 min-h-[160px] flex-1">
            <TrendSparkline points={teamTrend} color="var(--bp-cyan)" />
          </div>
        </div>
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Ranking por CSAT</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Promedio de las respuestas de las cuentas de cada estratega.</p>
          <div className="mt-3">
            {withData.length === 0 ? (
              <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL} para este periodo.</p>
            ) : (
              <BarList items={withData.map((x) => ({ label: x.s.name, value: x.r.csatScore!, tone: toneFor(x.r.csatScore!) }))} />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[420px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              <th className="px-3 py-2 text-right">Respuestas</th>
              <th className="px-3 py-2 text-right">CSAT</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  Aún no hay estrategas para este filtro.
                </td>
              </tr>
            ) : (
              rows.map(({ s, r }, i) => (
                <tr key={s.id} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <StrategistAvatar strategist={s} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.csatResponses > 0 ? r.csatResponses : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {r.csatScore !== null ? `${r.csatScore}%` : <span className="text-[11px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CsatTab;
