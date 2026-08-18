"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDashboardFilters, type DeadlinesByEmail } from "@/lib/dashboardFilters";
import { pct, QUARTERS_WITH_DATA, type Okr, type PeerComment, type Quarter, type Strategist } from "@/lib/strategists";

const STORAGE_KEY = "qa-office:dashboard-estrategas-records";

/** One strategist's manually-entered data for one quarter. Every field starts unset — nothing here is fabricated. */
export interface ManualQuarterlyData {
  peerReviewScore: number | null;
  peerReviewCount: number | null;
  peerComments: PeerComment[];
  okrCompletion: number | null;
  kpiCompliance: number | null;
  okrs: Okr[];
  bitacorasExpected: number | null;
  bitacorasSubmitted: number | null;
  lastBitacoraDate: string | null;
  qaScore: number | null;
  qaReviewsCount: number | null;
  qaIssuesFound: number | null;
  npsPromoters: number | null;
  npsPassives: number | null;
  npsDetractors: number | null;
  selfAssessmentBiggestWin: string;
  selfAssessmentMistakeLearning: string;
  selfAssessmentSkillToDevelop: string;
}

export const EMPTY_QUARTERLY_DATA: ManualQuarterlyData = {
  peerReviewScore: null,
  peerReviewCount: null,
  peerComments: [],
  okrCompletion: null,
  kpiCompliance: null,
  okrs: [],
  bitacorasExpected: null,
  bitacorasSubmitted: null,
  lastBitacoraDate: null,
  qaScore: null,
  qaReviewsCount: null,
  qaIssuesFound: null,
  npsPromoters: null,
  npsPassives: null,
  npsDetractors: null,
  selfAssessmentBiggestWin: "",
  selfAssessmentMistakeLearning: "",
  selfAssessmentSkillToDevelop: "",
};

type RecordsState = Record<string, Partial<Record<Quarter, ManualQuarterlyData>>>;

interface StrategistRecordsContextValue {
  hydrated: boolean;
  getQuarterData: (strategistId: string, quarter: Quarter) => ManualQuarterlyData;
  setQuarterData: (strategistId: string, quarter: Quarter, data: ManualQuarterlyData) => void;
  recordsByStrategist: RecordsState;
}

const StrategistRecordsContext = createContext<StrategistRecordsContextValue | null>(null);

export function StrategistRecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<RecordsState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setRecords(JSON.parse(raw) as RecordsState);
    } catch {
      // Corrupt or inaccessible storage — start from empty (no fabricated fallback data).
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Storage full or unavailable (private browsing) — edits stay in-memory for this session.
    }
  }, [records, hydrated]);

  const value = useMemo<StrategistRecordsContextValue>(
    () => ({
      hydrated,
      recordsByStrategist: records,
      getQuarterData: (strategistId, quarter) => records[strategistId]?.[quarter] ?? EMPTY_QUARTERLY_DATA,
      setQuarterData: (strategistId, quarter, data) => {
        setRecords((prev) => ({ ...prev, [strategistId]: { ...prev[strategistId], [quarter]: data } }));
      },
    }),
    [records, hydrated],
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
  npsResponses: number | null;
  npsPromoters: number | null;
  npsPassives: number | null;
  npsDetractors: number | null;
  selfAssessments: { quarter: Quarter; biggestWin: string; mistakeLearning: string; skillToDevelop: string }[];
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

export interface DeadlineQuarterCount {
  assigned: number;
  onTime: number;
}

/**
 * Builds the comparable "effective" view of one strategist's data for a quarter or the annual
 * period. `deadlinesByQuarter` is null when Jira isn't configured/reachable (unknown, not zero);
 * an entry present but assigned=0 means Jira confirmed there were no due tickets that quarter.
 */
export function getEffectiveRecord(
  manualByQuarter: Partial<Record<Quarter, ManualQuarterlyData>>,
  deadlinesByQuarter: Partial<Record<Quarter, DeadlineQuarterCount>> | null,
  period: Quarter | "anual",
): EffectiveRecord {
  const quarters: Quarter[] = period === "anual" ? QUARTERS_WITH_DATA : [period];
  const manuals = quarters.map((q) => manualByQuarter[q] ?? EMPTY_QUARTERLY_DATA);

  const peerReviewScore = avgOrNull(manuals.map((m) => m.peerReviewScore));
  const peerReviewCount = sumOrNull(manuals.map((m) => m.peerReviewCount));
  const peerComments = manuals.flatMap((m) => m.peerComments);

  const okrCompletion = avgOrNull(manuals.map((m) => m.okrCompletion));
  const kpiCompliance = avgOrNull(manuals.map((m) => m.kpiCompliance));
  const okrs = manuals.flatMap((m) => m.okrs);

  const bitacorasExpected = sumOrNull(manuals.map((m) => m.bitacorasExpected));
  const bitacorasSubmitted = sumOrNull(manuals.map((m) => m.bitacorasSubmitted));
  const bitacoraComplianceRate =
    bitacorasExpected !== null && bitacorasSubmitted !== null ? pct(bitacorasSubmitted, bitacorasExpected) : null;
  const lastBitacoraDate = manuals.map((m) => m.lastBitacoraDate).filter((d): d is string => !!d).sort().slice(-1)[0] ?? null;

  const qaScore = avgOrNull(manuals.map((m) => m.qaScore));
  const qaReviewsCount = sumOrNull(manuals.map((m) => m.qaReviewsCount));
  const qaIssuesFound = sumOrNull(manuals.map((m) => m.qaIssuesFound));

  const npsPromoters = sumOrNull(manuals.map((m) => m.npsPromoters));
  const npsPassives = sumOrNull(manuals.map((m) => m.npsPassives));
  const npsDetractors = sumOrNull(manuals.map((m) => m.npsDetractors));
  const hasNpsData = npsPromoters !== null || npsPassives !== null || npsDetractors !== null;
  const npsResponses = hasNpsData ? (npsPromoters ?? 0) + (npsPassives ?? 0) + (npsDetractors ?? 0) : null;
  const npsScore = hasNpsData && npsResponses !== null && npsResponses > 0 ? Math.round((((npsPromoters ?? 0) - (npsDetractors ?? 0)) / npsResponses) * 100) : null;

  let deadlinesAssigned = 0;
  let deadlinesOnTime = 0;
  let deadlineComplianceRate: number | null = null;
  if (deadlinesByQuarter) {
    for (const q of quarters) {
      const d = deadlinesByQuarter[q];
      if (d) {
        deadlinesAssigned += d.assigned;
        deadlinesOnTime += d.onTime;
      }
    }
    deadlineComplianceRate = deadlinesAssigned > 0 ? pct(deadlinesOnTime, deadlinesAssigned) : null;
  }

  const selfAssessments = quarters
    .map((q) => {
      const m = manualByQuarter[q] ?? EMPTY_QUARTERLY_DATA;
      const hasAny = m.selfAssessmentBiggestWin || m.selfAssessmentMistakeLearning || m.selfAssessmentSkillToDevelop;
      return hasAny
        ? {
            quarter: q,
            biggestWin: m.selfAssessmentBiggestWin,
            mistakeLearning: m.selfAssessmentMistakeLearning,
            skillToDevelop: m.selfAssessmentSkillToDevelop,
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
    npsResponses,
    npsPromoters,
    npsPassives,
    npsDetractors,
    selfAssessments,
    hasAnyData,
  };
}

/** Combines manual admin-entered data with real Jira deadlines for every currently-filtered strategist. */
export function useEffectiveRecords(): { s: Strategist; r: EffectiveRecord }[] {
  const { filteredStrategists, period, jiraDeadlines } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();

  return filteredStrategists.map((s) => {
    const manualByQuarter = recordsByStrategist[s.id] ?? {};
    const deadlinesByQuarter =
      jiraDeadlines?.configured && !jiraDeadlines.error ? jiraDeadlines.byEmail[s.email] ?? null : null;
    return { s, r: getEffectiveRecord(manualByQuarter, deadlinesByQuarter, period) };
  });
}

/** Raw inputs for tabs that need to compute a per-quarter trend (one point per quarter, not just the selected period). */
export function useStrategistDataInputs() {
  const { filteredStrategists, jiraDeadlines } = useDashboardFilters();
  const { recordsByStrategist } = useStrategistRecords();
  return { filteredStrategists, recordsByStrategist, jiraDeadlines };
}

/** Effective record for one strategist in one specific quarter (for trend charts, bypassing the selected period). */
export function getEffectiveRecordForQuarter(
  strategist: Strategist,
  quarter: Quarter,
  recordsByStrategist: RecordsState,
  jiraDeadlines: { configured: boolean; error: string | null; byEmail: DeadlinesByEmail } | null,
): EffectiveRecord {
  const manualByQuarter = recordsByStrategist[strategist.id] ?? {};
  const deadlinesByQuarter =
    jiraDeadlines?.configured && !jiraDeadlines.error ? jiraDeadlines.byEmail[strategist.email] ?? null : null;
  return getEffectiveRecord(manualByQuarter, deadlinesByQuarter, quarter);
}
