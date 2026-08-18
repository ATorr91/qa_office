"use client";

import BarList from "@/components/dashboard/BarList";
import DonutChart from "@/components/dashboard/DonutChart";
import InsightPanel from "@/components/dashboard/InsightPanel";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { useEffectiveRecords } from "@/lib/strategistRecords";

const NO_DATA_LABEL = "Sin información disponible";

function toneFor(nps: number): "good" | "warning" | "danger" {
  if (nps >= 50) return "good";
  if (nps >= 0) return "warning";
  return "danger";
}

export function NpsTab() {
  const rows = useEffectiveRecords();
  const withData = rows.filter((x) => x.r.npsScore !== null).sort((a, b) => b.r.npsScore! - a.r.npsScore!);

  const totalResponses = rows.reduce((acc, x) => acc + (x.r.npsResponses ?? 0), 0);
  const totalPromoters = rows.reduce((acc, x) => acc + (x.r.npsPromoters ?? 0), 0);
  const totalPassives = rows.reduce((acc, x) => acc + (x.r.npsPassives ?? 0), 0);
  const totalDetractors = rows.reduce((acc, x) => acc + (x.r.npsDetractors ?? 0), 0);
  const teamNps = totalResponses > 0 ? Math.round(((totalPromoters - totalDetractors) / totalResponses) * 100) : null;
  const detractorsPresent = rows.filter((x) => (x.r.npsDetractors ?? 0) > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="NPS promedio" value={teamNps !== null ? String(teamNps) : NO_DATA_LABEL} tone={teamNps !== null ? toneFor(teamNps) : "neutral"} />
        <StatTile label="Respuestas de clientes" value={String(totalResponses)} sublabel="En el periodo seleccionado" />
        <StatTile
          label="Clientes detractores"
          value={String(totalDetractors)}
          sublabel={`${detractorsPresent.length} estratega${detractorsPresent.length === 1 ? "" : "s"} con al menos 1`}
          tone={totalDetractors > 0 ? "danger" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Distribución de respuestas</h3>
          <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">Promotores, pasivos y detractores del periodo seleccionado.</p>
          <div className="mt-3">
            {totalResponses === 0 ? (
              <p className="text-[12px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL} para este periodo.</p>
            ) : (
              <DonutChart
                segments={[
                  { label: "Promotores", value: totalPromoters, color: "var(--bp-green)" },
                  { label: "Pasivos", value: totalPassives, color: "#b8860b" },
                  { label: "Detractores", value: totalDetractors, color: "var(--bp-danger)" },
                ]}
                centerValue={String(totalResponses)}
                centerLabel="respuestas"
              />
            )}
          </div>
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
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[600px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              <th className="px-3 py-2 text-right">Promotores</th>
              <th className="px-3 py-2 text-right">Pasivos</th>
              <th className="px-3 py-2 text-right">Detractores</th>
              <th className="px-3 py-2 text-right">NPS</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                  Aún no hay estrategas para este filtro.
                </td>
              </tr>
            ) : (
              rows.map(({ s, r }, i) => (
                <tr key={s.id} className="bp-row-in border-b border-[var(--bp-border)] last:border-0" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                  <td className="px-3 py-2.5">
                    <StrategistAvatar strategist={s} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.npsPromoters ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.npsPassives ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.npsDetractors ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {r.npsScore !== null ? r.npsScore : <span className="text-[11px] text-[var(--bp-ink-soft)]">{NO_DATA_LABEL}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InsightPanel
        alerts={detractorsPresent.map((x) => ({ text: `${x.s.name} tiene ${x.r.npsDetractors} cliente${x.r.npsDetractors === 1 ? "" : "s"} detractor${x.r.npsDetractors === 1 ? "" : "es"} — NPS de ${x.r.npsScore}.` }))}
        tips={[
          "Contacta a los clientes detractores dentro de la semana de la encuesta — el cierre del ciclo importa tanto como la calificación.",
          "Un NPS alto con pocas respuestas puede no ser representativo; prioriza aumentar la tasa de respuesta antes de celebrar el número.",
          "Comparte los comentarios de promotores con el equipo — son el mejor insumo para el playbook de mejores prácticas.",
        ]}
      />
    </div>
  );
}

export default NpsTab;
