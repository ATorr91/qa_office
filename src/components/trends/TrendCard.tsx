"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import type { Trend } from "@/lib/trends";

const CATEGORY_COLOR: Record<Trend["category"], string> = {
  IA: "var(--bp-purple)",
  "Diseño UX/UI": "var(--bp-blue)",
  Metodología: "var(--bp-green)",
  Tecnología: "var(--bp-cyan)",
  "Cultura y consumo": "var(--bp-magenta)",
};

export function TrendCard({
  trend,
  onClick,
  onTogglePin,
  onEdit,
  onDelete,
}: {
  trend: Trend;
  onClick: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="relative flex w-full flex-col gap-2 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-3.5 text-left transition-all duration-[var(--bp-dur)] hover:-translate-y-0.5 hover:shadow-[var(--bp-shadow-md)]"
      style={{ borderLeft: `3px solid ${CATEGORY_COLOR[trend.category]}` }}
    >
      <button type="button" onClick={onClick} className="flex flex-col gap-2 text-left">
        <div className="flex items-center justify-between gap-2 pr-14">
          <Badge dot={false} color="neutral" className="!bg-transparent !border-0 !p-0 text-[10px] uppercase tracking-[0.04em]">
            {trend.category}
          </Badge>
        </div>
        <h3 className="pr-14 text-[13px] font-semibold leading-snug text-[var(--bp-ink)]">{trend.title}</h3>
        <p className="line-clamp-2 text-[12px] leading-relaxed text-[var(--bp-ink-soft)]">{trend.summary}</p>
        {trend.pestle.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trend.pestle.map((p) => (
              <span
                key={p}
                className="rounded-[var(--bp-radius-pill)] border border-[var(--bp-border)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.03em] text-[var(--bp-ink-soft)]"
              >
                {p}
              </span>
            ))}
          </div>
        )}
        {trend.adopters.length > 0 && (
          <div className="text-[11px] text-[var(--bp-ink-soft)]">
            <span className="font-medium text-[var(--bp-ink)]">Ya lo usan:</span> {trend.adopters.join(", ")}
          </div>
        )}
        <div className="font-mono text-[10px] text-[var(--bp-ink-soft)]">{trend.source}</div>
      </button>

      <div className="absolute right-3 top-3 flex items-center gap-0.5">
        <button
          type="button"
          aria-label={trend.pinned ? "Quitar de favoritos" : "Marcar como favorito"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin();
          }}
          className={`flex h-6 w-6 items-center justify-center rounded-[var(--bp-radius-sm)] hover:bg-[var(--bp-surface-alt)] ${
            trend.pinned ? "text-[var(--bp-magenta)]" : "text-[var(--bp-ink-soft)]"
          }`}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill={trend.pinned ? "currentColor" : "none"}>
            <path
              d="M8 1.5l1.6 3.7 4 .4-3 2.7.9 3.9L8 10.2l-3.5 2 .9-3.9-3-2.7 4-.4L8 1.5z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Más acciones"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="flex h-6 w-6 items-center justify-center rounded-[var(--bp-radius-sm)] text-[var(--bp-ink-soft)] hover:bg-[var(--bp-surface-alt)]"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
              <circle cx="8" cy="3" r="1.3" fill="currentColor" />
              <circle cx="8" cy="8" r="1.3" fill="currentColor" />
              <circle cx="8" cy="13" r="1.3" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] shadow-[var(--bp-shadow-md)]">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onEdit();
                }}
                className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-ink)] hover:bg-[var(--bp-surface-alt)]"
              >
                Editar
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onDelete();
                }}
                className="block w-full px-3 py-2 text-left text-[12px] text-[var(--bp-danger)] hover:bg-[var(--bp-surface-alt)]"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrendCard;
