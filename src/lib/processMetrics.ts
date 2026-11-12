// Pure: how well each strategist follows the process, read from the projects they are confirmed on. A project nobody has started
// tracking is left out (it neither helps nor hurts), and provisional placements never count.
import { checklistKey, DECIDED_STATUSES, STAGE_ORDER, type ProjectProcessData } from "./projectProcessTypes";
import { confirmedProjectsOwnedBy, projectIdOf } from "./projectCatalog";
import { STAGES } from "./procesoStages";
import type { StageId } from "./procesoTypes";
import type { Employment, Strategist } from "./strategists";

export interface ProcessMetrics {
  /** Projects of the person with any process data entered. */
  trackedProjects: number;
  /** Ticked checklist items ÷ items of the stages the project has reached, 0-100. */
  checklistPct: number | null;
  checklistDone: number;
  checklistTotal: number;
  /** Reports accepted without observations ÷ reports the client has answered, 0-100. */
  firstTimePct: number | null;
  decidedReports: number;
  /** Reports delivered by their due date ÷ reports with a due date that were delivered or are already late, 0-100. */
  onTimePct: number | null;
  datedReports: number;
}

const STAGE_ITEMS = Object.fromEntries(STAGES.map((s) => [s.id, s.checklist.flatMap((g) => g.items)]));

export function hasProcessData(d: ProjectProcessData): boolean {
  return (
    Object.keys(d.checklist).length > 0 ||
    Object.keys(d.reports).length > 0 ||
    d.objectives.length > 0 ||
    d.risks.length > 0 ||
    d.contract !== null ||
    d.stage !== "discovery"
  );
}

const pct = (n: number, whole: number) => (whole > 0 ? Math.round((n / whole) * 100) : null);

/** Ticked and total checklist items of one stage. */
export function stageChecklist(data: ProjectProcessData, stage: StageId): { done: number; total: number } {
  const items = STAGE_ITEMS[stage];
  return { done: items.filter((item) => data.checklist[checklistKey(stage, item)]).length, total: items.length };
}

/** Checklist progress over the stages the project has reached (the current one and every earlier one). */
export function checklistProgress(data: ProjectProcessData): { done: number; total: number } {
  return STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(data.stage) + 1).reduce(
    (acc, stage) => {
      const c = stageChecklist(data, stage);
      return { done: acc.done + c.done, total: acc.total + c.total };
    },
    { done: 0, total: 0 },
  );
}

export function processMetricsFor(strategistId: string, projects: Record<string, ProjectProcessData>, today: string): ProcessMetrics {
  let tracked = 0;
  let done = 0;
  let total = 0;
  let accepted = 0;
  let decided = 0;
  let onTime = 0;
  let dated = 0;

  for (const project of confirmedProjectsOwnedBy(strategistId)) {
    const data = projects[projectIdOf(project)];
    if (!data || !hasProcessData(data)) continue;
    tracked += 1;
    const reached = STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(data.stage) + 1);
    for (const stage of reached) {
      for (const item of STAGE_ITEMS[stage]) {
        total += 1;
        if (data.checklist[checklistKey(stage, item)]) done += 1;
      }
    }
    for (const stage of STAGE_ORDER) {
      const r = data.reports[stage];
      if (!r) continue;
      if (DECIDED_STATUSES.includes(r.status)) {
        decided += 1;
        if (r.status === "aceptado") accepted += 1;
      }
      if (r.dueDate) {
        const delivered = r.sentDate ?? r.decisionDate;
        if (delivered) {
          dated += 1;
          if (delivered <= r.dueDate) onTime += 1;
        } else if (r.dueDate < today) dated += 1;
      }
    }
  }
  return { trackedProjects: tracked, checklistPct: pct(done, total), checklistDone: done, checklistTotal: total, firstTimePct: pct(accepted, decided), decidedReports: decided, onTimePct: pct(onTime, dated), datedReports: dated };
}

export interface GroupMetrics {
  employment: Employment;
  people: number;
  checklistPct: number | null;
  firstTimePct: number | null;
  onTimePct: number | null;
}

/** Group averages: the mean of the people who have a value (people without data don't pull it down). */
export function groupMetrics(strategists: Strategist[], metrics: Record<string, ProcessMetrics>): GroupMetrics[] {
  const avg = (values: (number | null)[]) => {
    const v = values.filter((x): x is number => x !== null);
    return v.length === 0 ? null : Math.round(v.reduce((a, b) => a + b, 0) / v.length);
  };
  return (["nomina", "proveedor"] as const).map((employment) => {
    const people = strategists.filter((s) => s.employment === employment);
    const m = people.map((s) => metrics[s.id]);
    return { employment, people: people.length, checklistPct: avg(m.map((x) => x?.checklistPct ?? null)), firstTimePct: avg(m.map((x) => x?.firstTimePct ?? null)), onTimePct: avg(m.map((x) => x?.onTimePct ?? null)) };
  });
}
