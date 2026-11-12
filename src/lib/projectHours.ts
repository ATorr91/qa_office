// Pure: turns the hours logged in Jira and the hours typed by hand into the numbers the dashboard shows. For one person, project and
// week, Jira wins when it has hours; the manual entry only fills the weeks Jira has nothing for, so logging time in Jira later never
// double counts what was typed before.
import type { JiraHoursResult } from "./jiraHoursTypes";
import { capacityOf } from "./projectProcessValidation";
import type { DashboardSettings, ProjectProcessData } from "./projectProcessTypes";

const DAY = 86_400_000;

export function todayInMexico(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
}

/** Monday of the week a "YYYY-MM-DD" day falls in. */
export function mondayOf(day: string): string {
  const t = Date.parse(`${day}T00:00:00Z`);
  return new Date(t - ((new Date(t).getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10);
}

/** The last `n` weeks' Mondays, oldest first, ending with the week of `today`. */
export function lastWeeks(today: string, n: number): string[] {
  const current = mondayOf(today);
  return Array.from({ length: n }, (_, i) => addDays(current, -7 * (n - 1 - i)));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

export interface HoursModel {
  /** Hours on each catalog project, everybody who logged time included. */
  projectTotal: Record<string, number>;
  /** Hours of each strategist per week (Monday), over every project, catalog or not. */
  strategistWeek: Record<string, Record<string, number>>;
  /** Hours of each strategist on each project, all time. */
  strategistProject: Record<string, Record<string, number>>;
  /** True when any hour, from Jira or typed by hand, exists. */
  anyHours: boolean;
  /** True when Jira itself has logged time since the dashboard started reading it. */
  jiraHasHours: boolean;
}

export function buildHours(jira: JiraHoursResult | null, projects: Record<string, ProjectProcessData>): HoursModel {
  const model: HoursModel = { projectTotal: {}, strategistWeek: {}, strategistProject: {}, anyHours: false, jiraHasHours: (jira?.rows.length ?? 0) > 0 };
  const jiraKeys = new Set<string>();
  const add = (strategistId: string | null, projectId: string | null, week: string, hours: number) => {
    if (!(hours > 0)) return;
    model.anyHours = true;
    if (projectId) model.projectTotal[projectId] = (model.projectTotal[projectId] ?? 0) + hours;
    if (strategistId) {
      const weeks = (model.strategistWeek[strategistId] ??= {});
      weeks[week] = (weeks[week] ?? 0) + hours;
      if (projectId) {
        const byProject = (model.strategistProject[strategistId] ??= {});
        byProject[projectId] = (byProject[projectId] ?? 0) + hours;
      }
    }
  };

  for (const row of jira?.rows ?? []) {
    if (row.strategistId && row.projectId) jiraKeys.add(`${row.week}|${row.projectId}|${row.strategistId}`);
    add(row.strategistId, row.projectId, row.week, row.hours);
  }
  for (const [projectId, data] of Object.entries(projects)) {
    for (const [week, byPerson] of Object.entries(data.manualHours)) {
      for (const [strategistId, hours] of Object.entries(byPerson)) {
        if (!jiraKeys.has(`${week}|${projectId}|${strategistId}`)) add(strategistId, projectId, week, hours);
      }
    }
  }
  return model;
}

export interface Occupancy {
  capacity: number;
  /** Average hours per week over the last complete weeks. */
  avgHours: number | null;
  /** Hours in the current (partial) week. */
  thisWeek: number;
  /** Average hours ÷ capacity, 0-100+ (null when the person has no hours at all). */
  pct: number | null;
  /** Hours per week planned for the person across the projects they are allocated to. */
  planned: number;
  plannedPct: number | null;
}

/** How busy a person is: what they logged against their weekly capacity, and what is planned for them. */
export function occupancyOf(
  strategistId: string,
  hours: HoursModel,
  settings: DashboardSettings,
  projects: Record<string, ProjectProcessData>,
  activeProjectIds: ReadonlySet<string>,
  today: string,
  weeks = 4,
): Occupancy {
  const capacity = capacityOf(settings, strategistId);
  const current = mondayOf(today);
  const done = lastWeeks(today, weeks + 1).filter((w) => w !== current);
  const byWeek = hours.strategistWeek[strategistId] ?? {};
  const total = done.reduce((n, w) => n + (byWeek[w] ?? 0), 0);
  const hasAny = Object.keys(byWeek).length > 0;
  const rawAvg = hasAny ? total / done.length : null;
  const avgHours = rawAvg === null ? null : Math.round(rawAvg * 10) / 10;
  const planned = Object.entries(projects).reduce((n, [id, p]) => n + (activeProjectIds.has(id) ? (p.allocations[strategistId] ?? 0) : 0), 0);
  return {
    capacity,
    avgHours,
    thisWeek: Math.round((byWeek[current] ?? 0) * 10) / 10,
    pct: rawAvg === null ? null : Math.round((rawAvg / capacity) * 100),
    planned,
    plannedPct: planned > 0 ? Math.round((planned / capacity) * 100) : null,
  };
}
