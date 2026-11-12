import { STAGE_STYLE } from "@/components/proceso/procesoUi";
import { STAGES } from "@/lib/procesoStages";
import { shortDay } from "@/lib/procesoSimulator";
import { daysBetween } from "@/lib/projectHours";
import { DECIDED_STATUSES, STAGE_ORDER, type ProjectProcessData } from "@/lib/projectProcessTypes";
import type { StageId } from "@/lib/procesoTypes";

export type StageTrackState = "aceptada" | "no_aceptada" | "actual" | "vencida" | "pendiente";

export interface StageTrackItem {
  id: StageId;
  name: string;
  state: StageTrackState;
  note: string;
}

/** Where each stage of a project stands, read from its acceptance reports and its current stage. */
export function stageTrack(data: ProjectProcessData, today: string): StageTrackItem[] {
  const currentIndex = STAGE_ORDER.indexOf(data.stage);
  return STAGE_ORDER.map((id, i) => {
    const name = STAGES.find((s) => s.id === id)!.name;
    const r = data.reports[id];
    const due = r?.dueDate ?? null;
    if (r && r.status === "no_aceptado") return { id, name, state: "no_aceptada", note: "No aceptada" };
    if (r && DECIDED_STATUSES.includes(r.status)) return { id, name, state: "aceptada", note: r.decisionDate ? `Aceptada el ${shortDay(r.decisionDate)}` : "Aceptada" };
    if (due && due < today) {
      const late = daysBetween(due, today);
      return { id, name, state: "vencida", note: `Venció hace ${late} ${late === 1 ? "día" : "días"}` };
    }
    if (i === currentIndex) return { id, name, state: "actual", note: due ? `Entrega el ${shortDay(due)}` : "En curso" };
    return { id, name, state: "pendiente", note: due ? `Entrega el ${shortDay(due)}` : i < currentIndex ? "Sin reporte registrado" : "Pendiente" };
  });
}

function Check({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
      <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The five stages of one project as a horizontal timeline. */
export function StageTrack({ data, today }: { data: ProjectProcessData; today: string }) {
  const items = stageTrack(data, today);
  return (
    <ol className="grid grid-cols-5 gap-0" aria-label="Etapas del proyecto">
      {items.map((item, i) => {
        const { color, on } = STAGE_STYLE[item.id];
        const filled = item.state === "aceptada";
        const bad = item.state === "no_aceptada" || item.state === "vencida";
        return (
          <li key={item.id} className="relative flex flex-col items-center px-1 text-center">
            {i > 0 && <span aria-hidden className="absolute right-1/2 top-[11px] h-0.5 w-full" style={{ backgroundColor: items[i - 1].state === "aceptada" ? STAGE_STYLE[items[i - 1].id].color : "var(--bp-border)" }} />}
            <span
              className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold"
              style={
                filled
                  ? { backgroundColor: color, borderColor: color, color: on }
                  : bad
                    ? { backgroundColor: "var(--bp-surface)", borderColor: "var(--bp-danger)", color: "var(--bp-danger)" }
                    : item.state === "actual"
                      ? { backgroundColor: "var(--bp-surface)", borderColor: color, color: "var(--bp-ink)", boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 24%, transparent)` }
                      : { backgroundColor: "var(--bp-surface)", borderColor: "var(--bp-border)", color: "var(--bp-ink-soft)" }
              }
            >
              {filled ? <Check color={on} /> : i + 1}
            </span>
            <span className="mt-1.5 text-[12px] font-semibold text-[var(--bp-ink)]">{item.name}</span>
            <span className={`text-[11px] leading-tight ${bad ? "font-semibold text-[var(--bp-danger)]" : "text-[var(--bp-ink-soft)]"}`}>{item.note}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Five small segments for a table row: accepted stages filled, the current one outlined. */
export function MiniStageBar({ data, today, tracked }: { data: ProjectProcessData; today: string; tracked: boolean }) {
  const items = stageTrack(data, today);
  const current = items.find((i) => i.state === "actual" || i.state === "vencida") ?? items[0];
  return (
    <div data-tip={tracked ? `Etapa actual: ${STAGES.find((s) => s.id === data.stage)!.name}` : "Proceso sin capturar"}>
      <div className="flex gap-0.5" aria-hidden>
        {items.map((item) => {
          const { color } = STAGE_STYLE[item.id];
          const filled = tracked && item.state === "aceptada";
          const here = tracked && item.id === current.id;
          return <span key={item.id} className="h-1.5 w-4 rounded-full" style={{ backgroundColor: filled ? color : here ? `color-mix(in srgb, ${color} 45%, white)` : "var(--bp-border)", outline: here ? `1.5px solid ${color}` : undefined, outlineOffset: 0 }} />;
        })}
      </div>
      <span className="mt-1 block text-[12px] font-medium text-[var(--bp-ink)]">{tracked ? STAGES.find((s) => s.id === data.stage)!.name : "Sin capturar"}</span>
    </div>
  );
}
