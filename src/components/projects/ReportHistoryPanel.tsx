"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { getReportHistory, type Project } from "@/lib/projects";

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function buildCsv(project: Project, rows: ReturnType<typeof getReportHistory>) {
  const header = ["fecha", "tasa_aprobacion", "cobertura", "pruebas_ejecutadas", "bugs_abiertos", "nota"];
  const lines = rows.map((r) =>
    [
      toDateInputValue(r.date),
      r.passRate,
      r.coverage,
      r.testsExecuted,
      r.bugsOpen,
      `"${r.note.replace(/"/g, '""')}"`,
    ].join(","),
  );
  return [`# ${project.name} — historial de reportes QA`, header.join(","), ...lines].join("\n");
}

function downloadCsv(project: Project, rows: ReturnType<typeof getReportHistory>) {
  const csv = buildCsv(project, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.id}-reportes-qa.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportHistoryPanel({ project }: { project: Project }) {
  const allReports = useMemo(() => getReportHistory(project), [project]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [releaseFilter, setReleaseFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    let rows = allReports;
    if (releaseFilter !== "all") {
      const release = project.releases.find((r) => r.label === releaseFilter);
      if (release) {
        const releaseMs = new Date(release.date).getTime();
        const windowMs = 1000 * 60 * 60 * 24 * 10;
        rows = rows.filter((r) => Math.abs(new Date(r.date).getTime() - releaseMs) <= windowMs);
      }
    }
    if (dateFrom) {
      rows = rows.filter((r) => toDateInputValue(r.date) >= dateFrom);
    }
    if (dateTo) {
      rows = rows.filter((r) => toDateInputValue(r.date) <= dateTo);
    }
    return rows;
  }, [allReports, dateFrom, dateTo, releaseFilter, project.releases]);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">Historial de reportes</h2>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 font-mono text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
            aria-label="Desde"
          />
          <span className="text-[12px] text-[var(--bp-ink-soft)]">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 font-mono text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
            aria-label="Hasta"
          />
          <select
            value={releaseFilter}
            onChange={(e) => setReleaseFilter(e.target.value)}
            className="rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1 text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]"
          >
            <option value="all">Toda época/release</option>
            {project.releases.map((r) => (
              <option key={r.label} value={r.label}>
                {r.type === "release" ? "Release" : "Epic"} · {r.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="flex items-center gap-1.5 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--bp-ink)] transition-colors hover:border-[var(--bp-blue)]"
            >
              Descargar
              <svg viewBox="0 0 16 16" className="h-3 w-3">
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-md)]">
                <button
                  type="button"
                  onMouseDown={() => downloadCsv(project, filtered)}
                  className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onMouseDown={() => window.print()}
                  className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
                >
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="text-[var(--bp-ink-soft)]">
              <th className="py-1.5 pr-4 font-medium">Fecha</th>
              <th className="py-1.5 pr-4 font-medium">Aprob.</th>
              <th className="py-1.5 pr-4 font-medium">Cob.</th>
              <th className="py-1.5 pr-4 font-medium">Pruebas</th>
              <th className="py-1.5 pr-4 font-medium">Bugs</th>
              <th className="py-1.5 font-medium">Nota</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[var(--bp-ink-soft)]">
                  Sin reportes en este rango.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.date} className="border-t border-[var(--bp-border)] font-mono">
                  <td className="py-1.5 pr-4">{toDateInputValue(r.date)}</td>
                  <td className="py-1.5 pr-4">{r.passRate}%</td>
                  <td className="py-1.5 pr-4">{r.coverage}%</td>
                  <td className="py-1.5 pr-4">{r.testsExecuted}</td>
                  <td className="py-1.5 pr-4">{r.bugsOpen}</td>
                  <td className="py-1.5 font-sans text-[var(--bp-ink-soft)]">{r.note}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default ReportHistoryPanel;
