// Server-only: hours logged in Jira (worklogs) on the catalog projects' boards, by week, project and person. Never import this
// from a "use client" component. Whatever the team logs shows up here within minutes; people who log nothing show no hours.
import "server-only";

import { jiraFetch, readCreds, verifyCreds, type JiraCreds } from "@/lib/jira";
import type { JiraHourRow, JiraHoursResult } from "@/lib/jiraHoursTypes";
import { PROJECT_CATALOG, projectIdOf, type CatalogProject } from "@/lib/projectCatalog";
import { STRATEGISTS } from "@/lib/strategists";

/** Worklogs older than this are ignored: they predate the projects in the catalog. */
const SINCE = "2025-01-01";
const CACHE_MS = 5 * 60_000;
const CONCURRENCY = 6;

interface Worklog {
  started: string;
  timeSpentSeconds: number;
  author?: { accountId?: string; emailAddress?: string; displayName?: string };
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const STRATEGIST_BY_EMAIL = new Map(STRATEGISTS.map((s) => [s.email.toLowerCase(), s.id]));
const STRATEGIST_BY_NAME = new Map(STRATEGISTS.map((s) => [norm(s.name), s.id]));

function strategistOf(author: Worklog["author"]): string | null {
  if (!author) return null;
  const byEmail = author.emailAddress ? STRATEGIST_BY_EMAIL.get(author.emailAddress.toLowerCase()) : undefined;
  return byEmail ?? (author.displayName ? STRATEGIST_BY_NAME.get(norm(author.displayName)) : undefined) ?? null;
}

/** Monday of the week a "YYYY-MM-DD" day falls in. */
function mondayOf(day: string): string {
  const t = Date.parse(`${day}T00:00:00Z`);
  const offset = (new Date(t).getUTCDay() + 6) % 7;
  return new Date(t - offset * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Several catalog projects can share one Jira key (PMI Colombia's two projects, Standard Metrics' two). A worklog goes to the project
 * whose dates contain its day; if none does, or several do, to the one that started last.
 */
function projectFor(key: string, day: string): CatalogProject | null {
  const candidates = PROJECT_CATALOG.filter((p) => p.jiraKeys.includes(key));
  if (candidates.length === 0) return null;
  const inWindow = candidates.filter((p) => p.start <= day && day <= p.end);
  return (inWindow.length > 0 ? inWindow : candidates).sort((a, b) => b.start.localeCompare(a.start))[0];
}

async function issuesWithWorklogs(creds: JiraCreds, keys: string[]): Promise<{ key: string; project: string }[]> {
  const jql = `project in (${keys.map((k) => `"${k}"`).join(",")}) AND worklogDate >= "${SINCE}"`;
  const out: { key: string; project: string }[] = [];
  let nextPageToken: string | undefined;
  for (;;) {
    const page = (await jiraFetch(creds, "/rest/api/3/search/jql", { jql, fields: ["project"], maxResults: 100, ...(nextPageToken ? { nextPageToken } : {}) })) as {
      issues: { key: string; fields: { project: { key: string } } }[];
      nextPageToken?: string;
      isLast?: boolean;
    };
    out.push(...page.issues.map((i) => ({ key: i.key, project: i.fields.project.key })));
    if (page.isLast || !page.nextPageToken || page.issues.length === 0) return out;
    nextPageToken = page.nextPageToken;
  }
}

async function worklogsOf(creds: JiraCreds, issueKey: string): Promise<Worklog[]> {
  const all: Worklog[] = [];
  for (let startAt = 0; ; ) {
    const page = (await jiraFetch(creds, `/rest/api/3/issue/${issueKey}/worklog?startAt=${startAt}&maxResults=1000`)) as { worklogs: Worklog[]; total: number };
    all.push(...page.worklogs);
    startAt += page.worklogs.length;
    if (page.worklogs.length === 0 || startAt >= page.total) return all;
  }
}

async function inBatches<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) out.push(...(await Promise.all(items.slice(i, i + CONCURRENCY).map(fn))));
  return out;
}

async function ticketsCreated(creds: JiraCreds): Promise<Record<string, number>> {
  const entries = await Promise.all(
    STRATEGISTS.map(async (s) => {
      try {
        const hits = (await jiraFetch(creds, `/rest/api/3/user/search?query=${encodeURIComponent(s.email)}&maxResults=1`)) as { accountId: string }[];
        if (!hits[0]) return [s.id, 0] as const;
        const res = (await jiraFetch(creds, "/rest/api/3/search/approximate-count", { jql: `reporter = "${hits[0].accountId}" AND created >= -30d` })) as { count: number };
        return [s.id, res.count] as const;
      } catch {
        return [s.id, 0] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

async function load(): Promise<JiraHoursResult> {
  const fetchedAt = new Date().toISOString();
  const base = { fetchedAt, since: SINCE, issuesWithWorklogs: 0, lastWorklogDay: null, rows: [], ticketsCreated30d: {} };
  const creds = readCreds();
  if (!creds) return { ...base, configured: false, error: null };
  try {
    await verifyCreds(creds);
    const keys = [...new Set(PROJECT_CATALOG.flatMap((p) => p.jiraKeys))];
    const [issues, created] = await Promise.all([issuesWithWorklogs(creds, keys), ticketsCreated(creds)]);

    const sums = new Map<string, JiraHourRow>();
    let last: string | null = null;
    const logs = await inBatches(issues, async (issue) => ({ issue, worklogs: await worklogsOf(creds, issue.key) }));
    for (const { issue, worklogs } of logs) {
      for (const w of worklogs) {
        const day = w.started.slice(0, 10);
        if (day < SINCE || !(w.timeSpentSeconds > 0)) continue;
        if (last === null || day > last) last = day;
        const project = projectFor(issue.project, day);
        const strategistId = strategistOf(w.author);
        const week = mondayOf(day);
        const projectId = project ? projectIdOf(project) : null;
        const k = `${week}|${projectId}|${issue.project}|${strategistId}`;
        const row = sums.get(k) ?? { week, projectId, projectKey: issue.project, strategistId, hours: 0 };
        row.hours += w.timeSpentSeconds / 3600;
        sums.set(k, row);
      }
    }
    const rows = [...sums.values()].map((r) => ({ ...r, hours: Math.round(r.hours * 10) / 10 })).sort((a, b) => a.week.localeCompare(b.week));
    return { configured: true, error: null, fetchedAt, since: SINCE, issuesWithWorklogs: issues.length, lastWorklogDay: last, rows, ticketsCreated30d: created };
  } catch (err) {
    return { ...base, configured: true, error: err instanceof Error ? err.message : "Error desconocido al leer las horas de Jira." };
  }
}

let cache: { at: number; result: JiraHoursResult } | null = null;
let inflight: Promise<JiraHoursResult> | null = null;

/** Hours logged in Jira, answered from a 5-minute cache and shared between simultaneous requests. */
export async function fetchJiraHours(force = false): Promise<JiraHoursResult> {
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
