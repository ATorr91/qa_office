"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { RING_LABELS, type Trend } from "@/lib/trends";

const CATEGORY_COLOR: Record<Trend["category"], string> = {
  IA: "var(--bp-purple)",
  "Diseño UX/UI": "var(--bp-blue)",
  Metodología: "var(--bp-green)",
  Tecnología: "var(--bp-cyan)",
  "Cultura y consumo": "var(--bp-magenta)",
};

const RING_BADGE: Record<Trend["ring"], "info" | "warning" | "success"> = {
  emergente: "info",
  adopcion: "warning",
  mainstream: "success",
};

function powerScore(t: Trend): number {
  return (t.relevance + t.trending + t.opportunity) / 3;
}

export function TrendsTable({
  trends,
  onOpen,
  onTogglePin,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  trends: Trend[];
  onOpen: (t: Trend) => void;
  onTogglePin: (t: Trend) => void;
  onEdit: (t: Trend) => void;
  onDelete: (t: Trend) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const topIds = new Set(
    [...trends]
      .sort((a, b) => powerScore(b) - powerScore(a))
      .slice(0, 3)
      .map((t) => t.id),
  );

  if (trends.length === 0) {
    return (
      <div className="rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] px-4 py-10 text-center text-[12px] text-[var(--bp-ink-soft)]">
        Sin tendencias para estos filtros.
      </div>
    );
  }

  const allSelected = trends.length > 0 && trends.every((t) => selectedIds.has(t.id));

  return (
    <div className="overflow-x-auto rounded-[var(--bp-radius-md)] border border-[var(--bp-border)]">
      <table className="w-full min-w-[900px] border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-[var(--bp-border)] bg-[var(--bp-surface-alt)] text-[10px] uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
            <th className="w-8 px-3 py-2">
              <input
                type="checkbox"
                aria-label="Seleccionar todas"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="h-3.5 w-3.5 accent-[var(--bp-blue)]"
              />
            </th>
            <th className="w-8 px-3 py-2"></th>
            <th className="px-3 py-2">Tendencia</th>
            <th className="px-3 py-2">Anillo</th>
            <th className="px-3 py-2">Categoría</th>
            <th className="px-3 py-2 text-right">Relevancia</th>
            <th className="px-3 py-2 text-right">Tendencia</th>
            <th className="px-3 py-2 text-right">Oportunidad</th>
            <th className="w-16 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {trends.map((t, i) => {
            const top = topIds.has(t.id);
            const rank = top ? [...topIds].indexOf(t.id) + 1 : null;
            return (
              <tr
                key={t.id}
                onClick={() => onOpen(t)}
                className={`bp-row-in cursor-pointer border-b border-[var(--bp-border)] last:border-0 transition-colors duration-[var(--bp-dur)] hover:bg-[var(--bp-surface-alt)] ${
                  top ? "bg-[var(--bp-blue)]/5" : ""
                }`}
                style={{ borderLeft: `3px solid ${CATEGORY_COLOR[t.category]}`, animationDelay: `${Math.min(i, 12) * 25}ms` }}
              >
                <td className="px-3 py-2.5 align-top" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${t.title}`}
                    checked={selectedIds.has(t.id)}
                    onChange={() => onToggleSelect(t.id)}
                    className="h-3.5 w-3.5 accent-[var(--bp-blue)]"
                  />
                </td>
                <td className="px-3 py-2.5 align-top">
                  <button
                    type="button"
                    aria-label={t.pinned ? "Quitar de favoritos" : "Marcar como favorito"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(t);
                    }}
                    className={`bp-tap flex h-5 w-5 items-center justify-center rounded-[var(--bp-radius-sm)] transition-transform duration-[var(--bp-dur-fast)] hover:scale-110 hover:bg-[var(--bp-surface)] ${
                      t.pinned ? "text-[var(--bp-magenta)]" : "text-[var(--bp-ink-soft)]"
                    }`}
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill={t.pinned ? "currentColor" : "none"}>
                      <path
                        d="M8 1.5l1.6 3.7 4 .4-3 2.7.9 3.9L8 10.2l-3.5 2 .9-3.9-3-2.7 4-.4L8 1.5z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div className="flex items-center gap-1.5">
                    {top && (
                      <span
                        title={`Top ${rank} — mayor puntaje combinado`}
                        className="rounded-[var(--bp-radius-pill)] bg-[var(--bp-magenta)] px-1.5 py-0.5 text-[9px] font-bold text-white"
                      >
                        TOP {rank}
                      </span>
                    )}
                    <span className="font-semibold text-[var(--bp-ink)]">{t.title}</span>
                  </div>
                  {t.adopters.length > 0 && (
                    <div className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">
                      Ya lo usan: {t.adopters.join(", ")}
                    </div>
                  )}
                  {t.pestle.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.pestle.map((p) => (
                        <span
                          key={p}
                          className="rounded-[var(--bp-radius-pill)] border border-[var(--bp-border)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.03em] text-[var(--bp-ink-soft)]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <Badge color={RING_BADGE[t.ring]}>{RING_LABELS[t.ring]}</Badge>
                </td>
                <td className="px-3 py-2.5 align-top text-[var(--bp-ink-soft)]">{t.category}</td>
                <td className="px-3 py-2.5 align-top text-right font-mono">{t.relevance}</td>
                <td className="px-3 py-2.5 align-top text-right font-mono">{t.trending}</td>
                <td className="px-3 py-2.5 align-top text-right font-mono">{t.opportunity}</td>
                <td className="px-3 py-2.5 align-top">
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Más acciones"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId((v) => (v === t.id ? null : t.id));
                      }}
                      onBlur={() => setTimeout(() => setMenuOpenId((v) => (v === t.id ? null : v)), 150)}
                      className="bp-tap flex h-6 w-6 items-center justify-center rounded-[var(--bp-radius-sm)] text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface)]"
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                        <circle cx="8" cy="3" r="1.3" fill="currentColor" />
                        <circle cx="8" cy="8" r="1.3" fill="currentColor" />
                        <circle cx="8" cy="13" r="1.3" fill="currentColor" />
                      </svg>
                    </button>
                    {menuOpenId === t.id && (
                      <div className="bp-modal-panel absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-md)]">
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onEdit(t);
                          }}
                          className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onDelete(t);
                          }}
                          className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-danger)] hover:bg-[var(--bp-surface-alt)]"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TrendsTable;
