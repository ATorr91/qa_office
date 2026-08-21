"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDashboardFilters, type BitacorasByStrategistId, type DeadlinesByEmail } from "@/lib/dashboardFilters";
import {
  monthsForPeriod,
  pct,
  type MonthKey,
  type Okr,
  type PeerComment,
  type Period,
  type ProjectAssignment,
  type Strategist,
} from "@/lib/strategists";

const RECORDS_STORAGE_KEY = "qa-office:dashboard-estrategas-records-v2";
const PROJECTS_STORAGE_KEY = "qa-office:dashboard-estrategas-projects";
const JIRA_BOARDS_STORAGE_KEY = "qa-office:dashboard-estrategas-jira-boards";

/** One strategist's manually-entered data for one month. Every field starts unset — nothing here is fabricated. */
export interface ManualMonthlyData {
  peerReviewScore: number | null;
  peerReviewCount: number | null;
  peerComments: PeerComment[];
  okrCompletion: number | null;
  kpiCompliance: number | null;
  okrs: Okr[];
  qaScore: number | null;
  qaReviewsCount: number | null;
  qaIssuesFound: number | null;
  npsScore: number | null;
  selfAssessmentBiggestWin: string;
  selfAssessmentMistakeLearning: string;
  selfAssessmentSkillToDevelop: string;
}

export const EMPTY_MONTHLY_DATA: ManualMonthlyData = {
  peerReviewScore: null,
  peerReviewCount: null,
  peerComments: [],
  okrCompletion: null,
  kpiCompliance: null,
  okrs: [],
  qaScore: null,
  qaReviewsCount: null,
  qaIssuesFound: null,
  npsScore: null,
  selfAssessmentBiggestWin: "",
  selfAssessmentMistakeLearning: "",
  selfAssessmentSkillToDevelop: "",
};

type RecordsState = Record<string, Partial<Record<MonthKey, ManualMonthlyData>>>;
type ProjectsState = Record<string, ProjectAssignment[]>;
type JiraBoardsState = Record<string, string>;

interface StrategistRecordsContextValue {
  hydrated: boolean;
  recordsByStrategist: RecordsState;
  getMonthData: (strategistId: string, month: MonthKey) => ManualMonthlyData;
  setMonthData: (strategistId: string, month: MonthKey, data: ManualMonthlyData) => void;
  projectsByStrategist: ProjectsState;
  getProjectHistory: (strategistId: string) => ProjectAssignment[];
  setProjectHistory: (strategistId: string, projects: ProjectAssignment[]) => void;
  jiraBoards: JiraBoardsState;
  getJiraBoard: (strategistId: string) => string;
  setJiraBoard: (strategistId: string, projectKey: string) => void;
}

const StrategistRecordsContext = createContext<StrategistRecordsContextValue | null>(null);

function useLocalStorageState<T>(key: string, initial: T): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw) as T);
    } catch {
      // Corrupt or inaccessible storage — start from the initial value (no fabricated fallback data).
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage full or unavailable (private browsing) — edits stay in-memory for this session.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, hydrated]);

  return [state, setState, hydrated];
}

export function StrategistRecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords, recordsHydrated] = useLocalStorageState<RecordsState>(RECORDS_STORAGE_KEY, {});
  const [projects, setProjects, projectsHydrated] = useLocalStorageState<ProjectsState>(PROJECTS_STORAGE_KEY, {});
  const [jiraBoards, setJiraBoards, boardsHydrated] = useLocalStorageState<JiraBoardsState>(JIRA_BOARDS_STORAGE_KEY, {});

  const value = useMemo<StrategistRecordsContextValue>(
    () => ({
      hydrated: recordsHydrated && projectsHydrated && boardsHydrated,
      recordsByStrategist: records,
      getMonthData: (strategistId, month) => records[strategistId]?.[month] ?? EMPTY_MONTHLY_DATA,
      setMonthData: (strategistId, month, data) => {
        setRecords((prev) => ({ ...prev, [strategistId]: { ...prev[strategistId], [month]: data } }));
      },
      projectsByStrategist: projects,
      getProjectHistory: (strategistId) => projects[strategistId] ?? [],
      setProjectHistory: (strategistId, list) => {
        setProjects((prev) => ({ ...prev, [strategistId]: list }));
      },
      jiraBoards,
      getJiraBoard: (strategistId) => jiraBoards[strategistId] ?? "",
      setJiraBoard: (strategistId, projectKey) => {
        setJiraBoards((prev) => ({ ...prev, [strategistId]: projectKey }));
      },
    }),
    [records, recordsHydrated, projects, projectsHydrated, jiraBoards, boardsHydrated, setRecords, setProjects, setJiraBoards],
  );

  return <StrategistRecordsContext.Provider value={value}>{children}</StrategistRecordsContext.Provider>;
}

export function useStrategistRecords() {
  const ctx = useContext(StrategistRecordsContext);
  if (!ctx) throw new Error("useStrategistRecords must be used within a StrategistRecordsProvider");
  return ctx;
}

// ---- real-data computation (no fabrication — a field with nothing entered stays null) ----

export interface EffectiveRecord {
  performanceScore: number | null;
  peerReviewScore: number | null;
  peerReviewCount: number | null;
  peerComments: PeerComment[];
  okrCompletion: number | null;
  kpiCompliance: number | null;
  okrs: Okr[];
  deadlinesAssigned: number;
  deadlinesOnTime: number;
  deadlineComplianceRate: number | null;
  bitacorasExpected: number | null;
  bitacorasSubmitted: number | null;
  bitacoraComplianceRate: number | null;
  lastBitacoraDate: string | null;
  qaScore: number | null;
  qaReviewsCount: number | null;
  qaIssuesFound: number | null;
  npsScore: number | null;
  selfAssessments: { month: MonthKey; biggestWin: string; mistakeLearning: string; skillToDevelop: string }[];
  hasAnyData: boolean;
}

function avgOrNull(values: (number | null | undefined)[]): number | null {
  const present = values.filter((v): v is number => v !== null && v !== undefined);
  if (present.length === 0) return null;
  return Math.round(present.reduce((a, b) => a + b, 0) / present.length);
}

function sumOrNull(values: (number | null | undefined)[]): number | null {
  const present = values.filter((v): v is number => v !== null && v !== undefined);
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0);
}

export interface MonthDeadlineCount {
  assigned: number;
  onTime: number;
}

export interface BitacoraMonthCount {
  expected: number;
  submitted: number;
  lastDate: string | null;
}

/**
 * Builds the comparable "effective" view of one strategist's data for a month or the annual
 * period. `deadlinesByMonth`/`bitacorasByMonth` are null when their live source (Jira / Google
 * Sheets) isn't configured/reachable for this strategist (unknown, not zero); a month present
 * but empty means the source confirmed there was genuinely nothing that month.
 */
export function getEffectiveRecord(
  manualByMonth: Partial<Record<MonthKey, ManualMonthlyData>>,
  deadlinesByMonth: Partial<Record<MonthKey, MonthDeadlineCount>> | null,
  period: Period,
  bitacorasByMonth: Partial<Record<MonthKey, BitacoraMonthCount>> | null = null,
): EffectiveRecord {
  const months = monthsForPeriod(period);
  const manuals = months.map((m) => manualByMonth[m] ?? EMPTY_MONTHLY_DATA);

  const peerReviewScore = avgOrNull(manuals.map((m) => m.peerReviewScore));
  const peerReviewCount = sumOrNull(manuals.map((m) => m.peerReviewCount));
  const peerComments = manuals.flatMap((m) => m.peerComments);

  const okrCompletion = avgOrNull(manuals.map((m) => m.okrCompletion));
  const kpiCompliance = avgOrNull(manuals.map((m) => m.kpiCompliance));
  const okrs = manuals.flatMap((m) => m.okrs);

  let bitacorasExpected: number | null = null;
  let bitacorasSubmitted: number | null = null;
  let bitacoraComplianceRate: number | null = null;
  let lastBitacoraDate: string | null = null;
  if (bitacorasByMonth) {
    const bCounts = months.map((m) => bitacorasByMonth[m]).filter((c): c is BitacoraMonthCount => c !== undefined);
    if (bCounts.length > 0) {
      bitacorasExpected = bCounts.reduce((acc, c) => acc + c.expected, 0);
      bitacorasSubmitted = bCounts.reduce((acc, c) => acc + c.submitted, 0);
      bitacoraComplianceRate = pct(bitacorasSubmitted, bitacorasExpected);
      lastBitacoraDate = bCounts.map((c) => c.lastDate).filter((d): d is string => !!d).sort().slice(-1)[0] ?? null;
    }
  }

  const qaScore = avgOrNull(manuals.map((m) => m.qaScore));
  const qaReviewsCount = sumOrNull(manuals.map((m) => m.qaReviewsCount));
  const qaIssuesFound = sumOrNull(manuals.map((m) => m.qaIssuesFound));

  const npsScore = avgOrNull(manuals.map((m) => m.npsScore));

  let deadlinesAssigned = 0;
  let deadlinesOnTime = 0;
  let deadlineComplianceRate: number | null = null;
  if (deadlinesByMonth) {
    for (const m of months) {
      const d = deadlinesByMonth[m];
      if (d) {
        deadlinesAssigned += d.assigned;
        deadlinesOnTime += d.onTime;
      }
    }
    deadlineComplianceRate = deadlinesAssigned > 0 ? pct(deadlinesOnTime, deadlinesAssigned) : null;
  }

  const selfAssessments = months
    .map((m) => {
      const data = manualByMonth[m] ?? EMPTY_MONTHLY_DATA;
      const hasAny = data.selfAssessmentBiggestWin || data.selfAssessmentMistakeLearning || data.selfAssessmentSkillToDevelop;
      return hasAny
        ? {
            month: m,
            biggestWin: data.selfAssessmentBiggestWin,
            mistakeLearning: data.selfAssessmentMistakeLearning,
            skillToDevelop: data.selfAssessmentSkillToDevelop,
          }
        : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const npsNormalized = npsScore !== null ? (npsScore + 100) / 2 : null;
  const performanceScore = avgOrNull([peerReviewScore, okrCompletion, kpiCompliance, deadlineComplianceRate, bitacoraComplianceRate, qaScore, npsNormalized]);

  const hasAnyData =
    performanceScore !== null ||
    peerReviewScore !== null ||
    okrCompletion !== null ||
    kpiCompliance !== null ||
    bitacoraComplianceRate !== null ||
    qaScore !== null ||
    npsScore !== null ||
    deadlinesAssigned > 0 ||
    selfAssessments.length > 0 ||
    okrs.length > 0 ||
    peerComments.length > 0;

  return {
    performanceScore,
    peerReviewScore,
    peerReviewCount,
    peerComments,
    okrCompletion,
    kpiCompliance,
    okrs,
    deadlinesAssigned,
    deadlinesOnTime,
    deadlineComplianceRate,
    bitacorasExpected,
    bitacorasSubmitted,
    bitacoraComplianceRate,
    lastBitacoraDate,
    qaScore,
    qaReviewsCount,
    qaIssuesFound,
    npsScore,
    selfAssessments,
    hasAnyData,
  };
}

function deadlinesForEmail(
  jiraDeadlines: { configured: boolean; error: string | null; byEmail: DeadlinesByEmail } | null,
  email: string,
): Partial<Record<MonthKey, MonthDeadlineCount>> | null {
  return jiraDeadlines?.configured && !jiraDeadlines.error ? jiraDeadlines.byEmail[email] ?? {} : null;
}

function bitacorasForStrategist(
  bitacorasSync: { configured: boolean; error: string | null; byStrategistId: BitacorasByStrategistId } | null,
  strategistId: string,
): Partial<Record<MonthKey, BitacoraMonthCount>> | null {
  return bitacorasSync?.configured && !bitacorasSync.error ? bitacorasSync.byStrategistId[strategistId] ?? {} : null;
}

/** Combines manual admin-entered data with real Jira deadlines and Google Sheets bitácoras for every currently-filtered strategist. */
export function useEffectiveRecords(): { s: Strategist; r: EffectiveRecord }[] {
  const { filteredStrategists, period, jiraDeadlines, bitacorasSync } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();

  return filteredStrategists.map((s) => {
    const manualByMonth = recordsByStrategist[s.id] ?? {};
    return {
      s,
      r: getEffectiveRecord(manualByMonth, deadlinesForEmail(jiraDeadlines, s.email), period, bitacorasForStrategist(bitacorasSync, s.id)),
    };
  });
}

/** Raw inputs for tabs that need to compute a per-month trend (one point per month, not just the selected period). */
export function useStrategistDataInputs() {
  const { filteredStrategists, jiraDeadlines, bitacorasSync } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();
  return { filteredStrategists, recordsByStrategist, jiraDeadlines, bitacorasSync };
}

/** Effective record for one strategist in one specific month (for trend charts and history, bypassing the selected period). */
export function getEffectiveRecordForMonth(
  strategist: Strategist,
  month: MonthKey,
  recordsByStrategist: RecordsState,
  jiraDeadlines: { configured: boolean; error: string | null; byEmail: DeadlinesByEmail } | null,
  bitacorasSync: { configured: boolean; error: string | null; byStrategistId: BitacorasByStrategistId } | null = null,
): EffectiveRecord {
  const manualByMonth = recordsByStrategist[strategist.id] ?? {};
  return getEffectiveRecord(
    manualByMonth,
    deadlinesForEmail(jiraDeadlines, strategist.email),
    month,
    bitacorasForStrategist(bitacorasSync, strategist.id),
  );
}
