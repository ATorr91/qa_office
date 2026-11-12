"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  type Employment,
} from "@/lib/strategists";

export function DashboardHeader() {
  const {
    searchQuery,
    setSearchQuery,
    employment,
    setEmployment,
    period,
    setPeriod,
    specificDate,
    setSpecificDate,
    clearFilters,
    filteredStrategists,
    lastUpdated,
    jiraDeadlines,
    bitacorasSync,
    externalScores,
  } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();
  const [downloadOpen, setDownloadOpen] = useState(false);
  // Documentación is the same document for every period, so the period/search filters and the report download don't apply there.
  const pathname = usePathname();
  const onDocs = pathname?.startsWith("/dashboard-estrategas/documentacion") ?? false;
  const onDashboard = pathname === "/dashboard-estrategas";
  // A profile is about one person: no search box, and the report download is replaced by its own one-pager button.
  const onProfile = pathname?.startsWith("/dashboard-estrategas/perfil") ?? false;
  // Admin picks its own month and person, so the dashboard's period filters and report download don't apply there either.
  const onAdmin = pathname?.startsWith("/dashboard-estrategas/admin") ?? false;
  // The executive view only needs the period: no search, group or date filters and no dashboard report download.
  const onBrain = pathname?.startsWith("/dashboard-estrategas/cerebro") ?? false;

  // Live sources load in the background; say so, and say which ones failed, instead of letting numbers shift silently.
  const syncing = jiraDeadlines === null || bitacorasSync === null || externalScores === null;
  const failedSources = [
    jiraDeadlines?.error && "Jira",
    bitacorasSync?.error && "Hoja de bitácoras",
    externalScores?.error && "QA / NPS / CSAT",
  ].filter((v): v is string => !!v);

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

  const hasActiveFilters = searchQuery.trim() !== "" || employment !== "all" || period !== getDefaultPeriod() || !!specificDate;
  const selectedYear = periodYear(period);

  return (
    <header className="no-print z-40 bg-[var(--bp-surface)] shadow-[var(--bp-shadow-sm)] md:sticky md:top-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bp-border)] bp-gutter py-3">
        <span className="text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--bp-ink)]">
          {onBrain ? "Cerebro" : "Dashboard de Estrategas"}
        </span>
        <div className="flex items-center gap-3">
          {syncing && (
            <span role="status" className="flex items-center gap-1.5 text-[11px] text-[var(--bp-ink-soft)]">
              <span aria-hidden className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--bp-border)] border-t-[var(--bp-blue)]" />
              Sincronizando fuentes…
            </span>
          )}
          {!syncing && failedSources.length > 0 && (
            <span role="status" data-tip={`No se pudo leer: ${failedSources.join(", ")}. Los números de esas fuentes pueden estar incompletos.`} className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--bp-danger)]">
              <span aria-hidden>⚠</span> Sin conexión: {failedSources.join(", ")}
            </span>
          )}
          <span
            data-tip={`Los datos de este dashboard se actualizaron por última vez el ${lastUpdated}`}
            className="hidden items-center gap-1.5 text-[11px] text-[var(--bp-ink-soft)] sm:flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--bp-green)]" />
            Última actualización: <span className="font-mono text-[var(--bp-ink)]">{lastUpdated}</span>
          </span>
          {!onDocs && !onProfile && !onAdmin && !onBrain && (
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
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bp-gutter py-2.5">
        {!onDocs && !onAdmin && (
          <>
          {!onProfile && !onBrain && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar estratega por nombre o rol…"
            className="w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-3 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none placeholder:text-[var(--bp-ink-soft)] focus:border-[var(--bp-blue)] sm:max-w-xs"
          />
          )}
          {!onBrain && (
          <select
            value={employment}
            onChange={(e) => setEmployment(e.target.value as Employment | "all")}
            aria-label="Filtrar por tipo de estratega"
            className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 text-[12px] font-medium text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
          >
            <option value="all">Nómina y proveedores</option>
            <option value="nomina">Solo nómina</option>
            <option value="proveedor">Solo proveedores</option>
          </select>
          )}
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
          {!onBrain && (
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
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[12px] text-[var(--bp-ink-soft)] underline-offset-2 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
          </>
        )}
        <nav className="ml-auto flex items-center gap-4">
          {!onDashboard && !onAdmin && !onBrain && (
            <Link
              href="/dashboard-estrategas"
              className="bp-tap inline-flex items-center gap-1.5 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] px-2.5 py-1 text-[12px] font-semibold text-[var(--bp-ink)] transition-colors duration-[var(--bp-dur)] hover:border-[var(--bp-blue)]"
            >
              <span aria-hidden>←</span> Volver al dashboard
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default DashboardHeader;
