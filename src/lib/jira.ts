// Server-only Jira Cloud REST API client. Never import this from a "use client" component —
// it reads JIRA_API_TOKEN from the environment and must not reach the browser bundle.
import "server-only";

import { quarterFromDate, QUARTERS_WITH_DATA, type Quarter } from "@/lib/strategists";

export interface QuarterDeadlineCount {
  assigned: number;
  onTime: number;
}

export type DeadlinesByEmail = Record<string, Record<Quarter, QuarterDeadlineCount>>;

export interface JiraDeadlinesResult {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  boardUrl: string | null;
  byEmail: DeadlinesByEmail;
}

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

function readConfig(): JiraConfig | null {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;
  if (!baseUrl || !email || !apiToken || !projectKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), email, apiToken, projectKey };
}

function authHeader(config: JiraConfig): string {
  return `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString("base64")}`;
}

async function jiraFetch(config: JiraConfig, path: string, body?: object): Promise<unknown> {
  const res = await fetch(`${config.baseUrl}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: authHeader(config),
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

async function resolveAccountIds(config: JiraConfig, emails: string[]): Promise<Map<string, string>> {
  const emailByAccountId = new Map<string, string>();
  await Promise.all(
    emails.map(async (email) => {
      const hits = (await jiraFetch(
        config,
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
async function fetchAllIssues(config: JiraConfig, accountIds: string[]): Promise<JiraIssue[]> {
  if (accountIds.length === 0) return [];
  const jql = `project = "${config.projectKey}" AND assignee in (${accountIds.map((id) => `"${id}"`).join(",")}) AND duedate is not EMPTY ORDER BY duedate ASC`;
  const issues: JiraIssue[] = [];
  let nextPageToken: string | undefined;
  for (;;) {
    const page = (await jiraFetch(config, "/rest/api/3/search/jql", {
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

function emptyByEmail(emails: string[]): DeadlinesByEmail {
  const result: DeadlinesByEmail = {};
  for (const email of emails) {
    result[email] = Object.fromEntries(QUARTERS_WITH_DATA.map((q) => [q, { assigned: 0, onTime: 0 }])) as Record<Quarter, QuarterDeadlineCount>;
  }
  return result;
}

export async function fetchJiraDeadlines(emails: string[]): Promise<JiraDeadlinesResult> {
  const fetchedAt = new Date().toISOString();
  const config = readConfig();
  if (!config) {
    return { configured: false, error: null, fetchedAt, boardUrl: null, byEmail: emptyByEmail(emails) };
  }

  const boardUrl = `${config.baseUrl}/jira/software/projects/${config.projectKey}/boards`;

  try {
    const emailByAccountId = await resolveAccountIds(config, emails);
    const issues = await fetchAllIssues(config, [...emailByAccountId.keys()]);

    const byEmail = emptyByEmail(emails);
    const today = Date.now();

    for (const issue of issues) {
      const accountId = issue.fields.assignee?.accountId;
      const dueDate = issue.fields.duedate;
      if (!accountId || !dueDate) continue;
      const email = emailByAccountId.get(accountId);
      if (!email) continue;

      const quarter = quarterFromDate(dueDate);
      if (!QUARTERS_WITH_DATA.includes(quarter)) continue;

      const isDone = issue.fields.status.statusCategory.key === "done";
      const dueMs = new Date(`${dueDate}T00:00:00`).getTime();

      if (isDone) {
        const resolutionMs = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).getTime() : today;
        byEmail[email][quarter].assigned += 1;
        if (resolutionMs <= dueMs) byEmail[email][quarter].onTime += 1;
      } else if (dueMs < today) {
        // Deadline already passed and the issue is still open — counts as assigned, missed.
        byEmail[email][quarter].assigned += 1;
      }
      // Issues not yet done whose due date hasn't arrived yet are excluded — their
      // outcome can't be judged yet.
    }

    return { configured: true, error: null, fetchedAt, boardUrl, byEmail };
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "Error desconocido al conectar con Jira.",
      fetchedAt,
      boardUrl,
      byEmail: emptyByEmail(emails),
    };
  }
}
