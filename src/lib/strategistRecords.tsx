"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDashboardFilters, type BitacorasByStrategistId, type DeadlinesByEmail } from "@/lib/dashboardFilters";
import type { ExternalMonthScores, ExternalScoresResponse } from "@/lib/externalScores";
import {
  monthsForPeriod,
  pct,
  resolveSources,
  STRATEGISTS,
  type MonthKey,
  type Okr,
  type PeerComment,
  type Period,
  type ProjectAssignment,
  type Strategist,
  type StrategistSources,
} from "@/lib/strategists";

const RECORDS_STORAGE_KEY = "qa-office:dashboard-estrategas-records-v2";
const PROJECTS_STORAGE_KEY = "qa-office:dashboard-estrategas-projects";
const JIRA_BOARDS_STORAGE_KEY = "qa-office:dashboard-estrategas-jira-boards";
const SOURCES_STORAGE_KEY = "qa-office:dashboard-estrategas-sources";

/** One strategist's manually-entered data for one month. Every field starts unset — nothing here is fabricated. */
export interface ManualMonthlyData {
  peerReviewScore: number | null;
  peerReviewCount: number | null;
  peerComments: PeerComment[];
  /** One score for OKRs and KPIs together (0-100). */
  okrCompletion: number | null;
  okrs: Okr[];
  qaScore: number | null;
  qaReviewsCount: number | null;
  qaIssuesFound: number | null;
  npsScore: number | null;
  /** Manual stand-ins for the two live metrics: only used when Jira / Sheets have nothing for that month. */
  deadlineCompliance: number | null;
  bitacoraCompliance: number | null;
  selfAssessmentBiggestWin: string;
  selfAssessmentMistakeLearning: string;
  selfAssessmentSkillToDevelop: string;
}

export const EMPTY_MONTHLY_DATA: ManualMonthlyData = {
  peerReviewScore: null,
  peerReviewCount: null,
  peerComments: [],
  okrCompletion: null,
  okrs: [],
  qaScore: null,
  qaReviewsCount: null,
  qaIssuesFound: null,
  npsScore: null,
  deadlineCompliance: null,
  bitacoraCompliance: null,
  selfAssessmentBiggestWin: "",
  selfAssessmentMistakeLearning: "",
  selfAssessmentSkillToDevelop: "",
};

type RecordsState = Record<string, Partial<Record<MonthKey, ManualMonthlyData>>>;
type ProjectsState = Record<string, ProjectAssignment[]>;
type JiraBoardsState = Record<string, string>;
type SourcesState = Record<string, Partial<StrategistSources>>;

/** Where the admin data lives: the shared database, or (no DATABASE_URL / unreachable) this browser's own storage. */
export type StorageMode = "loading" | "db" | "local";

interface StrategistRecordsContextValue {
  /** True once the data has been read from wherever it lives. */
  hydrated: boolean;
  storage: StorageMode;
  /** Why the database couldn't be used, when `storage` fell back to "local". */
  dbError: string | null;
  /** The last failed save, if any (cleared by the next successful save). */
  saveError: string | null;
  /** Entries stored in this browser that the database doesn't have yet. */
  importableCount: number;
  importLocalData: () => Promise<void>;
  recordsByStrategist: RecordsState;
  getMonthData: (strategistId: string, month: MonthKey) => ManualMonthlyData;
  setMonthData: (strategistId: string, month: MonthKey, data: ManualMonthlyData) => void;
  projectsByStrategist: ProjectsState;
  getProjectHistory: (strategistId: string) => ProjectAssignment[];
  setProjectHistory: (strategistId: string, projects: ProjectAssignment[]) => void;
  jiraBoards: JiraBoardsState;
  getJiraBoard: (strategistId: string) => string;
  setJiraBoard: (strategistId: string, projectKey: string) => void;
  /** Which live sources (Jira, bitácoras sheet) this strategist uses; the rest of their metrics are typed by hand. */
  getSources: (strategistId: string) => StrategistSources;
  setSources: (strategistId: string, sources: StrategistSources) => void;
}

/** Records saved before a field existed come back without it; fill the gaps with "no data". */
export function withDefaults(data: (Partial<ManualMonthlyData> & { kpiCompliance?: number | null }) | undefined): ManualMonthlyData {
  // OKRs and KPIs used to be two scores; records saved that way fold into one (their average) and the old field is dropped.
  const { kpiCompliance, ...rest } = data ?? {};
  const merged = { ...EMPTY_MONTHLY_DATA, ...rest };
  if (kpiCompliance !== null && kpiCompliance !== undefined) {
    merged.okrCompletion = merged.okrCompletion === null ? kpiCompliance : Math.round((merged.okrCompletion + kpiCompliance) / 2);
  }
  return merged;
}

const StrategistRecordsContext = createContext<StrategistRecordsContextValue | null>(null);

type DashboardWrite =
  | { kind: "month"; strategistId: string; month: MonthKey; data: ManualMonthlyData }
  | { kind: "projects"; strategistId: string; projects: ProjectAssignment[] }
  | { kind: "board"; strategistId: string; projectKeys: string }
  | { kind: "sources"; strategistId: string; jira: boolean; bitacoras: boolean };

interface DashboardDataResponse {
  configured: boolean;
  error?: string;
  records?: RecordsState;
  projects?: ProjectsState;
  jiraBoards?: JiraBoardsState;
  sources?: SourcesState;
}

const KNOWN_IDS = new Set(STRATEGISTS.map((s) => s.id));

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Corrupt or inaccessible storage — start empty (no fabricated fallback data).
    return fallback;
  }
}

/** What this browser holds that `db` doesn't, as writes — never overwrites an entry the database already has. */
function localOnlyWrites(db: { records: RecordsState; projects: ProjectsState; jiraBoards: JiraBoardsState }): DashboardWrite[] {
  const writes: DashboardWrite[] = [];
  const records = readLocal<RecordsState>(RECORDS_STORAGE_KEY, {});
  for (const [strategistId, months] of Object.entries(records)) {
    if (!KNOWN_IDS.has(strategistId)) continue;
    for (const [month, data] of Object.entries(months)) {
      if (data && !db.records[strategistId]?.[month]) writes.push({ kind: "month", strategistId, month, data: withDefaults(data) });
    }
  }
  const projects = readLocal<ProjectsState>(PROJECTS_STORAGE_KEY, {});
  for (const [strategistId, list] of Object.entries(projects)) {
    if (KNOWN_IDS.has(strategistId) && list.length > 0 && !db.projects[strategistId]?.length) writes.push({ kind: "projects", strategistId, projects: list });
  }
  const boards = readLocal<JiraBoardsState>(JIRA_BOARDS_STORAGE_KEY, {});
  for (const [strategistId, projectKeys] of Object.entries(boards)) {
    if (KNOWN_IDS.has(strategistId) && projectKeys.trim() !== "" && !db.jiraBoards[strategistId]) writes.push({ kind: "board", strategistId, projectKeys });
  }
  return writes;
}

async function sendWrites(writes: DashboardWrite[]): Promise<void> {
  const res = await fetch("/api/dashboard-data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(res.status === 401 ? "Tu sesión de admin venció: vuelve a entrar para guardar." : (body.error ?? `Error ${res.status} al guardar.`));
  }
}

export function StrategistRecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<RecordsState>({});
  const [projects, setProjects] = useState<ProjectsState>({});
  const [jiraBoards, setJiraBoards] = useState<JiraBoardsState>({});
  const [sources, setSourcesState] = useState<SourcesState>({});
  const [storage, setStorage] = useState<StorageMode>("loading");
  const [dbError, setDbError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importableCount, setImportableCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard-data", { cache: "no-store" });
      const json = (await res.json()) as DashboardDataResponse;
      if (json.configured && res.ok) {
        const db = { records: json.records ?? {}, projects: json.projects ?? {}, jiraBoards: json.jiraBoards ?? {} };
        setRecords(db.records);
        setProjects(db.projects);
        setJiraBoards(db.jiraBoards);
        setSourcesState(json.sources ?? {});
        setImportableCount(localOnlyWrites(db).length);
        setDbError(null);
        setStorage("db");
        return;
      }
      setDbError(json.configured ? (json.error ?? "No se pudo leer la base de datos.") : null);
    } catch {
      setDbError("No se pudo conectar con el servidor.");
    }
    // No database (or it's unreachable): this browser's own storage keeps working.
    setRecords(readLocal<RecordsState>(RECORDS_STORAGE_KEY, {}));
    setProjects(readLocal<ProjectsState>(PROJECTS_STORAGE_KEY, {}));
    setJiraBoards(readLocal<JiraBoardsState>(JIRA_BOARDS_STORAGE_KEY, {}));
    setSourcesState(readLocal<SourcesState>(SOURCES_STORAGE_KEY, {}));
    setStorage("local");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // In "local" mode every change is mirrored to localStorage; in "db" mode the database is the source of truth.
  useEffect(() => {
    if (storage !== "local") return;
    try {
      window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      window.localStorage.setItem(JIRA_BOARDS_STORAGE_KEY, JSON.stringify(jiraBoards));
      window.localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(sources));
    } catch {
      // Storage full or unavailable (private browsing) — edits stay in-memory for this session.
    }
  }, [storage, records, projects, jiraBoards, sources]);

  const persist = useCallback(
    (writes: DashboardWrite[]) => {
      if (storage !== "db") return;
      sendWrites(writes).then(
        () => setSaveError(null),
        (err: unknown) => {
          setSaveError(err instanceof Error ? err.message : "No se pudo guardar.");
          // The optimistic edit didn't land: show what the database actually has.
          void load();
        },
      );
    },
    [storage, load],
  );

  const importLocalData = useCallback(async () => {
    const writes = localOnlyWrites({ records, projects, jiraBoards });
    if (writes.length === 0) return;
    try {
      // Chunked so a large history stays under the API's per-request limit.
      for (let i = 0; i < writes.length; i += 100) await sendWrites(writes.slice(i, i + 100));
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo importar.");
    }
    await load();
  }, [records, projects, jiraBoards, load]);

  const value = useMemo<StrategistRecordsContextValue>(
    () => ({
      hydrated: storage !== "loading",
      storage,
      dbError,
      saveError,
      importableCount,
      importLocalData,
      recordsByStrategist: records,
      getMonthData: (strategistId, month) => withDefaults(records[strategistId]?.[month]),
      setMonthData: (strategistId, month, data) => {
        setRecords((prev) => ({ ...prev, [strategistId]: { ...prev[strategistId], [month]: data } }));
        persist([{ kind: "month", strategistId, month, data }]);
      },
      projectsByStrategist: projects,
      getProjectHistory: (strategistId) => projects[strategistId] ?? [],
      setProjectHistory: (strategistId, list) => {
        setProjects((prev) => ({ ...prev, [strategistId]: list }));
        persist([{ kind: "projects", strategistId, projects: list }]);
      },
      jiraBoards,
      getJiraBoard: (strategistId) => jiraBoards[strategistId] ?? "",
      setJiraBoard: (strategistId, projectKeys) => {
        setJiraBoards((prev) => ({ ...prev, [strategistId]: projectKeys }));
        persist([{ kind: "board", strategistId, projectKeys }]);
      },
      getSources: (strategistId) => resolveSources(strategistId, sources[strategistId]),
      setSources: (strategistId, next) => {
        setSourcesState((prev) => ({ ...prev, [strategistId]: next }));
        persist([{ kind: "sources", strategistId, jira: next.jira, bitacoras: next.bitacoras }]);
      },
    }),
    [records, projects, jiraBoards, sources, storage, dbError, saveError, importableCount, importLocalData, persist],
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
  /** From the live sources (Gmail QA reports / Figma surveys / CSAT sheet); zero or null when a month had none. */
  qaReportCount: number;
  npsResponses: number;
  /** Average of the survey's 1-5 ratings, as 0-100. */
  satisfactionScore: number | null;
  csatScore: number | null;
  csatResponses: number;
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
  externalByMonth: Partial<Record<MonthKey, ExternalMonthScores>> | null = null,
): EffectiveRecord {
  const months = monthsForPeriod(period);
  const externals = months.map((m) => externalByMonth?.[m]);
  const manuals = months.map((m) => withDefaults(manualByMonth[m]));

  const peerReviewScore = avgOrNull(manuals.map((m) => m.peerReviewScore));
  const peerReviewCount = sumOrNull(manuals.map((m) => m.peerReviewCount));
  const peerComments = manuals.flatMap((m) => m.peerComments);

  const okrCompletion = avgOrNull(manuals.map((m) => m.okrCompletion));
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

  // Live data always wins; a manually entered value only fills in when the live source has nothing.
  if (bitacoraComplianceRate === null) bitacoraComplianceRate = avgOrNull(manuals.map((m) => m.bitacoraCompliance));

  // Live data wins here too: the QA reports from Gmail and the NPS surveys from Figma replace a typed value.
  const qaScore = avgOrNull(externals.map((e) => e?.qaScore)) ?? avgOrNull(manuals.map((m) => m.qaScore));
  const qaReportCount = externals.reduce((acc, e) => acc + (e?.qaReports ?? 0), 0);
  const qaReviewsCount = sumOrNull(manuals.map((m) => m.qaReviewsCount));
  const qaIssuesFound = sumOrNull(manuals.map((m) => m.qaIssuesFound));

  const npsScore = avgOrNull(externals.map((e) => e?.nps)) ?? avgOrNull(manuals.map((m) => m.npsScore));
  const npsResponses = externals.reduce((acc, e) => acc + (e?.npsResponses ?? 0), 0);
  const satisfactionScore = avgOrNull(externals.map((e) => e?.satisfaction));
  const csatScore = avgOrNull(externals.map((e) => e?.csat));
  const csatResponses = externals.reduce((acc, e) => acc + (e?.csatResponses ?? 0), 0);

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
  if (deadlineComplianceRate === null) deadlineComplianceRate = avgOrNull(manuals.map((m) => m.deadlineCompliance));

  const selfAssessments = months
    .map((m) => {
      const data = withDefaults(manualByMonth[m]);
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

  // NPS and CSAT measure how clients perceive the work, not how the strategist executes it, so they are shown
  // on their own and stay out of this average.
  const performanceScore = avgOrNull([peerReviewScore, okrCompletion, deadlineComplianceRate, bitacoraComplianceRate, qaScore]);

  const hasAnyData =
    performanceScore !== null ||
    peerReviewScore !== null ||
    okrCompletion !== null ||
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
    qaReportCount,
    npsResponses,
    satisfactionScore,
    csatScore,
    csatResponses,
    selfAssessments,
    hasAnyData,
  };
}

export interface PerformanceComponent {
  key: "peer" | "okr" | "deadlines" | "bitacoras" | "qa";
  label: string;
  /** 0-100 as it enters the average, or null when there is no data. */
  value: number | null;
}

/** The five inputs that get averaged into `performanceScore`, in display order. */
export function performanceComponents(r: EffectiveRecord): PerformanceComponent[] {
  return [
    { key: "peer", label: "Peer review", value: r.peerReviewScore },
    { key: "okr", label: "OKRs y KPIs", value: r.okrCompletion },
    { key: "deadlines", label: "Deadlines", value: r.deadlineComplianceRate },
    { key: "bitacoras", label: "Bitácoras", value: r.bitacoraComplianceRate },
    { key: "qa", label: "Calificación QA", value: r.qaScore },
  ];
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

export function externalForStrategist(external: ExternalScoresResponse | null, strategistId: string): Partial<Record<MonthKey, ExternalMonthScores>> | null {
  return external?.configured && !external.error ? external.byStrategistId[strategistId] ?? {} : null;
}

/** Combines manual admin-entered data with real Jira deadlines, Google Sheets bitácoras and the QA / NPS / CSAT scores for every currently-filtered strategist. */
export function useEffectiveRecords(): { s: Strategist; r: EffectiveRecord }[] {
  const { filteredStrategists, period, jiraDeadlines, bitacorasSync, externalScores } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();

  return filteredStrategists.map((s) => {
    const manualByMonth = recordsByStrategist[s.id] ?? {};
    return {
      s,
      r: getEffectiveRecord(
        manualByMonth,
        deadlinesForEmail(jiraDeadlines, s.email),
        period,
        bitacorasForStrategist(bitacorasSync, s.id),
        externalForStrategist(externalScores, s.id),
      ),
    };
  });
}

/** Every strategist's effective record for the selected period, whatever the search and group filters say (for the executive view). */
export function useAllEffectiveRecords(): { s: Strategist; r: EffectiveRecord }[] {
  const { period, jiraDeadlines, bitacorasSync, externalScores } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();
  return STRATEGISTS.map((s) => ({
    s,
    r: getEffectiveRecord(recordsByStrategist[s.id] ?? {}, deadlinesForEmail(jiraDeadlines, s.email), period, bitacorasForStrategist(bitacorasSync, s.id), externalForStrategist(externalScores, s.id)),
  }));
}

/** One strategist's effective record for the selected period, regardless of the search filter (for their profile). */
export function useEffectiveRecordFor(strategistId: string): { s: Strategist; r: EffectiveRecord } | null {
  const { period, jiraDeadlines, bitacorasSync, externalScores } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();
  const s = STRATEGISTS.find((x) => x.id === strategistId);
  if (!s) return null;
  return {
    s,
    r: getEffectiveRecord(
      recordsByStrategist[s.id] ?? {},
      deadlinesForEmail(jiraDeadlines, s.email),
      period,
      bitacorasForStrategist(bitacorasSync, s.id),
      externalForStrategist(externalScores, s.id),
    ),
  };
}

/** Raw inputs for tabs that need to compute a per-month trend (one point per month, not just the selected period). */
export function useStrategistDataInputs() {
  const { filteredStrategists, jiraDeadlines, bitacorasSync, externalScores } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();
  return { filteredStrategists, recordsByStrategist, jiraDeadlines, bitacorasSync, externalScores };
}

/** Effective record for one strategist in one specific month (for trend charts and history, bypassing the selected period). */
export function getEffectiveRecordForMonth(
  strategist: Strategist,
  month: MonthKey,
  recordsByStrategist: RecordsState,
  jiraDeadlines: { configured: boolean; error: string | null; byEmail: DeadlinesByEmail } | null,
  bitacorasSync: { configured: boolean; error: string | null; byStrategistId: BitacorasByStrategistId } | null = null,
  externalScores: ExternalScoresResponse | null = null,
): EffectiveRecord {
  const manualByMonth = recordsByStrategist[strategist.id] ?? {};
  return getEffectiveRecord(
    manualByMonth,
    deadlinesForEmail(jiraDeadlines, strategist.email),
    month,
    bitacorasForStrategist(bitacorasSync, strategist.id),
    externalForStrategist(externalScores, strategist.id),
  );
}
