"use client";

import Badge from "@/components/ui/Badge";
import BarList from "@/components/dashboard/BarList";
import DonutChart from "@/components/dashboard/DonutChart";
import InsightPanel from "@/components/dashboard/InsightPanel";
import StatTile from "@/components/dashboard/StatTile";
import { useEffectiveRecords } from "@/lib/strategistRecords";
import { OKR_STATUS_LABELS, type OkrStatus } from "@/lib/strategists";

const NO_DATA_LABEL = "Sin información disponible";

function toneFor(score: number): "good" | "warning" | "danger" {
  if (score >= 85) return "good";
  if (score >= 60) return "warning";
  return "danger";
}

const STATUS_BADGE: Record<OkrStatus, "success" | "warning" | "danger"> = {
  "on-track": "success",
  "at-risk": "warning",
  "off-track": "danger",
};

export function OkrKpiTab() {
  const rows = useEffectiveRecords();

  const withOkr = rows.filter((x) => x.r.okrCompletion !== null);
  const withKpi = rows.filter((x) => x.r.kpiCompliance !== null);

  const teamOkr = withOkr.length > 0 ? Math.round(withOkr.reduce((acc, x) => acc + x.r.okrCompletion!, 0) / withOkr.length) : null;
  const teamKpi = withKpi.length > 0 ? Math.round(withKpi.reduce((acc, x) => acc + x.r.kpiCompliance!, 0) / withKpi.length) : null;

  const allOkrs = rows.flatMap((x) => x.r.okrs.map((okr) => ({ ...okr, strategist: x.s.name })));
  const onTrack = allOkrs.filter((o) => o.status === "on-track").length;
  const atRisk = allOkrs.filter((o) => o.status === "at-risk").length;
  const offTrack = allOkrs.filter((o) => o.status === "off-track").length;
  const needsAttention = allOkrs.filter((o) => o.status !== "on-track").sort((a, b) => a.progress - b.progress);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Cumplimiento de OKRs" value={teamOkr !== null ? `${teamOkr}%` : NO_DATA_LABEL} tone={teamOkr !== null ? toneFor(teamOkr) : "neutral"} />
        <StatTile label="Cumplimiento de KPIs" value={teamKpi !== null ? `${teamKpi}%` : NO_DATA_LABEL} tone={teamKpi !== null ? toneFor(teamKpi) : "neutral"} />
        <StatTile
          label="OKRs que requieren atención"
          value={String(atRisk + offTrack)}
          sublabel={`${offTrack} fuera de curso · ${atRisk} en riesgo`}
          tone={offTrack > 0 ? "danger" : atRisk > 0 ? "warning" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Estatus de OKRs del equipo</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Distribución de todos los OKRs del periodo seleccionado.</p>
          <div className="mt-3">
            {allOkrs.length === 0 ? (
              <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL} para este periodo.</p>
            ) : (
              <DonutChart
                segments={[
                  { label: "En curso", value: onTrack, color: "var(--bp-green)" },
                  { label: "En riesgo", value: atRisk, color: "#b8860b" },
                  { label: "Fuera de curso", value: offTrack, color: "var(--bp-danger)" },
                ]}
                centerValue={String(onTrack + atRisk + offTrack)}
                centerLabel="OKRs"
              />
            )}
          </div>
        </div>
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Ranking por cumplimiento de OKR</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">% de avance promedio de OKRs por estratega.</p>
          <div className="mt-3">
            {withOkr.length === 0 ? (
              <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL} para este periodo.</p>
            ) : (
              <BarList items={withOkr.map((x) => ({ label: x.s.name, value: x.r.okrCompletion!, tone: toneFor(x.r.okrCompletion!) }))} />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Objetivo</th>
              <th className="px-3 py-2">Responsable</th>
              <th className="px-3 py-2 text-right">Avance</th>
              <th className="px-3 py-2">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {needsAttention.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  {allOkrs.length === 0 ? `${NO_DATA_LABEL} para este periodo.` : "Todos los OKRs del periodo están en curso."}
                </td>
              </tr>
            ) : (
              needsAttention.map((okr, i) => (
                <tr key={`${okr.strategist}-${i}`} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-[var(--bp-ink)]">{okr.objective}</div>
                    <div className="text-[11px] text-[var(--bp-ink-soft)]">{okr.keyResult}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--bp-ink-soft)]">{okr.strategist}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{okr.progress}%</td>
                  <td className="px-3 py-2.5">
                    <Badge color={STATUS_BADGE[okr.status]}>{OKR_STATUS_LABELS[okr.status]}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InsightPanel
        alerts={needsAttention
          .filter((o) => o.status === "off-track")
          .map((o) => ({ text: `"${o.objective}" (${o.strategist}) está fuera de curso con ${o.progress}% de avance.` }))}
        tips={[
          "Revisa en el check-in semanal los OKRs en riesgo antes de que pasen a fuera de curso.",
          "Un KPI incumplido de forma recurrente suele señalar un problema de capacidad, no de esfuerzo.",
          "Vincula cada Key Result a una fecha de checkpoint intermedio, no solo a la fecha final del periodo.",
        ]}
      />
    </div>
  );
}

export default OkrKpiTab;
