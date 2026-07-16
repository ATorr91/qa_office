"use client";

import { useMemo, useState, type ReactNode } from "react";
import { getReportHistory, type Project } from "@/lib/projects";

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

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function isSameDay(a: number, b: number) {
  return Math.abs(a - b) < DAY_MS;
}

export function ProjectTimeline({ project }: { project: Project }) {
  const start = useMemo(() => new Date(project.startDate).getTime(), [project.startDate]);
  const end = useMemo(() => new Date(project.endDate).getTime(), [project.endDate]);
  const now = useMemo(() => clamp(Date.now(), start, end), [start, end]);
  const reportHistory = useMemo(() => getReportHistory(project), [project]);

  const span = Math.max(1, end - start);
  const phaseDates = PHASES.map((phase) => start + phase.pct * span);
  const realTodayPct = (clamp(Date.now(), start, end) - start) / span;
  const totalDays = Math.round(span / DAY_MS);

  const [scrubMs, setScrubMs] = useState(now);
  const scrubPct = (scrubMs - start) / span;
  const scrubDay = Math.round((scrubMs - start) / DAY_MS);
  const isToday = isSameDay(scrubMs, Date.now());
  const isPast = scrubMs < Date.now() && !isToday;

  const activePhaseIndex = useMemo(() => {
    let idx = 0;
    phaseDates.forEach((d, i) => {
      if (d <= scrubMs) idx = i;
    });
    return idx;
  }, [phaseDates, scrubMs]);
  const activePhase = PHASES[activePhaseIndex];

  const nearestReport = useMemo(() => {
    let candidate = reportHistory[0];
    for (const r of reportHistory) {
      if (new Date(r.date).getTime() <= scrubMs) candidate = r;
    }
    return candidate;
  }, [reportHistory, scrubMs]);

  const nearbyActionables = useMemo(() => {
    return [...project.actionables]
      .map((a) => ({ ...a, delta: Math.abs(new Date(a.due).getTime() - scrubMs) }))
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 3);
  }, [project.actionables, scrubMs]);

  const events = useMemo(() => {
    const list = [
      ...PHASES.map((p, i) => ({ label: p.label, ms: phaseDates[i] })),
      ...project.releases.map((r) => ({ label: r.label, ms: new Date(r.date).getTime() })),
      { label: "Hoy", ms: clamp(Date.now(), start, end) },
    ];
    return list.sort((a, b) => a.ms - b.ms);
  }, [phaseDates, project.releases, start, end]);

  function stepTo(direction: -1 | 1) {
    const sorted = events.map((e) => e.ms);
    if (direction === -1) {
      const prev = [...sorted].reverse().find((ms) => ms < scrubMs - DAY_MS / 2);
      setScrubMs(prev ?? start);
    } else {
      const next = sorted.find((ms) => ms > scrubMs + DAY_MS / 2);
      setScrubMs(next ?? end);
    }
  }

  return (
    <div className="font-mono">
      <div className="flex flex-wrap items-start justify-between gap-3 text-[11px]">
        <div>
          <div className="uppercase tracking-[0.14em] text-white/45">Inicio</div>
          <div className="mt-0.5 text-[13px] font-semibold text-white">{formatDate(start)}</div>
        </div>

        <div className="flex flex-col items-center">
          <div
            className={`flex items-center gap-1.5 uppercase tracking-[0.14em] ${
              isToday ? "text-[var(--bp-cyan)]" : isPast ? "text-white/55" : "text-[var(--bp-lime)]"
            }`}
          >
            {isToday && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--bp-cyan)] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--bp-cyan)]" />
              </span>
            )}
            {isToday ? "Hoy" : isPast ? "Historial" : "Proyección"}
          </div>
          <div className="mt-0.5 text-[13px] font-semibold text-white">{formatDate(scrubMs)}</div>
          <div className="mt-0.5 text-[10px] text-white/45">
            día {clamp(scrubDay, 0, totalDays)}/{totalDays} · {Math.round(scrubPct * 100)}% ·{" "}
            {activePhase.label}
          </div>
        </div>

        <div className="text-right">
          <div className="uppercase tracking-[0.14em] text-white/45">Fin</div>
          <div className="mt-0.5 text-[13px] font-semibold text-white">{formatDate(end)}</div>
        </div>
      </div>

      <div className="relative mt-7 h-2">
        <div className="absolute -top-1.5 left-0 right-0 flex justify-between px-px">
          {TICKS.map((t) => (
            <span key={t} className="h-1 w-px bg-white/15" />
          ))}
        </div>

        <div className="relative h-full rounded-[var(--bp-radius-pill)] bg-white/10">
          <div
            className="absolute inset-y-0 left-0 overflow-hidden rounded-[var(--bp-radius-pill)] bg-gradient-to-r from-[var(--bp-blue)] to-[var(--bp-cyan)]"
            style={{ width: `${realTodayPct * 100}%` }}
          >
            <span className="absolute inset-y-0 left-0 w-1/3 animate-[bp-shimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>

          {/* release / epic markers */}
          {project.releases.map((r) => {
            const pct = clamp((new Date(r.date).getTime() - start) / span, 0, 1);
            return (
              <div
                key={r.label}
                className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pct * 100}%` }}
              >
                <span
                  className={`block h-2.5 w-2.5 rotate-45 border ${
                    r.type === "release"
                      ? "border-[var(--bp-lime)] bg-[var(--bp-lime)]/70"
                      : "border-white/70 bg-transparent"
                  }`}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[var(--bp-radius-sm)] bg-black/85 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {r.type === "release" ? "Release" : "Epic"} · {r.label}
                </span>
              </div>
            );
          })}

          {/* in-progress actionable markers */}
          {project.actionables
            .filter((a) => !a.done)
            .map((a) => {
              const pct = clamp((new Date(a.due).getTime() - start) / span, 0, 1);
              return (
                <div
                  key={a.title}
                  className="group absolute top-full -translate-x-1/2"
                  style={{ left: `${pct * 100}%`, marginTop: 6 }}
                >
                  <span className="block h-1.5 w-1.5 rounded-full bg-[var(--bp-magenta)]" />
                  <span className="pointer-events-none absolute top-full left-1/2 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-[var(--bp-radius-sm)] bg-black/85 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    En progreso · {a.title}
                  </span>
                </div>
              );
            })}

          {/* fixed real-today pin */}
          <div
            className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-[calc(100%+7px)]"
            style={{ left: `${realTodayPct * 100}%` }}
            aria-hidden
          >
            <span className="absolute -inset-1.5 animate-ping rounded-full bg-[var(--bp-cyan)]/40" />
            <svg viewBox="0 0 16 20" className="relative h-5 w-4 drop-shadow-[0_0_6px_rgba(0,193,211,0.7)]">
              <path
                d="M8 19S1 11.6 1 7.5A7 7 0 0 1 15 7.5C15 11.6 8 19 8 19Z"
                fill="var(--bp-cyan)"
                stroke="white"
                strokeWidth="1"
              />
              <circle cx="8" cy="7.3" r="2.4" fill="white" />
            </svg>
          </div>

          {/* QA phase dots */}
          {PHASES.map((phase, i) => (
            <div
              key={phase.key}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${phase.pct * 100}%` }}
            >
              <span
                className={`block h-3 w-3 rounded-full border-2 transition-all duration-[var(--bp-dur)] ${
                  i === activePhaseIndex
                    ? "scale-125 border-white bg-[var(--bp-blue)] shadow-[0_0_0_4px_rgba(22,161,205,0.35)]"
                    : i < activePhaseIndex
                      ? "border-white/70 bg-[var(--bp-navy)]"
                      : "border-white/35 bg-transparent"
                }`}
              />
            </div>
          ))}

          {/* scrub handle (native range input, transparently overlaid) */}
          <input
            type="range"
            min={start}
            max={end}
            step={DAY_MS}
            value={scrubMs}
            onChange={(e) => setScrubMs(Number(e.target.value))}
            aria-label="Explorar la línea del tiempo"
            className="bp-scrub absolute inset-x-0 -top-2 h-6 w-full cursor-pointer appearance-none bg-transparent"
          />
        </div>
      </div>

      <div className="mt-2.5 flex justify-between text-[10px] text-white/45">
        {PHASES.map((phase, i) => (
          <span key={phase.key} className={i === activePhaseIndex ? "font-semibold text-white" : ""}>
            {phase.label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3 text-[11px]">
        <button
          type="button"
          onClick={() => stepTo(-1)}
          className="rounded-[var(--bp-radius-sm)] border border-white/15 px-2.5 py-1 text-white/70 transition-colors hover:border-white/35 hover:text-white"
        >
          ← Anterior evento
        </button>
        {!isToday && (
          <button
            type="button"
            onClick={() => setScrubMs(now)}
            className="rounded-[var(--bp-radius-sm)] bg-[var(--bp-cyan)]/15 px-2.5 py-1 text-[var(--bp-cyan)] transition-colors hover:bg-[var(--bp-cyan)]/25"
          >
            Volver a hoy
          </button>
        )}
        <button
          type="button"
          onClick={() => stepTo(1)}
          className="rounded-[var(--bp-radius-sm)] border border-white/15 px-2.5 py-1 text-white/70 transition-colors hover:border-white/35 hover:text-white"
        >
          Siguiente evento →
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-white/40">
        <Legend swatch={<span className="h-2.5 w-2.5 rounded-full bg-[var(--bp-blue)]" />} label="Fase QA activa" />
        <Legend
          swatch={<span className="h-2.5 w-2.5 rotate-45 border border-[var(--bp-lime)] bg-[var(--bp-lime)]/70" />}
          label="Release"
        />
        <Legend swatch={<span className="h-2.5 w-2.5 rotate-45 border border-white/70" />} label="Epic" />
        <Legend swatch={<span className="h-1.5 w-1.5 rounded-full bg-[var(--bp-magenta)]" />} label="Accionable en progreso" />
      </div>

      <div key={activePhaseIndex} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="animate-[bp-fade-in_240ms_ease] rounded-[var(--bp-radius-md)] border border-white/15 bg-white/5 p-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-sans text-[13px] font-semibold text-white">{activePhase.label}</h3>
            <span className="text-[11px] text-white/55">{formatDate(phaseDates[activePhaseIndex])}</span>
          </div>
          <p className="mt-1 font-sans text-[13px] text-white/70">{activePhase.description}</p>
        </div>

        <div className="animate-[bp-fade-in_240ms_ease] rounded-[var(--bp-radius-md)] border border-white/15 bg-white/5 p-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-sans text-[13px] font-semibold text-white">Reporte más cercano</h3>
            <span className="text-[11px] text-white/55">{formatDate(new Date(nearestReport.date).getTime())}</span>
          </div>
          <p className="mt-1 font-sans text-[13px] text-white/70">{nearestReport.note}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/55">
            <span>Aprob. {nearestReport.passRate}%</span>
            <span>Cob. {nearestReport.coverage}%</span>
            <span>Bugs {nearestReport.bugsOpen}</span>
          </div>
        </div>

        <div className="animate-[bp-fade-in_240ms_ease] rounded-[var(--bp-radius-md)] border border-white/15 bg-white/5 p-3.5">
          <h3 className="font-sans text-[13px] font-semibold text-white">Accionables cercanos</h3>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {nearbyActionables.map((a) => (
              <li key={a.title} className="font-sans text-[12px] text-white/70">
                <span className={a.done ? "text-white/40 line-through" : ""}>{a.title}</span>
                <span className="ml-1 text-white/40">· {formatDate(new Date(a.due).getTime())}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatch}
      {label}
    </span>
  );
}

export default ProjectTimeline;
