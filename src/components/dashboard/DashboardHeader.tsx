"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Button from "@/components/ui/Button";
import { dashboardToMarkdown, downloadTextFile } from "@/lib/dashboardExport";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { useStrategistRecords } from "@/lib/strategistRecords";
import {
  annualPeriod,
  getDefaultPeriod,
  getMonthShortLabel,
  isAnnualPeriod,
  isBeforeTrackingStart,
  isFutureMonth,
  monthKey,
  periodYear,
  YEARS,
} from "@/lib/strategists";

export function DashboardHeader() {
  const {
    searchQuery,
    setSearchQuery,
    period,
    setPeriod,
    specificDate,
    setSpecificDate,
    clearFilters,
    filteredStrategists,
    lastUpdated,
    jiraDeadlines,
    bitacorasSync,
  } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();
  const [downloadOpen, setDownloadOpen] = useState(false);

  function handleDownloadMarkdown() {
    downloadTextFile(
      "dashboard-estrategas.md",
      dashboardToMarkdown(filteredStrategists, period, recordsByStrategist, jiraDeadlines, bitacorasSync),
      "text/markdown",
    );
  }

  function handleDownloadPdf() {
    window.print();
  }

  const hasActiveFilters = searchQuery.trim() !== "" || period !== getDefaultPeriod() || !!specificDate;
  const selectedYear = periodYear(period);

  return (
    <header className="no-print sticky top-0 z-40 bg-[var(--bp-surface)] shadow-[var(--bp-shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bp-border)] px-5 py-3 md:px-8">
        <Link href="/" aria-label="Volver al portal" className="flex items-center">
          <Logo variant="dark" style={{ transform: "scale(0.65)", transformOrigin: "left center" }} />
        </Link>
        <span className="text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--bp-ink)]">
          Dashboard de Estrategas
        </span>
        <div className="flex items-center gap-3">
          <span
            title={`Los datos de este dashboard se actualizaron por última vez el ${lastUpdated}`}
            className="hidden items-center gap-1.5 text-[11px] text-[var(--bp-ink-soft)] sm:flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--bp-green)]" />
            Última actualización: <span className="font-mono text-[var(--bp-ink)]">{lastUpdated}</span>
          </span>
          <div className="relative">
            <Button
              kind="outline"
              size="sm"
              onClick={() => setDownloadOpen((v) => !v)}
              onBlur={() => setTimeout(() => setDownloadOpen(false), 150)}
            >
              Descargar reporte ⌄
            </Button>
            {downloadOpen && (
              <div className="bp-modal-panel absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-md)]">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDownloadMarkdown();
                  }}
                  className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
                >
                  Markdown (.md)
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDownloadPdf();
                  }}
                  className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
                >
                  PDF (imprimir)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 md:px-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar estratega por nombre o rol…"
          className="w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none placeholder:text-[var(--bp-ink-soft)] focus:border-[var(--bp-blue)] sm:max-w-xs"
        />
        <select
          value={selectedYear}
          onChange={(e) => setPeriod(annualPeriod(Number(e.target.value)))}
          className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 text-[12px] font-medium text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setPeriod(annualPeriod(selectedYear))}
            className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2.5 py-1 text-[11px] font-medium transition-colors duration-[var(--bp-dur)] ${
              isAnnualPeriod(period)
                ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]"
                : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"
            }`}
          >
            Anual
          </button>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const mk = monthKey(selectedYear, m);
            const future = isFutureMonth(mk);
            const beforeStart = isBeforeTrackingStart(mk);
            const disabled = future || beforeStart;
            return (
              <button
                key={mk}
                type="button"
                disabled={disabled}
                onClick={() => setPeriod(mk)}
                title={future ? "Ese mes todavía no ocurre" : beforeStart ? "Aún no había tracking en este mes" : undefined}
                className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2 py-1 text-[11px] font-medium transition-colors duration-[var(--bp-dur)] ${
                  period === mk
                    ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]"
                    : disabled
                      ? "cursor-not-allowed border-dashed border-[var(--bp-border)] text-[var(--bp-ink-soft)]/50"
                      : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"
                }`}
              >
                {getMonthShortLabel(mk)}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
            Fecha específica:
          </label>
          <input
            type="date"
            value={specificDate ?? ""}
            onChange={(e) => setSpecificDate(e.target.value || null)}
            className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[12px] text-[var(--bp-ink-soft)] underline-offset-2 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
        <Link
          href="/dashboard-estrategas/admin"
          className="ml-auto text-[12px] font-semibold text-[var(--bp-blue-600)] underline-offset-2 hover:underline"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}

export default DashboardHeader;
