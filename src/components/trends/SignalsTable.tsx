"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { getFreshnessLabel, MEDIA_TYPE_LABELS, type Signal } from "@/lib/signals";
import type { FeedbackValue } from "@/lib/signalFeedback";

const PAGE_SIZE = 8;
const SKELETON_COLS = [
  "w-full",
  "w-16",
  "w-20",
  "w-16",
  "w-24",
  "w-20",
  "w-10 ml-auto",
  "w-16 ml-auto",
];

export function SignalsTable({
  signals,
  feedback,
  onFeedback,
  onDismiss,
  onViewDetails,
  loading = false,
}: {
  signals: Signal[];
  feedback: Record<string, FeedbackValue>;
  onFeedback: (id: string, value: FeedbackValue) => void;
  onDismiss: (id: string) => void;
  onViewDetails: (signal: Signal) => void;
  loading?: boolean;
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [signals.length]);

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[960px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Señal</th>
              <th className="px-3 py-2">Categoría</th>
              <th className="px-3 py-2">Origen</th>
              <th className="px-3 py-2">Medio</th>
              <th className="px-3 py-2">Fuente</th>
              <th className="px-3 py-2">Publicado</th>
              <th className="px-3 py-2 text-right">Relevancia</th>
              <th className="w-40 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--bp-border)] last:border-0">
                {SKELETON_COLS.map((w, j) => (
                  <td key={j} className="px-3 py-3">
                    <Skeleton className={`h-3 ${w}`} />
                    {j === 0 && <Skeleton className="mt-2 h-3 w-3/4" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] px-4 py-10 text-center text-[12px] text-[var(--bp-ink-soft)]">
        Sin señales para esta búsqueda.
      </div>
    );
  }

  const topIds = new Set(signals.slice(0, 3).map((s) => s.id));
  const totalPages = Math.max(1, Math.ceil(signals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = signals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
        <table className="w-full min-w-[960px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              <th className="px-3 py-2">Señal</th>
              <th className="px-3 py-2">Categoría</th>
              <th className="px-3 py-2">Origen</th>
              <th className="px-3 py-2">Medio</th>
              <th className="px-3 py-2">Fuente</th>
              <th className="px-3 py-2">Publicado</th>
              <th className="px-3 py-2 text-right">Relevancia</th>
              <th className="w-40 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((s, i) => {
              const top = topIds.has(s.id);
              const rank = top ? [...topIds].indexOf(s.id) + 1 : null;
              const fb = feedback[s.id];
              return (
                <tr
                  key={s.id}
                  className={`bp-row-in border-b border-[var(--bp-border)] transition-colors duration-[var(--bp-dur)] last:border-0 hover:bg-[var(--bp-surface-alt)] ${top ? "bg-[var(--bp-magenta)]/5" : ""}`}
                  style={{ animationDelay: `${i * 25}ms` }}
                >
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex items-center gap-1.5">
                      {top && (
                        <span
                          title={`Top ${rank} — señal más relevante`}
                          className="rounded-[var(--bp-radius-pill)] bg-[var(--bp-magenta)] px-1.5 py-0.5 text-[9px] font-bold text-white"
                        >
                          TOP {rank}
                        </span>
                      )}
                      <span className="font-semibold text-[var(--bp-ink)]">{s.title}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 max-w-md text-[11px] leading-relaxed text-[var(--bp-ink-soft)]">{s.blurb}</p>
                  </td>
                  <td className="px-3 py-2.5 align-top text-[var(--bp-ink-soft)]">{s.category}</td>
                  <td className="px-3 py-2.5 align-top">
                    {s.origin === "competencia" ? (
                      <Badge dot={false} color="warning">
                        Competencia
                      </Badge>
                    ) : (
                      <Badge dot={false} color="neutral">
                        Mercado
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <Badge dot={false} color="neutral">
                      {MEDIA_TYPE_LABELS[s.mediaType]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 align-top font-mono text-[11px]">
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[var(--bp-blue)] hover:underline"
                    >
                      {s.source}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 align-top font-mono text-[11px] text-[var(--bp-ink-soft)]">{getFreshnessLabel(s.publishedAt)}</td>
                  <td className="px-3 py-2.5 align-top text-right font-mono">{s.heat}</td>
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="Ver más detalles"
                        onClick={() => onViewDetails(s)}
                        className="bp-tap flex h-6 w-6 items-center justify-center rounded-[var(--bp-radius-sm)] text-[var(--bp-ink-soft)] transition-transform duration-[var(--bp-dur-fast)] hover:scale-110 hover:bg-[var(--bp-surface-alt)]"
                      >
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
                          <path d="M8 7.3v4M8 5v.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Buena tendencia"
                        onClick={() => onFeedback(s.id, "good")}
                        className={`bp-tap flex h-6 w-6 items-center justify-center rounded-[var(--bp-radius-sm)] transition-transform duration-[var(--bp-dur-fast)] hover:scale-125 hover:bg-[var(--bp-surface-alt)] ${
                          fb === "good" ? "text-[var(--bp-success)]" : "text-[var(--bp-ink-soft)]"
                        }`}
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        title="No me aporta valor"
                        onClick={() => onFeedback(s.id, "bad")}
                        className={`bp-tap flex h-6 w-6 items-center justify-center rounded-[var(--bp-radius-sm)] transition-transform duration-[var(--bp-dur-fast)] hover:scale-125 hover:bg-[var(--bp-surface-alt)] ${
                          fb === "bad" ? "text-[var(--bp-danger)]" : "text-[var(--bp-ink-soft)]"
                        }`}
                      >
                        👎
                      </button>
                      <button
                        type="button"
                        title="Eliminar de resultados"
                        onClick={() => onDismiss(s.id)}
                        className="bp-tap flex h-6 w-6 items-center justify-center rounded-[var(--bp-radius-sm)] text-[var(--bp-ink-soft)] transition-transform duration-[var(--bp-dur-fast)] hover:scale-110 hover:bg-[var(--bp-surface-alt)] hover:text-[var(--bp-danger)]"
                      >
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-[var(--bp-ink-soft)]">
          <span>
            Página {currentPage} de {totalPages} · {signals.length} resultados
          </span>
          <div className="flex gap-1.5">
            <Button kind="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ← Anterior
            </Button>
            <Button kind="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignalsTable;
