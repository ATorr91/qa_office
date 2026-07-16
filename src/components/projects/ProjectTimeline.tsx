"use client";

import { useMemo, useState } from "react";

const PHASES = [
  { key: "kickoff", label: "Kickoff", pct: 0, description: "Arranque del proyecto y alineación con el equipo." },
  { key: "plan", label: "Planeación", pct: 0.15, description: "Definición del plan de pruebas, casos y ambientes." },
  { key: "exec", label: "Ejecución", pct: 0.4, description: "Ciclo principal de ejecución de casos funcionales." },
  { key: "regression", label: "Regresión", pct: 0.65, description: "Pruebas de regresión sobre el alcance completo." },
  { key: "uat", label: "UAT", pct: 0.85, description: "Pruebas de aceptación con el cliente o stakeholders." },
  { key: "close", label: "Cierre", pct: 1, description: "Sign-off y liberación a producción." },
] as const;

const TICKS = Array.from({ length: 11 }, (_, i) => i * 10);
const DAY_MS = 1000 * 60 * 60 * 24;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProjectTimeline({ startDate, endDate }: { startDate: string; endDate: string }) {
  const start = useMemo(() => new Date(startDate).getTime(), [startDate]);
  const end = useMemo(() => new Date(endDate).getTime(), [endDate]);

  const { todayPct, phaseDates, currentPhaseIndex, totalDays, elapsedDays, daysRemaining } =
    useMemo(() => {
      const now = Date.now();
      const span = Math.max(1, end - start);
      const pct = Math.min(1, Math.max(0, (now - start) / span));
      const dates = PHASES.map((phase) => new Date(start + phase.pct * span).toISOString());
      let currentIndex = 0;
      dates.forEach((d, i) => {
        if (new Date(d).getTime() <= now) currentIndex = i;
      });
      const total = Math.round(span / DAY_MS);
      const elapsed = Math.min(total, Math.max(0, Math.round((now - start) / DAY_MS)));
      return {
        todayPct: pct,
        phaseDates: dates,
        currentPhaseIndex: currentIndex,
        totalDays: total,
        elapsedDays: elapsed,
        daysRemaining: Math.max(0, total - elapsed),
      };
    }, [start, end]);

  const [selected, setSelected] = useState(currentPhaseIndex);
  const [hovered, setHovered] = useState<number | null>(null);
  const activeIndex = hovered ?? selected;
  const activePhase = PHASES[activeIndex];
  const activeDate = phaseDates[activeIndex];

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setSelected((s) => Math.min(PHASES.length - 1, s + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
    }
  }

  return (
    <div className="font-mono" onKeyDown={onKeyDown} tabIndex={0} role="group" aria-label="Roadmap del proyecto">
      <div className="flex flex-wrap items-start justify-between gap-3 text-[11px]">
        <div>
          <div className="uppercase tracking-[0.14em] text-white/45">Inicio</div>
          <div className="mt-0.5 text-[13px] font-semibold text-white">{formatDate(startDate)}</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 uppercase tracking-[0.14em] text-[var(--bp-cyan)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--bp-cyan)] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--bp-cyan)]" />
            </span>
            Hoy
          </div>
          <div className="mt-0.5 text-[13px] font-semibold text-white">
            {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          <div className="mt-0.5 text-[10px] text-white/45">
            día {elapsedDays}/{totalDays} · {Math.round(todayPct * 100)}% · {daysRemaining}d restantes
          </div>
        </div>

        <div className="text-right">
          <div className="uppercase tracking-[0.14em] text-white/45">Fin</div>
          <div className="mt-0.5 text-[13px] font-semibold text-white">{formatDate(endDate)}</div>
        </div>
      </div>

      <div className="relative mt-7 h-2">
        {/* ruler ticks */}
        <div className="absolute -top-1.5 left-0 right-0 flex justify-between px-px">
          {TICKS.map((t) => (
            <span key={t} className="h-1 w-px bg-white/15" />
          ))}
        </div>

        <div className="relative h-full rounded-[var(--bp-radius-pill)] bg-white/10">
          <div
            className="absolute inset-y-0 left-0 overflow-hidden rounded-[var(--bp-radius-pill)] bg-gradient-to-r from-[var(--bp-blue)] to-[var(--bp-cyan)]"
            style={{ width: `${todayPct * 100}%` }}
          >
            <span className="absolute inset-y-0 left-0 w-1/3 animate-[bp-shimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>

          {/* today marker */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${todayPct * 100}%` }}
            aria-hidden
          >
            <span className="absolute inset-0 -m-1.5 animate-ping rounded-full bg-[var(--bp-cyan)]/50" />
            <span className="relative block h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(0,193,211,0.55)]" />
          </div>

          {PHASES.map((phase, i) => (
            <button
              key={phase.key}
              type="button"
              onClick={() => setSelected(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              aria-label={phase.label}
              aria-pressed={i === selected}
              className="group absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center outline-none"
              style={{ left: `${phase.pct * 100}%` }}
            >
              <span
                className={`block h-3 w-3 rounded-full border-2 transition-all duration-[var(--bp-dur)] group-hover:scale-125 group-focus-visible:scale-125 ${
                  i === selected
                    ? "border-white bg-[var(--bp-blue)] shadow-[0_0_0_4px_rgba(22,161,205,0.35)]"
                    : i <= currentPhaseIndex
                      ? "border-white/70 bg-[var(--bp-navy)]"
                      : "border-white/35 bg-transparent"
                }`}
              />
              <span
                className={`pointer-events-none absolute bottom-full mb-2.5 whitespace-nowrap rounded-[var(--bp-radius-sm)] bg-black/85 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity duration-150 ${
                  hovered === i ? "opacity-100" : "group-focus-visible:opacity-100"
                }`}
              >
                {phase.label} · {formatDate(phaseDates[i])}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex justify-between text-[10px]">
        {PHASES.map((phase, i) => (
          <button
            key={phase.key}
            type="button"
            onClick={() => setSelected(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={`max-w-[74px] text-center leading-tight transition-colors ${
              i === selected ? "text-white" : "text-white/45 hover:text-white/75"
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>

      <div
        key={activeIndex}
        className="mt-5 animate-[bp-fade-in_240ms_ease] rounded-[var(--bp-radius-md)] border border-white/15 bg-white/5 p-3.5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-sans text-[13px] font-semibold text-white">{activePhase.label}</h3>
          <span className="text-[11px] text-white/55">{formatDate(activeDate)}</span>
        </div>
        <p className="mt-1 font-sans text-[13px] text-white/70">{activePhase.description}</p>
      </div>
    </div>
  );
}

export default ProjectTimeline;
