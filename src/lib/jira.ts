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
}

export type IssueStatusByEmail = Record<string, IssueStatusCount>;

export interface JiraDeadlinesResult {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  boardUrl: string | null;
  byEmail: DeadlinesByEmail;
  /** All issues assigned to each strategist on their board, by status — regardless of due date. */
  issueStatusByEmail: IssueStatusByEmail;
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
    assignee: { accountId: string } | null;
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
      fields: ["assignee", "duedate", "resolutiondate", "status"],
      maxResults: 100,
      ...(nextPageToken ? { nextPageToken } : {}),
    })) as JiraSearchPage;
    issues.push(...page.issues);
    if (page.isLast || !page.nextPageToken || page.issues.length === 0) break;
    nextPageToken = page.nextPageToken;
  }
  return issues;
}

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
  for (const b of boards) {
    byEmail[b.email] = {};
    issueStatusByEmail[b.email] = { total: 0, done: 0, inProgress: 0, todo: 0 };
  }

  const configuredBoards = boards.filter((b) => b.projectKeys.length > 0);
  const unconfiguredEmails = boards.filter((b) => b.projectKeys.length === 0).map((b) => b.email);

  const creds = readCreds();
  if (!creds) {
    return { configured: false, error: null, fetchedAt, boardUrl: null, byEmail, issueStatusByEmail, unconfiguredEmails };
  }
  if (configuredBoards.length === 0) {
    return { configured: true, error: null, fetchedAt, boardUrl: null, byEmail, issueStatusByEmail, unconfiguredEmails };
  }

  const boardUrl = `${creds.baseUrl}/jira/software/projects/${configuredBoards[0].projectKeys[0]}/boards`;

  try {
    const today = Date.now();

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

        for (const issue of issues) {
          const accountId = issue.fields.assignee?.accountId;
          if (!accountId) continue;
          const email = emailByAccountId.get(accountId);
          if (!email) continue;

          const statusKey = issue.fields.status.statusCategory.key;
          const statusBucket = issueStatusByEmail[email];
          statusBucket.total += 1;
          if (statusKey === "done") statusBucket.done += 1;
          else if (statusKey === "indeterminate") statusBucket.inProgress += 1;
          else statusBucket.todo += 1;

          const dueDate = issue.fields.duedate;
          if (!dueDate) continue;

          const month = monthFromDate(dueDate);
          const isDone = statusKey === "done";
          const dueMs = new Date(`${dueDate}T00:00:00`).getTime();
          const bucket = (byEmail[email][month] ??= { assigned: 0, onTime: 0 });

          if (isDone) {
            const resolutionMs = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : today;
            bucket.assigned += 1;
            if (resolutionMs <= dueMs) bucket.onTime += 1;
          } else if (dueMs < today) {
            // Deadline already passed and the issue is still open — counts as assigned, missed.
            bucket.assigned += 1;
          }
          // Issues not yet done whose due date hasn't arrived yet are excluded — their
          // outcome can't be judged yet.
        }
      }),
    );

    return { configured: true, error: null, fetchedAt, boardUrl, byEmail, issueStatusByEmail, unconfiguredEmails };
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "Error desconocido al conectar con Jira.",
      fetchedAt,
      boardUrl,
      byEmail,
      issueStatusByEmail,
      unconfiguredEmails,
    };
  }
}
