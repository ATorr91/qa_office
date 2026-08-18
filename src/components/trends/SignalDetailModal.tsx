"use client";

import Badge from "@/components/ui/Badge";
import { getFreshnessLabel, MEDIA_TYPE_LABELS, type Signal } from "@/lib/signals";

export function SignalDetailModal({ signal, onClose }: { signal: Signal; onClose: () => void }) {
  return (
    <div
      className="bp-modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10 sm:pt-16"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bp-modal-panel flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--bp-border)] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge color="neutral">{signal.category}</Badge>
              {signal.origin === "competencia" ? (
                <Badge color="warning">Competencia</Badge>
              ) : (
                <Badge color="info">Mercado</Badge>
              )}
              <Badge color="neutral">{MEDIA_TYPE_LABELS[signal.mediaType]}</Badge>
            </div>
            <h2 className="mt-2 text-lg font-bold text-[var(--bp-ink)]">{signal.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-[var(--bp-radius-sm)] p-1.5 text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)]"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[13px] leading-relaxed text-[var(--bp-ink-soft)]">{signal.blurb}</p>

          <div className="mt-3 font-mono text-[11px] text-[var(--bp-ink-soft)]">
            Fuente:{" "}
            <a
              href={signal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--bp-blue)] hover:underline"
            >
              {signal.source}
            </a>{" "}
            · {getFreshnessLabel(signal.publishedAt)} · relevancia curada: {signal.heat}
          </div>
          <p className="mt-2 text-[11px] italic text-[var(--bp-ink-soft)]">
            Fuente verificada manualmente antes de añadirse a este radar — el enlace lleva al contenido real.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignalDetailModal;
