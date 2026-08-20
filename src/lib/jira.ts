// Server-only Jira Cloud REST API client. Never import this from a "use client" component —
// it reads JIRA_API_TOKEN from the environment and must not reach the browser bundle.
import "server-only";

import { monthFromDate, type MonthKey } from "@/lib/strategists";

export interface MonthDeadlineCount {
  assigned: number;
  onTime: number;
}

export type DeadlinesByEmail = Record<string, Record<MonthKey, MonthDeadlineCount>>;

export interface JiraDeadlinesResult {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  boardUrl: string | null;
  byEmail: DeadlinesByEmail;
  /** Strategists with no Jira project key configured (no per-person override, no global fallback) — not an error, just not wired up yet. */
  unconfiguredEmails: string[];
}

interface JiraCreds {
  baseUrl: string;
  email: string;
  apiToken: string;
}

/** One strategist's email plus the Jira project key their own board lives in. */
export interface StrategistBoard {
  email: string;
  projectKey: string;
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
  const jql = `project = "${projectKey}" AND assignee in (${accountIds.map((id) => `"${id}"`).join(",")}) AND duedate is not EMPTY ORDER BY duedate ASC`;
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
 * have their own board (project key) — `boards` groups strategists by project so people who
 * share a board are queried together, and people with no project key configured are skipped
 * (returned in `unconfiguredEmails`, not treated as an error).
 */
export async function fetchJiraDeadlines(boards: StrategistBoard[]): Promise<JiraDeadlinesResult> {
  const fetchedAt = new Date().toISOString();
  const byEmail: DeadlinesByEmail = {};
  for (const b of boards) byEmail[b.email] = {};

  const configuredBoards = boards.filter((b) => b.projectKey.trim() !== "");
  const unconfiguredEmails = boards.filter((b) => b.projectKey.trim() === "").map((b) => b.email);

  const creds = readCreds();
  if (!creds) {
    return { configured: false, error: null, fetchedAt, boardUrl: null, byEmail, unconfiguredEmails };
  }
  if (configuredBoards.length === 0) {
    return { configured: true, error: null, fetchedAt, boardUrl: null, byEmail, unconfiguredEmails };
  }

  const byProjectKey = new Map<string, string[]>();
  for (const b of configuredBoards) {
    byProjectKey.set(b.projectKey, [...(byProjectKey.get(b.projectKey) ?? []), b.email]);
  }
  const boardUrl = `${creds.baseUrl}/jira/software/projects/${configuredBoards[0].projectKey}/boards`;

  try {
    const today = Date.now();

    await Promise.all(
      [...byProjectKey.entries()].map(async ([projectKey, emails]) => {
        const emailByAccountId = await resolveAccountIds(creds, emails);
        const issues = await fetchAllIssues(creds, projectKey, [...emailByAccountId.keys()]);

        for (const issue of issues) {
          const accountId = issue.fields.assignee?.accountId;
          const dueDate = issue.fields.duedate;
          if (!accountId || !dueDate) continue;
          const email = emailByAccountId.get(accountId);
          if (!email) continue;

          const month = monthFromDate(dueDate);
          const isDone = issue.fields.status.statusCategory.key === "done";
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

    return { configured: true, error: null, fetchedAt, boardUrl, byEmail, unconfiguredEmails };
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "Error desconocido al conectar con Jira.",
      fetchedAt,
      boardUrl,
      byEmail,
      unconfiguredEmails,
    };
  }
}
