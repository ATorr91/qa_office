"use client";

import BarList from "@/components/dashboard/BarList";
import InsightPanel from "@/components/dashboard/InsightPanel";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { useEffectiveRecords } from "@/lib/strategistRecords";

const AT_RISK_THRESHOLD = 0;
const NO_DATA_LABEL = "Sin información disponible";

function toneFor(nps: number): "good" | "warning" | "danger" {
  if (nps >= 50) return "good";
  if (nps >= AT_RISK_THRESHOLD) return "warning";
  return "danger";
}

export function NpsTab() {
  const rows = useEffectiveRecords();
  const withData = rows.filter((x) => x.r.npsScore !== null).sort((a, b) => b.r.npsScore! - a.r.npsScore!);

  const teamNps = withData.length > 0 ? Math.round(withData.reduce((acc, x) => acc + x.r.npsScore!, 0) / withData.length) : null;
  const top = withData[0];
  const atRisk = withData.filter((x) => x.r.npsScore! < AT_RISK_THRESHOLD);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="NPS promedio del equipo" value={teamNps !== null ? String(teamNps) : NO_DATA_LABEL} tone={teamNps !== null ? toneFor(teamNps) : "neutral"} />
        <StatTile label="Mejor NPS" value={top ? String(top.r.npsScore) : NO_DATA_LABEL} sublabel={top?.s.name} tone="good" />
        <StatTile
          label="Estrategas en zona de riesgo"
          value={String(atRisk.length)}
          sublabel={`NPS < ${AT_RISK_THRESHOLD}`}
          tone={atRisk.length > 0 ? "danger" : "good"}
        />
      </div>

      <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Ranking por NPS</h3>
        <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">NPS de cuentas propias en el periodo seleccionado.</p>
        <div className="mt-3">
          {withData.length === 0 ? (
            <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL} para este periodo.</p>
          ) : (
            <BarList items={withData.map((x) => ({ label: x.s.name, value: x.r.npsScore!, tone: toneFor(x.r.npsScore!), displayValue: String(x.r.npsScore) }))} />
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[400px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              <th className="px-3 py-2 text-right">NPS</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  Aún no hay estrategas para este filtro.
                </td>
              </tr>
            ) : (
              rows.map(({ s, r }, i) => (
                <tr key={s.id} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <StrategistAvatar strategist={s} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {r.npsScore !== null ? r.npsScore : <span className="text-[11px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InsightPanel alerts={atRisk.map((x) => ({ text: `${x.s.name} tiene un NPS de ${x.r.npsScore} — en zona de riesgo.` }))} />
    </div>
  );
}

export default NpsTab;
