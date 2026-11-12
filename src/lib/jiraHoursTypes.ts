// Shape of the hours read from Jira worklogs. Kept free of server-only imports so client components can use it.

export interface JiraHourRow {
  /** Monday of the worklog's week, "YYYY-MM-DD". */
  week: string;
  /** Catalog project the hours were attributed to, or null when the Jira key isn't in the catalog. */
  projectId: string | null;
  projectKey: string;
  /** Roster id of the person who logged them, or null for people outside the strategist team (developers, designers). */
  strategistId: string | null;
  hours: number;
}

export interface JiraHoursResult {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  /** Worklogs are read from this day on. */
  since: string;
  issuesWithWorklogs: number;
  /** Date ("YYYY-MM-DD") of the most recent worklog found, or null when nobody has logged time. */
  lastWorklogDay: string | null;
  rows: JiraHourRow[];
  /** Tickets each strategist created in the last 30 days (their use of Jira). */
  ticketsCreated30d: Record<string, number>;
}
