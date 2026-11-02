// Server-only: progress of the sprint that is running today on each active project's Jira board.
// Only the current sprint's own work is counted (never the project's accumulated history), and it is compared with how much of the
// sprint's working days have gone by, so "al día" means done share ≥ calendar share. Never import this from a "use client" component.
import "server-only";

import { jiraFetch, readCreds, todayInMexico, verifyCreds, type JiraCreds } from "@/lib/jira";
import type {
  SprintBoardResult,
  SprintBucket,
  SprintEpicProgress,
  SprintPace,
  SprintProgressResult,
  SprintProjectWindow,
  SprintSnapshot,
} from "@/lib/jiraSprintTypes";
import { activeJiraTargets } from "@/lib/projectCatalog";

const CACHE_MS = 30_000;
/** Gap (in points) below the calendar that still counts as on pace / late; beyond it the sprint is at risk. */
const ON_PACE_TOLERANCE = 10;
const LATE_TOLERANCE = 30;

interface AgileBoard {
  id: number;
  name: string;
  type: string;
  location?: { projectKey?: string };
}
interface AgileSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
}
interface AgileIssue {
  fields: {
    status: { statusCategory: { key: string } };
    issuetype: { name: string; subtask: boolean };
    parent?: { key: string; fields?: { summary?: string; issuetype?: { name: string; hierarchyLevel?: number } } };
  };
}

const dayMs = 86_400_000;
const toDay = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
const mexicoDay = (instant: string) => new Date(instant).toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Mon-Fri days in [fromDay, toDay): the sprint's clock. Weekends don't move the expected progress. */
function workingDays(fromMs: number, toMs: number): number {
  let n = 0;
  for (let t = fromMs; t < toMs; t += dayMs) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) n += 1;
  }
  return n;
}

function emptyBucket(): SprintBucket {
  return { total: 0, done: 0, inProgress: 0, todo: 0 };
}

function add(bucket: SprintBucket, category: string) {
  bucket.total += 1;
  if (category === "done") bucket.done += 1;
  else if (category === "indeterminate") bucket.inProgress += 1;
  else bucket.todo += 1;
}

function paceOf(total: number, gap: number): SprintPace {
  if (total === 0) return "sin_trabajo";
  if (gap >= -ON_PACE_TOLERANCE) return "al_dia";
  if (gap >= -LATE_TOLERANCE) return "atrasado";
  return "en_riesgo";
}

function projectWindow(p: { code: string; name: string; start: string; end: string }, today: string): SprintProjectWindow {
  const start = toDay(p.start);
  const end = toDay(p.end);
  const now = toDay(today);
  const span = Math.max(1, end - start);
  return {
    code: p.code,
    name: p.name,
    startDate: p.start,
    endDate: p.end,
    elapsedPct: clampPct(((now - start) / span) * 100),
    daysLeft: Math.max(0, Math.round((end - now) / dayMs)),
  };
}

async function fetchSprintIssues(creds: JiraCreds, sprintId: number): Promise<AgileIssue[]> {
  const issues: AgileIssue[] = [];
  for (let startAt = 0; ; ) {
    const page = (await jiraFetch(
      creds,
      `/rest/agile/1.0/sprint/${sprintId}/issue?startAt=${startAt}&maxResults=100&fields=status,issuetype,parent`,
    )) as { issues: AgileIssue[]; total: number };
    issues.push(...page.issues);
    startAt += page.issues.length;
    if (page.issues.length === 0 || startAt >= page.total) return issues;
  }
}

function snapshotOf(sprint: AgileSprint, issues: AgileIssue[], today: string): SprintSnapshot {
  const startDate = mexicoDay(sprint.startDate!);
  const endDate = mexicoDay(sprint.endDate!);
  const start = toDay(startDate);
  const end = toDay(endDate);
  const now = toDay(today);

  const totals = emptyBucket();
  const epics = new Map<string, SprintEpicProgress>();
  for (const issue of issues) {
    // Sub-tasks roll up into their parent ticket, and an epic in the sprint is a container, not work: counting either would double-count.
    if (issue.fields.issuetype.subtask || issue.fields.issuetype.name === "Epic") continue;
    const category = issue.fields.status.statusCategory.key;
    add(totals, category);
    const parent = issue.fields.parent;
    const isEpic = !!parent && (parent.fields?.issuetype?.name === "Epic" || parent.fields?.issuetype?.hierarchyLevel === 1);
    const epicKey = isEpic ? parent.key : "";
    const epic = epics.get(epicKey) ?? { ...emptyBucket(), key: isEpic ? parent.key : null, name: isEpic ? (parent.fields?.summary ?? parent.key) : "Sin épica" };
    add(epic, category);
    epics.set(epicKey, epic);
  }

  const totalDays = workingDays(start, end);
  const elapsedDays = workingDays(start, Math.min(now, end));
  const expectedPct = totalDays > 0 ? clampPct((elapsedDays / totalDays) * 100) : clampPct(((now - start) / Math.max(1, end - start)) * 100);
  const donePct = totals.total > 0 ? clampPct((totals.done / totals.total) * 100) : 0;
  const gapPct = donePct - expectedPct;

  return {
    id: sprint.id,
    name: sprint.name,
    startDate,
    endDate,
    ...totals,
    donePct,
    expectedPct,
    gapPct,
    pace: paceOf(totals.total, gapPct),
    workingDaysLeft: Math.max(0, totalDays - elapsedDays),
    epics: [...epics.values()].sort((a, b) => (a.key === null ? 1 : 0) - (b.key === null ? 1 : 0) || b.total - a.total),
  };
}

async function loadBoard(creds: JiraCreds, target: ReturnType<typeof activeJiraTargets>[number], today: string): Promise<SprintBoardResult> {
  const { key, projects, owners } = target;
  const base: SprintBoardResult = {
    key,
    boardName: null,
    boardUrl: null,
    projects: projects.map((p) => projectWindow(p, today)),
    owners,
    sprint: null,
    note: null,
  };

  try {
    const boards = ((await jiraFetch(creds, `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(key)}&maxResults=50`)) as { values: AgileBoard[] }).values;
    // A board can list a project only because its filter reaches into it; the project's own boards come first.
    const own = boards.filter((b) => b.location?.projectKey === key);
    const scrum = (own.length > 0 ? own : boards).filter((b) => b.type === "scrum");
    if (boards.length === 0) return { ...base, note: "El proyecto no tiene tablero en Jira." };
    if (scrum.length === 0) return { ...base, boardName: boards[0].name, boardUrl: `${creds.baseUrl}/jira/software/projects/${key}/boards/${boards[0].id}`, note: "Su tablero es Kanban: no trabaja con sprints." };

    const active: { board: AgileBoard; sprint: AgileSprint }[] = [];
    await Promise.all(
      scrum.map(async (board) => {
        const res = (await jiraFetch(creds, `/rest/agile/1.0/board/${board.id}/sprint?state=active&maxResults=20`)) as { values: AgileSprint[] };
        for (const sprint of res.values) if (sprint.startDate && sprint.endDate) active.push({ board, sprint });
      }),
    );

    const first = scrum[0];
    const withBoard = { ...base, boardName: first.name, boardUrl: `${creds.baseUrl}/jira/software/projects/${key}/boards/${first.id}` };
    if (active.length === 0) return { ...withBoard, note: "No hay un sprint activo en este momento." };

    // Jira keeps a sprint "active" until someone closes it: one that ended before today is stale, not current.
    const current = active.filter((a) => mexicoDay(a.sprint.endDate!) >= today).sort((a, b) => b.sprint.startDate!.localeCompare(a.sprint.startDate!));
    if (current.length === 0) {
      const stale = active[0].sprint;
      return { ...withBoard, note: `«${stale.name}» sigue abierto en Jira pero terminó el ${mexicoDay(stale.endDate!)}: hay que cerrarlo para ver el avance del siguiente.` };
    }

    const { board, sprint } = current[0];
    const issues = await fetchSprintIssues(creds, sprint.id);
    return {
      ...base,
      boardName: board.name,
      boardUrl: `${creds.baseUrl}/jira/software/projects/${key}/boards/${board.id}`,
      sprint: snapshotOf(sprint, issues, today),
    };
  } catch (err) {
    return { ...base, note: err instanceof Error ? err.message : "Error desconocido al leer el tablero." };
  }
}

let cache: { at: number; result: SprintProgressResult } | null = null;
let inflight: Promise<SprintProgressResult> | null = null;

async function load(): Promise<SprintProgressResult> {
  const fetchedAt = new Date().toISOString();
  const creds = readCreds();
  if (!creds) return { configured: false, error: null, fetchedAt, boards: [] };
  try {
    await verifyCreds(creds);
    const today = todayInMexico();
    const boards = await Promise.all(activeJiraTargets().map((t) => loadBoard(creds, t, today)));
    return { configured: true, error: null, fetchedAt, boards };
  } catch (err) {
    return { configured: true, error: err instanceof Error ? err.message : "Error desconocido al conectar con Jira.", fetchedAt, boards: [] };
  }
}

/**
 * Sprint progress for every active project, read live from Jira. Answers within the last 30 s are reused, and simultaneous
 * requests share one trip to Jira, so several open dashboards polling don't multiply the calls.
 */
export async function fetchSprintProgress(force = false): Promise<SprintProgressResult> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.result;
  inflight ??= load()
    .then((result) => {
      if (!result.error) cache = { at: Date.now(), result };
      return result;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
