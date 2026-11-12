// Pure: turns a start date and the weeks of each stage into a schedule, and says where each stage stands in a given week of the
// simulation. The weeks are an example the team edits; they are not sold weeks (those come from each project's contract).
import { addDays, mondayOf } from "./projectHours";
import type { StageId } from "./procesoTypes";
import { STAGE_ORDER } from "./projectProcessTypes";

export const DEFAULT_WEEKS: Record<StageId, number> = { discovery: 2, build: 6, testing: 2, entrega: 1, futureproof: 8 };

export const MAX_STAGE_WEEKS = 52;

export interface ScheduledStage {
  id: StageId;
  weeks: number;
  /** 1-based week of the simulation in which the stage starts and ends. */
  startWeek: number;
  endWeek: number;
  /** Monday the stage starts, "YYYY-MM-DD". */
  start: string;
  /** Friday of the stage's last week, which is also the suggested due date of its acceptance report. */
  end: string;
}

export interface Schedule {
  stages: ScheduledStage[];
  totalWeeks: number;
  start: string;
  end: string;
}

export function clampWeeks(n: number): number {
  return Number.isFinite(n) ? Math.min(MAX_STAGE_WEEKS, Math.max(1, Math.round(n))) : 1;
}

/** Stages run one after the other, each starting on the Monday after the previous one ends. */
export function buildSchedule(startIso: string, weeks: Record<StageId, number>): Schedule {
  const start = mondayOf(startIso);
  let cursor = 1;
  const stages = STAGE_ORDER.map((id) => {
    const w = clampWeeks(weeks[id]);
    const stage: ScheduledStage = {
      id,
      weeks: w,
      startWeek: cursor,
      endWeek: cursor + w - 1,
      start: addDays(start, (cursor - 1) * 7),
      end: addDays(start, (cursor + w - 1) * 7 - 3),
    };
    cursor += w;
    return stage;
  });
  const totalWeeks = cursor - 1;
  return { stages, totalWeeks, start, end: addDays(start, totalWeeks * 7 - 3) };
}

export type SimState = "completada" | "en_curso" | "pendiente";

export const SIM_STATE_LABEL: Record<SimState, string> = { completada: "Completada", en_curso: "En curso", pendiente: "Pendiente" };

export function stateAt(stage: ScheduledStage, simWeek: number): SimState {
  if (simWeek > stage.endWeek) return "completada";
  if (simWeek >= stage.startWeek) return "en_curso";
  return "pendiente";
}

/** Share of the stage's checklist that should be done by the end of the simulated week, 0-100. */
export function expectedPct(stage: ScheduledStage, simWeek: number): number {
  const state = stateAt(stage, simWeek);
  if (state === "completada") return 100;
  if (state === "pendiente") return 0;
  return Math.round(((simWeek - stage.startWeek + 1) / stage.weeks) * 100);
}

/** The simulation week a real date falls in, or null when it is outside the schedule. */
export function weekOfDate(schedule: Schedule, day: string): number | null {
  const diff = Math.floor((Date.parse(`${mondayOf(day)}T00:00:00Z`) - Date.parse(`${schedule.start}T00:00:00Z`)) / (7 * 86_400_000)) + 1;
  return diff >= 1 && diff <= schedule.totalWeeks ? diff : null;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function shortDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function dayWithYear(iso: string): string {
  return `${shortDay(iso)} ${iso.slice(0, 4)}`;
}
