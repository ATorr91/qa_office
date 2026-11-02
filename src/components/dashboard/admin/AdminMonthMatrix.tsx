"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import StrategistAvatar from "@/components/dashboard/StrategistAvatar";
import { scoreColor } from "@/components/dashboard/admin/ScoreBreakdown";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { getEffectiveRecordForMonth, useStrategistRecords, type ManualMonthlyData } from "@/lib/strategistRecords";
import { allMonthsWithData, getMonthLabel, STRATEGISTS, type MonthKey } from "@/lib/strategists";

type NumericField = "peerReviewScore" | "okrCompletion" | "deadlineCompliance" | "bitacoraCompliance" | "qaScore";

interface Column {
  field: NumericField;
  label: string;
  min: number;
  max: number;
  /** Metric that also has a live source: its input only shows when the live source has nothing. */
  live?: "deadlineComplianceRate" | "bitacoraComplianceRate" | "qaScore";
  /** Shown after a live value (NPS is a plain number, the rest are percentages). */
  liveSuffix?: string;
}

const COLUMNS: Column[] = [
  { field: "peerReviewScore", label: "Peer review", min: 0, max: 100 },
  { field: "okrCompletion", label: "OKRs y KPIs", min: 0, max: 100 },
  { field: "deadlineCompliance", label: "Deadlines", min: 0, max: 100, live: "deadlineComplianceRate", liveSuffix: "%" },
  { field: "bitacoraCompliance", label: "Bitácoras", min: 0, max: 100, live: "bitacoraComplianceRate", liveSuffix: "%" },
  { field: "qaScore", label: "QA", min: 0, max: 100, live: "qaScore", liveSuffix: "%" },
];

const MONTHS = allMonthsWithData();
const CELL_INPUT =
  "w-[68px] rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 text-right font-mono text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]";

function isOutOfRange(value: number | null, col: Column): boolean {
  return value !== null && (value < col.min || value > col.max);
}

/**
 * One-screen capture for a whole month: every strategist × every metric that feeds the final score,
 * with the resulting average recomputed live as you type. Saving writes to the same store the dashboard
 * reads, so the dashboard average moves as soon as you save.
 */
export function AdminMonthMatrix() {
  const { hydrated, recordsByStrategist, getMonthData, setMonthData, getSources } = useStrategistRecords();
  const { jiraDeadlines, bitacorasSync, externalScores } = useDashboardFilters();
  const [month, setMonth] = useState<MonthKey>(MONTHS[MONTHS.length - 1]);
  const [draft, setDraft] = useState<Record<string, ManualMonthlyData>>({});
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Reload the grid from the store whenever the month changes (or once the stored records have loaded).
  useEffect(() => {
    if (!hydrated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(Object.fromEntries(STRATEGISTS.map((s) => [s.id, getMonthData(s.id, month)])));
    setSavedCount(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, hydrated]);

  const rows = useMemo(
    () =>
      STRATEGISTS.map((s) => {
        const data = draft[s.id];
        // `live` has only what Jira / Sheets report; `effective` adds the typed values, like the dashboard does.
        const live = getEffectiveRecordForMonth(s, month, {}, jiraDeadlines, bitacorasSync, externalScores);
        const effective = data
          ? getEffectiveRecordForMonth(s, month, { [s.id]: { [month]: data } }, jiraDeadlines, bitacorasSync, externalScores)
          : live;
        const stored = getMonthData(s.id, month);
        const sources = getSources(s.id);
        const dirty = data !== undefined && JSON.stringify(data) !== JSON.stringify(stored);
        return { s, data, live, effective, dirty, sources };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, month, jiraDeadlines, bitacorasSync, externalScores, recordsByStrategist],
  );

  const dirtyRows = rows.filter((r) => r.dirty);
  const hasInvalid = rows.some((r) => r.data && COLUMNS.some((c) => isOutOfRange(r.data![c.field], c)));
  const scored = rows.map((r) => r.effective.performanceScore).filter((v): v is number => v !== null);
  const teamAvg = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
  const liveLoading = jiraDeadlines === null || bitacorasSync === null || externalScores === null;

  function setCell(strategistId: string, field: NumericField, raw: string) {
    const t = raw.trim();
    const n = t === "" ? null : Number(t);
    const value = n !== null && Number.isFinite(n) ? n : null;
    setDraft((prev) => ({ ...prev, [strategistId]: { ...prev[strategistId], [field]: value } }));
    setSavedCount(null);
  }

  function handleSave() {
    for (const r of dirtyRows) setMonthData(r.s.id, month, r.data!);
    setSavedCount(dirtyRows.length);
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--bp-ink)]">Captura rápida por mes — todas las métricas</h3>
          <p className="mt-0.5 max-w-3xl text-[12px] text-[var(--bp-ink-soft)]">
            Una fila por estratega, una columna por métrica. El promedio se recalcula al escribir y, al guardar, el dashboard usa los mismos
            valores. Deadlines, Bitácoras y QA se leen en vivo de Jira, Google Sheets y Gmail (<span className="font-medium text-[var(--bp-green)]">en vivo</span>);
            solo puedes teclearlas cuando no hay dato en vivo ese mes.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {MONTHS.map((mk) => (
            <button
              key={mk}
              type="button"
              onClick={() => setMonth(mk)}
              className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-[var(--bp-dur)] ${
                month === mk ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]" : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"
              }`}
            >
              {getMonthLabel(mk)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[860px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Estratega</th>
              {COLUMNS.map((c) => (
                <th key={c.field} className="px-2 py-2 text-right">
                  {c.label}
                  <span className="ml-1 normal-case tracking-normal opacity-70">{c.min < 0 ? "(−100…100)" : "(0-100)"}</span>
                </th>
              ))}
              <th className="px-3 py-2 text-right">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, data, live, effective, dirty, sources }) => (
              <tr key={s.id} className={`border-b border-[var(--bp-border)] last:border-0 transition-colors duration-[var(--bp-dur)] ${dirty ? "bg-[var(--bp-blue)]/5" : ""}`}>
                <td className="px-3 py-2">
                  <StrategistAvatar strategist={s} />
                  {(!sources.jira || !sources.bitacoras) && (
                    <div className="mt-0.5 pl-9 text-[10px] text-[var(--bp-ink-soft)]">
                      {[!sources.jira && "sin Jira", !sources.bitacoras && "sin hoja de bitácoras"].filter(Boolean).join(" · ")} → manual
                    </div>
                  )}
                </td>
                {COLUMNS.map((c) => {
                  const liveValue = c.live ? live[c.live] : null;
                  if (liveValue !== null) {
                    return (
                      <td key={c.field} className="px-2 py-2 text-right">
                        <span className="font-mono text-[12px] font-semibold text-[var(--bp-ink)]">
                          {liveValue}
                          {c.liveSuffix}
                        </span>
                        <span className="ml-1 text-[10px] font-medium text-[var(--bp-green)]">en vivo</span>
                      </td>
                    );
                  }
                  const value = data ? data[c.field] : null;
                  const invalid = isOutOfRange(value, c);
                  return (
                    <td key={c.field} className="px-2 py-1.5 text-right">
                      <input
                        type="number"
                        min={c.min}
                        max={c.max}
                        value={value ?? ""}
                        placeholder={c.field === "peerReviewScore" ? "NA" : "—"}
                        disabled={!data}
                        aria-label={`${c.label} de ${s.name}`}
                        aria-invalid={invalid}
                        onChange={(e) => setCell(s.id, c.field, e.target.value)}
                        className={`${CELL_INPUT} ${invalid ? "border-[var(--bp-danger)] text-[var(--bp-danger)]" : ""}`}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right">
                  <span className="text-[14px] font-bold tabular-nums transition-colors duration-[var(--bp-dur)]" style={{ color: scoreColor(effective.performanceScore) }}>
                    {effective.performanceScore !== null ? `${effective.performanceScore}%` : <span className="text-[11px] font-normal">Sin datos</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[var(--bp-border)] bg-[var(--bp-surface-alt)]">
              <td colSpan={COLUMNS.length + 1} className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
                Promedio del equipo · {getMonthLabel(month)}
              </td>
              <td className="px-3 py-2 text-right text-[15px] font-bold tabular-nums" style={{ color: scoreColor(teamAvg) }}>
                {teamAvg !== null ? `${teamAvg}%` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-[var(--bp-ink-soft)]">
          {liveLoading ? "Cargando datos en vivo de Jira, Google Sheets y Gmail…" : "Un campo vacío significa «sin dato»: no cuenta en el promedio, no se toma como 0."}
          {hasInvalid && <span className="ml-1 font-medium text-[var(--bp-danger)]">Hay valores fuera de rango.</span>}
        </p>
        <div className="flex items-center gap-3">
          {savedCount !== null && (
            <span className="text-[12px] font-medium text-[var(--bp-green)]">
              {savedCount === 0 ? "Sin cambios por guardar" : `Guardado ✓ (${savedCount} ${savedCount === 1 ? "estratega" : "estrategas"})`}
            </span>
          )}
          {dirtyRows.length > 0 && savedCount === null && <span className="text-[12px] text-[var(--bp-ink-soft)]">{dirtyRows.length} con cambios sin guardar</span>}
          <Button kind="primary" size="md" onClick={handleSave} disabled={hasInvalid || dirtyRows.length === 0}>
            Guardar {getMonthLabel(month).split(" ")[0]}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminMonthMatrix;
