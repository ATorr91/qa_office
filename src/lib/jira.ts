// Server-only Jira Cloud REST API client. Never import this from a "use client" component —
// it reads JIRA_API_TOKEN from the environment and must not reach the browser bundle.
import "server-only";

import { monthFromDate, type MonthKey } from "@/lib/strategists";

export interface MonthDeadlineCount {
  assigned: number;
  onTime: number;
}

export type DeadlinesByEmail = Record<string, Record<MonthKey, MonthDeadlineCount>>;

export interface IssueStatusCount {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  /** Not done and already past their due date. */
  overdueOpen: number;
  /** No due date, so they can't count toward deadline compliance. */
  noDueDate: number;
}

/** What one person has in one Jira project: tickets assigned to them by status, and tickets they created (the strategist writes them, developers execute). */
export interface ProjectIssueStats extends IssueStatusCount {
  name: string;
  /** Tickets created by this person in the project, and how many of them are still open. */
  reported: number;
  reportedOpen: number;
}

export type ProjectsByEmail = Record<string, Record<string, ProjectIssueStats>>;

export type IssueStatusByEmail = Record<string, IssueStatusCount>;

export interface JiraDeadlinesResult {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  boardUrl: string | null;
  byEmail: DeadlinesByEmail;
  /** All issues assigned to each strategist on their board, by status — regardless of due date. */
  issueStatusByEmail: IssueStatusByEmail;
  /** The same, split by Jira project key, plus the tickets each person created. */
  projectsByEmail: ProjectsByEmail;
  /** Strategists with no Jira project key configured (no per-person override, no global fallback) — not an error, just not wired up yet. */
  unconfiguredEmails: string[];
}

interface JiraCreds {
  baseUrl: string;
  email: string;
  apiToken: string;
}

/** One strategist's email plus the Jira project key(s) their boards live in — issues across all of them are merged together. */
export interface StrategistBoard {
  email: string;
  projectKeys: string[];
}

function readCreds(): JiraCreds | null {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  if (!baseUrl || !email || !apiToken) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), email, apiToken };
}

function authHeader(creds: JiraCreds): string {
  return `Basic ${Buffer.from(`${creds.email}:${creds.apiToken}`).toString("base64")}`;
}

async function jiraFetch(creds: JiraCreds, path: string, body?: object): Promise<unknown> {
  const res = await fetch(`${creds.baseUrl}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: authHeader(creds),
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const responseBody = await res.text().catch(() => "");
    throw new Error(`Jira respondió ${res.status} ${res.statusText}: ${responseBody.slice(0, 300)}`);
  }
  return res.json();
}

/** Today's date ("YYYY-MM-DD") in the team's timezone, so a server running in UTC doesn't flip days at 6pm local. */
function todayInMexico(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
}

async function verifyCreds(creds: JiraCreds): Promise<void> {
  const res = await fetch(`${creds.baseUrl}/rest/api/3/myself`, {
    headers: { Authorization: authHeader(creds), Accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `Jira rechazó las credenciales (${res.status}). Revisa JIRA_API_TOKEN, JIRA_EMAIL y JIRA_BASE_URL en las variables de entorno; el token puede estar vencido o no corresponder a ese correo.`,
    );
  }
  if (!res.ok) throw new Error(`Jira respondió ${res.status} ${res.statusText} al validar las credenciales.`);
}

interface JiraUserSearchHit {
  accountId: string;
  emailAddress?: string;
}

async function resolveAccountIds(creds: JiraCreds, emails: string[]): Promise<Map<string, string>> {
  const emailByAccountId = new Map<string, string>();
  await Promise.all(
    emails.map(async (email) => {
      const hits = (await jiraFetch(
        creds,
        `/rest/api/3/user/search?query=${encodeURIComponent(email)}&maxResults=1`
      )) as JiraUserSearchHit[];
      const hit = hits[0];
      if (hit) emailByAccountId.set(hit.accountId, email);
    })
  );
  return emailByAccountId;
}

interface JiraIssue {
  fields: {
    project: { key: string; name: string };
    assignee: { accountId: string } | null;
    reporter?: { accountId: string } | null;
    duedate: string | null;
    resolutiondate: string | null;
    status: { statusCategory: { key: string } };
  };
}

interface JiraSearchPage {
  issues: JiraIssue[];
  nextPageToken?: string;
  isLast?: boolean;
}

// Jira Cloud retired GET /rest/api/3/search (and its startAt/total pagination) in favor of
// this token-based POST endpoint. See https://developer.atlassian.com/changelog/#CHANGE-2046.
async function fetchAllIssues(creds: JiraCreds, projectKey: string, accountIds: string[]): Promise<JiraIssue[]> {
  if (accountIds.length === 0) return [];
  const jql = `project = "${projectKey}" AND assignee in (${accountIds.map((id) => `"${id}"`).join(",")}) ORDER BY duedate ASC`;
  const issues: JiraIssue[] = [];
  let nextPageToken: string | undefined;
  for (;;) {
    const page = (await jiraFetch(creds, "/rest/api/3/search/jql", {
      jql,
      fields: ["project", "assignee", "duedate", "resolutiondate", "status"],
      maxResults: 100,
      ...(nextPageToken ? { nextPageToken } : {}),
    })) as JiraSearchPage;
    issues.push(...page.issues);
    if (page.isLast || !page.nextPageToken || page.issues.length === 0) break;
    nextPageToken = page.nextPageToken;
  }
  return issues;
}

/** How many tickets match a JQL, without downloading them (the strategists wrote thousands, so listing them would be slow). */
async function countIssues(creds: JiraCreds, jql: string): Promise<number> {
  const res = (await jiraFetch(creds, "/rest/api/3/search/approximate-count", { jql })) as { count: number };
  return res.count;
}

const emptyStatus = (): IssueStatusCount => ({ total: 0, done: 0, inProgress: 0, todo: 0, overdueOpen: 0, noDueDate: 0 });

/**
 * Fetches deadline compliance per strategist from Jira, bucketed by month. Each strategist can
 * have one or more boards (project keys) — issues from all of a strategist's projects are merged
 * together into their totals. `boards` is regrouped by project key so people who share a project
 * are queried together, and people with no project key configured are skipped (returned in
 * `unconfiguredEmails`, not treated as an error).
 */
export async function fetchJiraDeadlines(boards: StrategistBoard[]): Promise<JiraDeadlinesResult> {
  const fetchedAt = new Date().toISOString();
  const byEmail: DeadlinesByEmail = {};
  const issueStatusByEmail: IssueStatusByEmail = {};
  const projectsByEmail: ProjectsByEmail = {};
  for (const b of boards) {
    byEmail[b.email] = {};
    issueStatusByEmail[b.email] = emptyStatus();
    projectsByEmail[b.email] = {};
  }

  const configuredBoards = boards.filter((b) => b.projectKeys.length > 0);
  const unconfiguredEmails = boards.filter((b) => b.projectKeys.length === 0).map((b) => b.email);

  const creds = readCreds();
  if (!creds) {
    return { configured: false, error: null, fetchedAt, boardUrl: null, byEmail, issueStatusByEmail, projectsByEmail, unconfiguredEmails };
  }
  if (configuredBoards.length === 0) {
    return { configured: true, error: null, fetchedAt, boardUrl: null, byEmail, issueStatusByEmail, projectsByEmail, unconfiguredEmails };
  }

  const boardUrl = `${creds.baseUrl}/jira/software/projects/${configuredBoards[0].projectKeys[0]}/boards`;

  try {
    const todayIso = todayInMexico();

    // Jira answers user/search and search/jql with 200 and an empty list when the token is invalid,
    // so without this check a bad credential would show up as "no issues". /myself does return 401.
    await verifyCreds(creds);

    // Resolve every configured strategist's Jira accountId once, then group by project key so a
    // strategist listed on several projects gets queried (and merged) across all of them.
    const emailByAccountId = await resolveAccountIds(creds, configuredBoards.map((b) => b.email));
    const accountIdByEmail = new Map([...emailByAccountId.entries()].map(([accountId, email]) => [email, accountId]));

    const byProjectKey = new Map<string, string[]>();
    for (const b of configuredBoards) {
      const accountId = accountIdByEmail.get(b.email);
      if (!accountId) continue;
      for (const projectKey of b.projectKeys) {
        byProjectKey.set(projectKey, [...(byProjectKey.get(projectKey) ?? []), accountId]);
      }
    }

    await Promise.all(
      [...byProjectKey.entries()].map(async ([projectKey, accountIds]) => {
        const issues = await fetchAllIssues(creds, projectKey, accountIds);

        // Tickets each person created in the project (a strategist is the product owner who writes them) and how many are still open.
        await Promise.all(
          accountIds.map(async (accountId) => {
            const email = emailByAccountId.get(accountId);
            if (!email) return;
            const base = `project = "${projectKey}" AND reporter = "${accountId}"`;
            const [reported, reportedOpen] = await Promise.all([countIssues(creds, base), countIssues(creds, `${base} AND statusCategory != Done`)]);
            if (reported === 0) return;
            const stats = (projectsByEmail[email][projectKey] ??= { ...emptyStatus(), name: projectKey, reported: 0, reportedOpen: 0 });
            stats.reported = reported;
            stats.reportedOpen = reportedOpen;
          }),
        );

        for (const issue of issues) {
          const accountId = issue.fields.assignee?.accountId;
          if (!accountId) continue;
          const email = emailByAccountId.get(accountId);
          if (!email) continue;

          const statusKey = issue.fields.status.statusCategory.key;
          const dueDate = issue.fields.duedate;
          const overdueOpen = statusKey !== "done" && !!dueDate && dueDate < todayIso;
          const projectStats = (projectsByEmail[email][projectKey] ??= { ...emptyStatus(), name: issue.fields.project.name, reported: 0, reportedOpen: 0 });
          projectStats.name = issue.fields.project.name;
          for (const bucketOf of [issueStatusByEmail[email], projectStats]) {
            bucketOf.total += 1;
            if (statusKey === "done") bucketOf.done += 1;
            else if (statusKey === "indeterminate") bucketOf.inProgress += 1;
            else bucketOf.todo += 1;
            if (overdueOpen) bucketOf.overdueOpen += 1;
            if (!dueDate) bucketOf.noDueDate += 1;
          }

          if (!dueDate) continue;

          const month = monthFromDate(dueDate);
          const bucket = (byEmail[email][month] ??= { assigned: 0, onTime: 0 });

          // Compare calendar days, not timestamps: an issue resolved any time on its due date is on time
          // (a midnight cutoff would mark same-day closes as late). Jira returns resolutiondate in the
          // account's own offset, so its first 10 characters are the day the person actually closed it.
          if (statusKey === "done") {
            const resolvedDay = issue.fields.resolutiondate ? issue.fields.resolutiondate.slice(0, 10) : todayIso;
            bucket.assigned += 1;
            if (resolvedDay <= dueDate) bucket.onTime += 1;
          } else if (dueDate < todayIso) {
            // Deadline already passed and the issue is still open — counts as assigned, missed.
            bucket.assigned += 1;
          }
          // Issues not yet done whose due date hasn't arrived yet are excluded — their
          // outcome can't be judged yet.
        }
      }),
    );

    return { configured: true, error: null, fetchedAt, boardUrl, byEmail, issueStatusByEmail, projectsByEmail, unconfiguredEmails };
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "Error desconocido al conectar con Jira.",
      fetchedAt,
      boardUrl,
      byEmail,
      issueStatusByEmail,
      projectsByEmail,
      unconfiguredEmails,
    };
  }
}
