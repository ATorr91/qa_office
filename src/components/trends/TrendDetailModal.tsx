"use client";

import Badge from "@/components/ui/Badge";
import { RING_LABELS, RING_TIMEFRAME, type Trend } from "@/lib/trends";

const RING_BADGE: Record<Trend["ring"], "info" | "warning" | "success"> = {
  emergente: "info",
  adopcion: "warning",
  mainstream: "success",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export function TrendDetailModal({ trend, onClose }: { trend: Trend; onClose: () => void }) {
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
              <Badge color={RING_BADGE[trend.ring]}>
                {RING_LABELS[trend.ring]} · {RING_TIMEFRAME[trend.ring]}
              </Badge>
              <Badge color="neutral">{trend.category}</Badge>
            </div>
            <h2 className="mt-2 text-lg font-bold text-[var(--bp-ink)]">{trend.title}</h2>
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
          <p className="text-[13px] leading-relaxed text-[var(--bp-ink-soft)]">{trend.summary}</p>

          <div className="mt-3 font-mono text-[11px] text-[var(--bp-ink-soft)]">
            Fuente:{" "}
            {trend.sourceUrl ? (
              <a href={trend.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--bp-blue)] hover:underline">
                {trend.source}
              </a>
            ) : (
              trend.source
            )}{" "}
            · detectada el {formatDate(trend.spottedAt)}
          </div>

          {trend.pestle.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {trend.pestle.map((p) => (
                <Badge key={p} dot={false} color="neutral">
                  {p}
                </Badge>
              ))}
            </div>
          )}

          {(trend.realExamples.length > 0 || trend.adopters.length > 0 || trend.impactPotential) && (
            <div className="mt-5 flex flex-col gap-3 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] p-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink)]">
                Ejemplos reales y adopción
              </h3>
              {trend.realExamples.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {trend.realExamples.map((ex, i) => (
                    <li key={`${ex.org}-${i}`} className="text-[13px] leading-relaxed text-[var(--bp-ink-soft)]">
                      <span className="font-semibold text-[var(--bp-ink)]">{ex.org}</span> — {ex.detail}
                    </li>
                  ))}
                </ul>
              )}
              {trend.adopters.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {trend.adopters.map((a) => (
                    <Badge key={a} dot={false} color="info">
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
              {trend.impactPotential && (
                <div>
                  <div className="text-[12px] font-semibold text-[var(--bp-blue-600)]">Impacto potencial</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--bp-ink-soft)]">{trend.impactPotential}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink)]">
              El filtro de negocio — &quot;¿So What?&quot;
            </h3>
            <SoWhatItem question="¿Por qué nos importa esto?" answer={trend.soWhat.porque} />
            <SoWhatItem question="¿Cómo impacta a nuestros clientes?" answer={trend.soWhat.impacto} />
            <SoWhatItem question="¿Qué acción concreta podemos hacer esta semana?" answer={trend.soWhat.accion} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SoWhatItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] p-3">
      <div className="text-[12px] font-semibold text-[var(--bp-blue-600)]">{question}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--bp-ink-soft)]">{answer}</p>
    </div>
  );
}

export default TrendDetailModal;
