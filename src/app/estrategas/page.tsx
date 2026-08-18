"use client";

import { useState } from "react";
import Link from "next/link";
import TrendBoard from "@/components/trends/TrendBoard";
import TrendSearchPanel from "@/components/trends/TrendSearchPanel";
import Tooltip from "@/components/ui/Tooltip";
import { CATEGORY_OPTIONS } from "@/lib/trends";

const TABS = [
  { value: "radar", label: "Radar del equipo" },
  { value: "buscar", label: "Buscar tendencias" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export default function EstrategasPage() {
  const [category, setCategory] = useState<string>("all");
  const [tab, setTab] = useState<Tab>("radar");

  return (
    <div className="bp-anim-page flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="eyebrow" style={{ color: "var(--bp-magenta)" }}>
            Métricas de Estrategas
          </div>
          <Link
            href="/estrategas/conocimiento"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--bp-ink-soft)] hover:text-[var(--bp-blue)]"
          >
            Base de conocimiento
            <svg viewBox="0 0 16 16" className="h-3 w-3">
              <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <h1 className="text-2xl font-bold text-[var(--bp-ink)]">Trend Hunting</h1>
          <Tooltip text="Analizado con marcos de Trendhunting y Futuros Tecnológicos: PESTLE (Político, Económico, Social, Tecnológico, Legal, Ecológico) y Anillos de Impacto por horizonte temporal (Emergente 1–3 años, En adopción 6–12 meses, Mainstream aplica hoy)." />
        </div>
        <p className="mt-1 max-w-2xl text-[13px] text-[var(--bp-ink-soft)]">
          El radar del equipo y la búsqueda de señales de mercado, en un mismo lugar. Se organizan solo por categoría.
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Categoría:</span>
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2.5 py-1 text-[11px] font-medium transition-colors duration-[var(--bp-dur)] ${
            category === "all"
              ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]"
              : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"
          }`}
        >
          Todas
        </button>
        {CATEGORY_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`bp-tap rounded-[var(--bp-radius-pill)] border px-2.5 py-1 text-[11px] font-medium transition-colors duration-[var(--bp-dur)] ${
              category === c
                ? "border-[var(--bp-blue)] bg-[var(--bp-blue)]/10 text-[var(--bp-blue-600)]"
                : "border-[var(--bp-border)] text-[var(--bp-ink-soft)] hover:border-[var(--bp-blue)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <div className="flex gap-1 border-b border-[var(--bp-border)]">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`bp-tap relative px-3 pb-2.5 text-[13px] font-semibold transition-colors duration-[var(--bp-dur)] ${
                tab === t.value ? "text-[var(--bp-blue)]" : "text-[var(--bp-ink-soft)] hover:text-[var(--bp-ink)]"
              }`}
            >
              {t.label}
              {tab === t.value && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--bp-blue)]" />}
            </button>
          ))}
        </div>

        <div className="pt-4">
          <div className={tab === "radar" ? "" : "hidden"}>
            <TrendBoard category={category} />
          </div>
          <div className={tab === "buscar" ? "" : "hidden"}>
            <TrendSearchPanel category={category} />
          </div>
        </div>
      </div>
    </div>
  );
}
