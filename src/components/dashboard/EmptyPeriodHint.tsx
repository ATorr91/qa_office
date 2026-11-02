"use client";

import { useDashboardFilters } from "@/lib/dashboardFilters";
import { annualPeriod, getMonthLabel, periodYear, type MonthKey } from "@/lib/strategists";

/** Shown when the selected period has no data for a metric that only arrives now and then: says which months do have it. */
export function EmptyPeriodHint({ monthsWithData, metric }: { monthsWithData: MonthKey[]; metric: string }) {
  const { period, setPeriod } = useDashboardFilters();
  if (monthsWithData.length === 0) return null;
  const sorted = [...monthsWithData].sort();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 py-3">
      <p className="text-[12px] text-[var(--bp-ink)]">
        {metric}: no hay datos en el periodo seleccionado. Sí hay en: <strong>{sorted.map(getMonthLabel).join(", ")}</strong>.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPeriod(annualPeriod(periodYear(period)))}
          className="bp-tap rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] px-2.5 py-1 text-[12px] font-semibold text-[var(--bp-ink)] transition-colors hover:border-[var(--bp-blue)]"
        >
          Ver todo el año
        </button>
        {sorted.length > 1 && (
          <button
            type="button"
            onClick={() => setPeriod(sorted[sorted.length - 1])}
            className="bp-tap rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] px-2.5 py-1 text-[12px] font-semibold text-[var(--bp-ink)] transition-colors hover:border-[var(--bp-blue)]"
          >
            Ir a {getMonthLabel(sorted[sorted.length - 1])}
          </button>
        )}
      </div>
    </div>
  );
}

export default EmptyPeriodHint;
