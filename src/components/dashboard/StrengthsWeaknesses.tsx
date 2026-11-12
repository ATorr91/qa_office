"use client";

import Link from "next/link";
import { useProjectProcess } from "@/lib/projectProcess";
import { EMPTY_PROFILE_NOTES } from "@/lib/projectProcessTypes";
import type { EffectiveRecord } from "@/lib/strategistRecords";
import { deriveInsights, STRONG_FROM, WEAK_BELOW, type Insight } from "@/lib/strategistInsights";

type Side = "strengths" | "weaknesses";

const SIDE: Record<Side, { title: string; wash: string; empty: string; mark: string }> = {
  strengths: {
    title: "Fortalezas",
    wash: "color-mix(in srgb, var(--bp-green) 34%, white)",
    empty: "Todavía no hay fortalezas capturadas.",
    mark: "M3.5 8.5l3 3 6-6.5",
  },
  weaknesses: {
    title: "Debilidades",
    wash: "color-mix(in srgb, var(--bp-warning) 55%, white)",
    empty: "Todavía no hay debilidades capturadas.",
    mark: "M8 4v5M8 11.5v.5",
  },
};

function Column({ side, written, derived }: { side: Side; written: string[]; derived: Insight[] }) {
  const { title, wash, empty, mark } = SIDE[side];
  const none = written.length === 0 && derived.length === 0;
  return (
    <div className="min-w-0 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] p-3">
      <h3 className="flex items-center gap-2 text-[13px] font-bold text-[var(--bp-ink)]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--bp-ink)]" style={{ backgroundColor: wash }}>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path d={mark} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {title}
        <span className="text-[11px] font-medium tabular-nums text-[var(--bp-ink-soft)]">{written.length + derived.length}</span>
      </h3>
      {none ? (
        <p className="mt-2 text-[12px] text-[var(--bp-ink-soft)]">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {written.map((t, i) => (
            <li key={`w${i}`} className="bp-row-in rounded-[var(--bp-radius-sm)] px-2 py-1.5 text-[12px] leading-snug text-[var(--bp-ink)] transition-colors duration-[var(--bp-dur-fast)] hover:bg-[var(--bp-surface-alt)]" style={{ animationDelay: `${i * 40}ms` }}>
              {t}
              <span className="ml-1.5 text-[10.5px] text-[var(--bp-ink-soft)]">Capturado por el equipo</span>
            </li>
          ))}
          {derived.map((d, i) => (
            <li key={`d${i}`} className="bp-row-in rounded-[var(--bp-radius-sm)] px-2 py-1.5 text-[12px] leading-snug text-[var(--bp-ink)] transition-colors duration-[var(--bp-dur-fast)] hover:bg-[var(--bp-surface-alt)]" style={{ animationDelay: `${(written.length + i) * 40}ms` }}>
              {d.text}
              <span className="ml-1.5 text-[10.5px] text-[var(--bp-ink-soft)]">{d.source}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A person's strengths and weaknesses: what the team wrote in Admin, plus what the dashboard's own data and comments say. */
export function StrengthsWeaknesses({ strategistId, record, className = "" }: { strategistId: string; record: EffectiveRecord; className?: string }) {
  const { settings, hydrated } = useProjectProcess();
  const notes = settings.profiles[strategistId] ?? EMPTY_PROFILE_NOTES;
  const insights = deriveInsights(record);

  return (
    <section className={`rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4 print:break-inside-avoid print:p-3 ${className}`}>
      <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">Fortalezas y debilidades</h2>
      <p className="mt-0.5 text-[11px] text-[var(--bp-ink-soft)]">
        Lo que escribe el equipo, más lo que dicen los datos del periodo: una métrica de {STRONG_FROM}% o más cuenta como fortaleza y una menor de {WEAK_BELOW}% como debilidad.{" "}
        <Link href="/dashboard-estrategas/admin#perfiles" className="underline print:hidden">
          Editar
        </Link>
      </p>
      <div className="mt-2.5 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
        {hydrated ? (
          <>
            <Column side="strengths" written={notes.strengths} derived={insights.strengths} />
            <Column side="weaknesses" written={notes.weaknesses} derived={insights.weaknesses} />
          </>
        ) : (
          <p className="text-[12px] text-[var(--bp-ink-soft)]">Cargando…</p>
        )}
      </div>
    </section>
  );
}

export default StrengthsWeaknesses;
