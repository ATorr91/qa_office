"use client";

import BarList from "@/components/dashboard/BarList";
import InsightPanel from "@/components/dashboard/InsightPanel";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { useEffectiveRecords } from "@/lib/strategistRecords";
import { daysSince } from "@/lib/strategists";

const AT_RISK_THRESHOLD = 75;
const OVERDUE_DAYS = 10;
const NO_DATA_LABEL = "Sin información disponible";

function toneFor(score: number): "good" | "warning" | "danger" {
  if (score >= 90) return "good";
  if (score >= AT_RISK_THRESHOLD) return "warning";
  return "danger";
}

export function BitacorasTab() {
  const rows = useEffectiveRecords();
  const withData = rows.filter((x) => x.r.bitacoraComplianceRate !== null).sort((a, b) => b.r.bitacoraComplianceRate! - a.r.bitacoraComplianceRate!);

  const totalExpected = rows.reduce((acc, x) => acc + (x.r.bitacorasExpected ?? 0), 0);
  const totalSubmitted = rows.reduce((acc, x) => acc + (x.r.bitacorasSubmitted ?? 0), 0);
  const teamRate = totalExpected > 0 ? Math.round((totalSubmitted / totalExpected) * 100) : null;
  const behind = withData.filter((x) => x.r.bitacoraComplianceRate! < AT_RISK_THRESHOLD);
  const overdue = rows.filter((x) => x.r.lastBitacoraDate && daysSince(x.r.lastBitacoraDate) > OVERDUE_DAYS);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Cumplimiento de bitácoras" value={teamRate !== null ? `${teamRate}%` : NO_DATA_LABEL} tone={teamRate !== null ? toneFor(teamRate) : "neutral"} />
        <StatTile label="Bitácoras registradas" value={`${totalSubmitted} / ${totalExpected}`} sublabel="En el periodo seleccionado" />
        <StatTile
          label="Estrategas atrasados"
          value={String(overdue.length)}
          sublabel={`Sin registrar hace más de ${OVERDUE_DAYS} días`}
          tone={overdue.length > 0 ? "danger" : "good"}
        />
      </div>

      <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Ranking por cumplimiento de bitácoras</h3>
        <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">% de bitácoras registradas contra las esperadas en el periodo.</p>
        <div className="mt-3">
          {withData.length === 0 ? (
            <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL} para este periodo.</p>
          ) : (
            <BarList items={withData.map((x) => ({ label: x.s.name, value: x.r.bitacoraComplianceRate!, tone: toneFor(x.r.bitacoraComplianceRate!) }))} />
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[600px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              <th className="px-3 py-2 text-right">Registradas</th>
              <th className="px-3 py-2 text-right">Cumplimiento</th>
              <th className="px-3 py-2">Última bitácora</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  Aún no hay estrategas para este filtro.
                </td>
              </tr>
            )}
            {rows.map(({ s, r }, i) => {
              const isOverdue = r.lastBitacoraDate && daysSince(r.lastBitacoraDate) > OVERDUE_DAYS;
              return (
                <tr key={s.id} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <StrategistAvatar strategist={s} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {r.bitacorasExpected !== null ? `${r.bitacorasSubmitted ?? 0} / ${r.bitacorasExpected}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {r.bitacoraComplianceRate !== null ? `${r.bitacoraComplianceRate}%` : <span className="text-[11px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}</span>}
                  </td>
                  <td className={`px-3 py-2.5 font-mono ${isOverdue ? "text-[var(--bp-danger)]" : "text-[var(--bp-ink-soft)]"}`}>
                    {r.lastBitacoraDate ?? "—"}
                    {isOverdue && r.lastBitacoraDate ? ` (hace ${daysSince(r.lastBitacoraDate)} días)` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <InsightPanel
        alerts={[
          ...overdue.map((x) => ({
            text: `${x.s.name} no registra bitácora desde hace ${daysSince(x.r.lastBitacoraDate!)} días.`,
          })),
          ...behind
            .filter((x) => !overdue.some((o) => o.s.id === x.s.id))
            .map((x) => ({ text: `${x.s.name} tiene ${x.r.bitacoraComplianceRate}% de cumplimiento de bitácoras — por debajo de ${AT_RISK_THRESHOLD}%.` })),
        ]}
        tips={[
          "Las bitácoras son la fuente más directa de visibilidad diaria — atrasos aquí suelen anticipar problemas en otras métricas.",
          "Considera un recordatorio automático si un estratega no registra en 3 días hábiles.",
          "Revisa si el formato de la bitácora es demasiado largo; simplificarlo suele mejorar el cumplimiento.",
        ]}
      />
    </div>
  );
}

export default BitacorasTab;
