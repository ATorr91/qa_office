"use client";

import BarList from "@/components/dashboard/BarList";
import ImportantComments from "@/components/dashboard/ImportantComments";
import EmptyPeriodHint from "@/components/dashboard/EmptyPeriodHint";
import InsightPanel from "@/components/dashboard/InsightPanel";
import StatTile from "@/components/dashboard/StatTile";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import Badge from "@/components/ui/Badge";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { useEffectiveRecords } from "@/lib/strategistRecords";
import { importantComments } from "@/lib/npsComments";
import { isBeforeTrackingStart, monthsForPeriod, STRATEGISTS } from "@/lib/strategists";

const AT_RISK_THRESHOLD = 0;
const NO_DATA_LABEL = "Sin información disponible";

function toneFor(nps: number): "good" | "warning" | "danger" {
  if (nps >= 50) return "good";
  if (nps >= AT_RISK_THRESHOLD) return "warning";
  return "danger";
}

export function NpsTab() {
  const rows = useEffectiveRecords();
  const { period, externalScores, filteredStrategists } = useDashboardFilters();
  const withData = rows.filter((x) => x.r.npsScore !== null).sort((a, b) => b.r.npsScore! - a.r.npsScore!);

  const teamNps = withData.length > 0 ? Math.round(withData.reduce((acc, x) => acc + x.r.npsScore!, 0) / withData.length) : null;
  const top = withData[0];
  const atRisk = withData.filter((x) => x.r.npsScore! < AT_RISK_THRESHOLD);

  // Surveys sent in the selected period for the strategists currently shown.
  const shownIds = new Set(filteredStrategists.map((s) => s.id));
  const periodMonths = new Set(monthsForPeriod(period));
  const surveys = (externalScores?.npsSurveys ?? []).filter((v) => periodMonths.has(v.surveyDate.slice(0, 7)) && v.strategistIds.some((id) => shownIds.has(id)));
  const nameOf = (id: string) => filteredStrategists.find((s) => s.id === id)?.name ?? id;
  const comments = importantComments(externalScores?.npsSurveys ?? [], STRATEGISTS, periodMonths, shownIds);
  const monthsWithData = [...new Set((externalScores?.npsSurveys ?? []).filter((v) => v.answer !== null).map((v) => v.surveyDate.slice(0, 7)))].filter((m) => !isBeforeTrackingStart(m));

  return (
    <div className="flex flex-col gap-4">
      {withData.length === 0 && <EmptyPeriodHint monthsWithData={monthsWithData} metric="El NPS" />}
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

      <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Encuestas por proyecto</h3>
        <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">
          Una encuesta por proyecto. «Calificación» es el promedio de sus respuestas de 1 a 5; si la página no la trae escrita, se calcula con las respuestas.
        </p>
        <div className="mt-3 overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
          <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Proyecto</th>
                <th className="px-3 py-2 text-right">Recomendación (1-10)</th>
                <th className="px-3 py-2">Clasificación</th>
                <th className="px-3 py-2 text-right">Calificación ⭐</th>
                <th className="px-3 py-2">Responsables</th>
              </tr>
            </thead>
            <tbody>
              {surveys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
                    {NO_DATA_LABEL} para este periodo.
                  </td>
                </tr>
              ) : (
                surveys.map((v) => (
                  <tr key={v.ref} className="border-b border-[var(--bp-border)] last:border-0">
                    <td className="px-3 py-2 font-mono text-[var(--bp-ink-soft)]">{v.surveyDate}</td>
                    <td className="px-3 py-2 font-medium text-[var(--bp-ink)]">{v.accountName}</td>
                    <td className="px-3 py-2 text-right font-mono">{v.answer ?? "—"}</td>
                    <td className="px-3 py-2">
                      {v.answer === null ? (
                        <Badge color="neutral">Pendiente</Badge>
                      ) : v.answer >= 9 ? (
                        <Badge color="success">Promotor</Badge>
                      ) : v.answer >= 7 ? (
                        <Badge color="warning">Neutral</Badge>
                      ) : (
                        <Badge color="danger">Detractor</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {v.rating !== null ? v.rating.toFixed(1) : "—"}
                      {v.ratingDerived && <span className="ml-1 text-[10px] text-[var(--bp-ink-soft)]">calculada</span>}
                    </td>
                    <td className="px-3 py-2 text-[var(--bp-ink-soft)]">{v.strategistIds.map(nameOf).join(", ") || "Sin asignar"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Comentarios importantes del cliente</h3>
        <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">
          Respuestas escritas de las encuestas del periodo. Primero las del proyecto —las que nombran a la persona y luego las que piden mejorar— y al final las del proceso comercial o administrativo.
        </p>
        <div className="mt-3">
          <ImportantComments comments={comments} empty="Sin comentarios del cliente en este periodo." loading={externalScores === null} failed={!!externalScores?.error} />
        </div>
      </div>

      <InsightPanel alerts={atRisk.map((x) => ({ text: `${x.s.name} tiene un NPS de ${x.r.npsScore} — en zona de riesgo.` }))} />
    </div>
  );
}

export default NpsTab;
