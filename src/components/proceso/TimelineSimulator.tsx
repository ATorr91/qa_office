"use client";

import Link from "next/link";
import ExportMenu, { type PdfJob } from "@/components/proceso/ExportMenu";
import { STAGE_STYLE } from "@/components/proceso/procesoUi";
import { stageHref } from "@/components/site/siteNav";
import { timelineMarkdown } from "@/lib/procesoMarkdown";
import { STAGES } from "@/lib/procesoStages";
import { clampWeeks, dayWithYear, MAX_STAGE_WEEKS, shortDay, weekOfDate, type Schedule } from "@/lib/procesoSimulator";
import type { StageId } from "@/lib/procesoTypes";
import { addDays } from "@/lib/projectHours";

const field = "w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2 py-1.5 text-[13px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]";

export interface TimelineSimulatorProps {
  schedule: Schedule;
  start: string;
  onStart: (iso: string) => void;
  weeks: Record<StageId, number>;
  onWeeks: (id: StageId, weeks: number) => void;
  simWeek: number;
  onSimWeek: (week: number) => void;
  onReset: () => void;
  today: string;
  onPdf: (job: PdfJob) => void;
}

export function TimelineSimulator({ schedule, start, onStart, weeks, onWeeks, simWeek, onSimWeek, onReset, today, onPdf }: TimelineSimulatorProps) {
  const total = schedule.totalWeeks;
  const weekStart = addDays(schedule.start, (simWeek - 1) * 7);
  const todayWeek = weekOfDate(schedule, today);
  const labelAlign = simWeek <= 2 ? "left-0" : simWeek >= total - 1 ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <section id="linea-de-tiempo" aria-labelledby="sim-title" className="scroll-mt-24 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-5 shadow-[var(--bp-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="sim-title" className="text-xl font-bold text-[var(--bp-ink)]">
            Línea de tiempo
          </h2>
          <p className="mt-1 max-w-[65ch] text-[13px] leading-relaxed text-[var(--bp-ink-soft)]">
            Cada etapa abre su propio sitio. Las semanas son un ejemplo editable; las reales salen del contrato.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportMenu subject="la línea de tiempo" filename="proceso-estrategas-linea-de-tiempo" getMarkdown={() => timelineMarkdown(schedule)} onPdf={onPdf} />
          <button type="button" onClick={onReset} className="bp-tap rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--bp-ink)] transition-colors hover:border-[var(--bp-blue)]">
            Volver al ejemplo
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <label className="col-span-2 flex flex-col gap-1 text-[12px] font-medium text-[var(--bp-ink)] sm:col-span-1">
          Inicio del proyecto
          <input type="date" value={start} onChange={(e) => e.target.value && onStart(e.target.value)} className={field} />
        </label>
        {STAGES.map((s) => (
          <label key={s.id} className="flex flex-col gap-1 text-[12px] font-medium text-[var(--bp-ink)]">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_STYLE[s.id].color }} />
              {s.name} (semanas)
            </span>
            <input type="number" inputMode="numeric" min={1} max={MAX_STAGE_WEEKS} value={weeks[s.id]} onChange={(e) => onWeeks(s.id, clampWeeks(Number(e.target.value)))} className={field} />
          </label>
        ))}
      </div>

      <div className="mt-7">
        <div className="relative pt-7">
          <div
            role="img"
            aria-label={`Línea de tiempo de ${total} semanas: ${schedule.stages.map((s) => `${STAGES.find((x) => x.id === s.id)!.name} ${s.weeks} semanas`).join(", ")}. Semana simulada ${simWeek}.`}
            className="bp-stagger relative flex h-11 overflow-hidden rounded-[var(--bp-radius-md)]"
          >
            {schedule.stages.map((s) => {
              const meta = STAGES.find((x) => x.id === s.id)!;
              const style = STAGE_STYLE[s.id];
              return (
                <Link key={s.id} href={stageHref(s.id)} data-tip={`${meta.name}: ${s.weeks} ${s.weeks === 1 ? "semana" : "semanas"}, ${shortDay(s.start)} a ${shortDay(s.end)}. Abrir la etapa`} className="flex min-w-0 items-center justify-center border-r-2 border-[var(--bp-surface)] px-1 text-[12px] font-bold last:border-r-0 transition-[filter] duration-[var(--bp-dur-fast)] hover:brightness-95" style={{ flexGrow: s.weeks, flexBasis: 0, backgroundColor: style.color, color: style.on }}>
                  <span className="truncate">{meta.name}</span>
                </Link>
              );
            })}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 top-7 rounded-[var(--bp-radius-md)] border-2 border-[var(--bp-ink)] transition-[left] duration-[var(--bp-dur)] motion-reduce:transition-none"
            style={{ left: `${((simWeek - 1) / total) * 100}%`, width: `${100 / total}%`, minWidth: 6 }}
          >
            <span className={`absolute -top-7 whitespace-nowrap rounded-[var(--bp-radius-sm)] bg-[var(--bp-ink)] px-2 py-0.5 text-[11px] font-semibold text-white ${labelAlign}`}>Semana {simWeek}</span>
          </div>
          {todayWeek !== null && (
            <div aria-hidden className="pointer-events-none absolute -bottom-5 text-center text-[10px] font-semibold text-[var(--bp-ink)]" style={{ left: `${((todayWeek - 0.5) / total) * 100}%`, transform: "translateX(-50%)" }}>
              ▲ Hoy
            </div>
          )}
        </div>

        <div aria-hidden className="mt-6 flex text-[11px] tabular-nums text-[var(--bp-ink-soft)]">
          {schedule.stages.map((s) => (
            <div key={s.id} className="min-w-0 truncate" style={{ flexGrow: s.weeks, flexBasis: 0 }}>
              {shortDay(s.start)}
            </div>
          ))}
          <div className="shrink-0 pl-1 text-right">{shortDay(schedule.end)}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex min-w-[240px] flex-1 flex-col gap-1.5 text-[12px] font-medium text-[var(--bp-ink)]">
          <span>
            Semana simulada: <span className="tabular-nums font-bold">{simWeek}</span> de {total}
            <span className="font-normal text-[var(--bp-ink-soft)]"> · semana del {shortDay(weekStart)}</span>
          </span>
          <input type="range" min={1} max={total} step={1} value={simWeek} onChange={(e) => onSimWeek(Number(e.target.value))} className="w-full accent-[var(--bp-blue)]" />
        </label>
        <p className="text-[12px] tabular-nums text-[var(--bp-ink-soft)]">
          <span className="font-semibold text-[var(--bp-ink)]">{total} semanas</span> · del {dayWithYear(schedule.start)} al {dayWithYear(schedule.end)}
        </p>
      </div>
    </section>
  );
}

export default TimelineSimulator;
