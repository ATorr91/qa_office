"use client";

import { useMemo, useState } from "react";

const PHASES = [
  { key: "kickoff", label: "Kickoff", pct: 0, description: "Arranque del proyecto y alineación con el equipo." },
  { key: "plan", label: "Planeación de pruebas", pct: 0.15, description: "Definición del plan de pruebas, casos y ambientes." },
  { key: "exec", label: "Ejecución de pruebas", pct: 0.4, description: "Ciclo principal de ejecución de casos funcionales." },
  { key: "regression", label: "Regresión", pct: 0.65, description: "Pruebas de regresión sobre el alcance completo." },
  { key: "uat", label: "UAT", pct: 0.85, description: "Pruebas de aceptación con el cliente o stakeholders." },
  { key: "close", label: "Cierre", pct: 1, description: "Sign-off y liberación a producción." },
] as const;

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

  const { todayPct, phaseDates, currentPhaseIndex } = useMemo(() => {
    const now = Date.now();
    const span = Math.max(1, end - start);
    const pct = Math.min(1, Math.max(0, (now - start) / span));
    const dates = PHASES.map((phase) => new Date(start + phase.pct * span).toISOString());
    let currentIndex = 0;
    dates.forEach((d, i) => {
      if (new Date(d).getTime() <= now) currentIndex = i;
    });
    return { todayPct: pct, phaseDates: dates, currentPhaseIndex: currentIndex };
  }, [start, end]);

  const [selected, setSelected] = useState(currentPhaseIndex);
  const activePhase = PHASES[selected];
  const activeDate = phaseDates[selected];

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <div className="text-xs text-white/60">Inicio</div>
          <div className="font-semibold text-white">{formatDate(startDate)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-[var(--bp-cyan)]">Hoy</div>
          <div className="font-semibold text-white">
            {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/60">Fin</div>
          <div className="font-semibold text-white">{formatDate(endDate)}</div>
        </div>
      </div>

      <div className="relative mt-6 h-2 rounded-[var(--bp-radius-pill)] bg-white/15">
        <div
          className="absolute inset-y-0 left-0 rounded-[var(--bp-radius-pill)] bg-[var(--bp-cyan)]"
          style={{ width: `${todayPct * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3px_rgba(0,193,211,0.4)]"
          style={{ left: `${todayPct * 100}%` }}
          aria-hidden
        />
        {PHASES.map((phase, i) => (
          <button
            key={phase.key}
            onClick={() => setSelected(i)}
            aria-label={phase.label}
            className="group absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ left: `${phase.pct * 100}%` }}
          >
            <span
              className={`block h-3.5 w-3.5 rounded-full border-2 transition-transform duration-[var(--bp-dur)] group-hover:scale-125 ${
                i === selected
                  ? "border-white bg-[var(--bp-blue)]"
                  : i <= currentPhaseIndex
                    ? "border-white/70 bg-[var(--bp-navy)]"
                    : "border-white/40 bg-transparent"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-white/50">
        {PHASES.map((phase, i) => (
          <button
            key={phase.key}
            onClick={() => setSelected(i)}
            className={`max-w-[80px] text-center leading-tight transition-colors ${
              i === selected ? "text-white" : "hover:text-white/80"
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-[var(--bp-radius-lg)] border border-white/15 bg-white/5 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-white">{activePhase.label}</h3>
          <span className="text-xs text-white/60">{formatDate(activeDate)}</span>
        </div>
        <p className="mt-1 text-sm text-white/70">{activePhase.description}</p>
      </div>
    </div>
  );
}

export default ProjectTimeline;
