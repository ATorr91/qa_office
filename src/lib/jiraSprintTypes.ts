// Shapes of the "Avance del sprint" data, shared by the server (jiraSprints.ts) and the dashboard tab.
// Kept free of server-only imports so client components can use them.

export interface SprintBucket {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
}

export interface SprintEpicProgress extends SprintBucket {
  /** Jira key of the epic, or null for work in the sprint that isn't under any epic. */
  key: string | null;
  name: string;
}

/** How the sprint is going against the calendar: done share of the sprint's work vs. share of the sprint's working days already gone. */
export type SprintPace = "al_dia" | "atrasado" | "en_riesgo" | "sin_trabajo";

export interface SprintSnapshot extends SprintBucket {
  id: number;
  name: string;
  /** "YYYY-MM-DD" in the team's timezone. */
  startDate: string;
  endDate: string;
  /** Done tickets ÷ tickets in this sprint, 0-100. Only the sprint's own work — nothing from earlier sprints. */
  donePct: number;
  /** Share of the sprint's working days (Mon-Fri) that have already passed, 0-100. */
  expectedPct: number;
  /** donePct − expectedPct: positive is ahead of the calendar. */
  gapPct: number;
  pace: SprintPace;
  workingDaysLeft: number;
  epics: SprintEpicProgress[];
}

/** The window the tracker gives a catalog project, to give the sprint some context. */
export interface SprintProjectWindow {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  /** Calendar share of the project's span already elapsed, 0-100. */
  elapsedPct: number;
  daysLeft: number;
}

export interface SprintBoardResult {
  /** Jira project key. */
  key: string;
  boardName: string | null;
  boardUrl: string | null;
  projects: SprintProjectWindow[];
  /** Strategist ids assigned to the catalog projects behind this key. */
  owners: string[];
  /** The sprint running today, or null with `note` saying why there isn't one. */
  sprint: SprintSnapshot | null;
  note: string | null;
}

export interface SprintProgressResult {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  boards: SprintBoardResult[];
}
