"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DASHBOARD_LAST_UPDATED,
  getDefaultPeriod,
  monthFromDate,
  STRATEGISTS,
  type MonthKey,
  type Period,
  type Strategist,
} from "./strategists";
import { EMPTY_EXTERNAL_SCORES, type ExternalScoresResponse } from "./externalScores";
import { useStrategistRecords } from "./strategistRecords";

export type { Period };

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
  overdueOpen: number;
  noDueDate: number;
}

export type IssueStatusByEmail = Record<string, IssueStatusCount>;

export interface ProjectIssueStats extends IssueStatusCount {
  name: string;
  reported: number;
  reportedOpen: number;
}

export type ProjectsByEmail = Record<string, Record<string, ProjectIssueStats>>;

export interface JiraDeadlinesResponse {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  boardUrl: string | null;
  byEmail: DeadlinesByEmail;
  issueStatusByEmail: IssueStatusByEmail;
  projectsByEmail: ProjectsByEmail;
  unconfiguredEmails: string[];
}

export interface BitacoraMonthCount {
  expected: number;
  submitted: number;
  lastDate: string | null;
}

export type BitacorasByStrategistId = Record<string, Record<MonthKey, BitacoraMonthCount>>;

export interface BitacorasSyncResponse {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  byStrategistId: BitacorasByStrategistId;
  notApplicableIds: string[];
}

interface DashboardFiltersValue {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  period: Period;
  setPeriod: (p: Period) => void;
  specificDate: string | null;
  setSpecificDate: (d: string | null) => void;
  clearFilters: () => void;
  strategists: Strategist[];
  filteredStrategists: Strategist[];
  lastUpdated: string;
  /** null while the initial fetch is in flight. */
  jiraDeadlines: JiraDeadlinesResponse | null;
  refreshJiraDeadlines: () => void;
  /** null while the initial fetch is in flight. */
  bitacorasSync: BitacorasSyncResponse | null;
  refreshBitacorasSync: () => void;
  /** QA reports (Gmail), NPS surveys (Figma) and CSAT (Google Sheets), rolled up per strategist. null while the initial fetch is in flight. */
  externalScores: ExternalScoresResponse | null;
  refreshExternalScores: () => void;
}

const DashboardFiltersContext = createContext<DashboardFiltersValue | null>(null);

export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriodState] = useState<Period>(getDefaultPeriod());
  const [specificDate, setSpecificDateState] = useState<string | null>(null);
  const [jiraDeadlines, setJiraDeadlines] = useState<JiraDeadlinesResponse | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const { jiraBoards, hydrated: recordsHydrated, getSources } = useStrategistRecords();
  // Strategists who don't use Jira: not queried, and their deadlines are typed by hand in Admin.
  const noJiraKey = STRATEGISTS.filter((s) => !getSources(s.id).jira).map((s) => s.id).join(",");
  const boardsKey = useMemo(() => JSON.stringify([jiraBoards, noJiraKey]), [jiraBoards, noJiraKey]);
  const lastFetchedBoardsKey = useRef<string | null>(null);

  useEffect(() => {
    if (!recordsHydrated) return;
    if (lastFetchedBoardsKey.current === boardsKey && refreshToken === 0) return;
    lastFetchedBoardsKey.current = boardsKey;

    let cancelled = false;
    fetch("/api/jira/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boards: jiraBoards, skip: noJiraKey === "" ? [] : noJiraKey.split(",") }),
    })
      .then((res) => res.json())
      .then((json: JiraDeadlinesResponse) => {
        if (!cancelled) setJiraDeadlines(json);
      })
      .catch(() => {
        if (!cancelled) {
          setJiraDeadlines({
            configured: true,
            error: "No se pudo conectar con el servidor de la aplicación.",
            fetchedAt: new Date(0).toISOString(),
            boardUrl: null,
            byEmail: {},
            issueStatusByEmail: {},
            projectsByEmail: {},
            unconfiguredEmails: [],
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordsHydrated, boardsKey, refreshToken]);

  function refreshJiraDeadlines() {
    setRefreshToken((n) => n + 1);
  }

  const [bitacorasSync, setBitacorasSync] = useState<BitacorasSyncResponse | null>(null);
  const [bitacorasRefreshToken, setBitacorasRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bitacoras/sync")
      .then((res) => res.json())
      .then((json: BitacorasSyncResponse) => {
        if (!cancelled) setBitacorasSync(json);
      })
      .catch(() => {
        if (!cancelled) {
          setBitacorasSync({
            configured: true,
            error: "No se pudo conectar con el servidor de la aplicación.",
            fetchedAt: new Date(0).toISOString(),
            byStrategistId: {},
            notApplicableIds: [],
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bitacorasRefreshToken]);

  function refreshBitacorasSync() {
    setBitacorasRefreshToken((n) => n + 1);
  }

  const [externalScores, setExternalScores] = useState<ExternalScoresResponse | null>(null);
  const [externalRefreshToken, setExternalRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/external-scores")
      .then((res) => res.json())
      .then((json: ExternalScoresResponse) => {
        if (!cancelled) setExternalScores(json);
      })
      .catch(() => {
        if (!cancelled) {
          setExternalScores({ ...EMPTY_EXTERNAL_SCORES, configured: true, error: "No se pudo conectar con el servidor de la aplicación.", fetchedAt: new Date().toISOString() });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [externalRefreshToken]);

  function refreshExternalScores() {
    setExternalRefreshToken((n) => n + 1);
  }

  function setPeriod(p: Period) {
    setPeriodState(p);
    setSpecificDateState(null);
  }

  function setSpecificDate(d: string | null) {
    setSpecificDateState(d);
    if (d) setPeriodState(monthFromDate(d));
  }

  function clearFilters() {
    setSearchQuery("");
    setPeriodState(getDefaultPeriod());
    setSpecificDateState(null);
  }

  // Strategists who aren't on the bitácoras sheet get no live bitácora data, so only their typed value counts.
  const noBitacorasKey = STRATEGISTS.filter((s) => !getSources(s.id).bitacoras).map((s) => s.id).join(",");
  const effectiveBitacorasSync = useMemo<BitacorasSyncResponse | null>(() => {
    if (!bitacorasSync || noBitacorasKey === "") return bitacorasSync;
    const off = new Set(noBitacorasKey.split(","));
    return {
      ...bitacorasSync,
      byStrategistId: Object.fromEntries(Object.entries(bitacorasSync.byStrategistId).filter(([id]) => !off.has(id))),
      notApplicableIds: bitacorasSync.notApplicableIds.filter((id) => !off.has(id)),
    };
  }, [bitacorasSync, noBitacorasKey]);

  const filteredStrategists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q === "") return STRATEGISTS;
    return STRATEGISTS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const value = useMemo<DashboardFiltersValue>(
    () => ({
      searchQuery,
      setSearchQuery,
      period,
      setPeriod,
      specificDate,
      setSpecificDate,
      clearFilters,
      strategists: STRATEGISTS,
      filteredStrategists,
      lastUpdated: DASHBOARD_LAST_UPDATED,
      jiraDeadlines,
      refreshJiraDeadlines,
      bitacorasSync: effectiveBitacorasSync,
      refreshBitacorasSync,
      externalScores,
      refreshExternalScores,
    }),
    [searchQuery, period, specificDate, filteredStrategists, jiraDeadlines, effectiveBitacorasSync, externalScores],
  );

  return <DashboardFiltersContext.Provider value={value}>{children}</DashboardFiltersContext.Provider>;
}

export function useDashboardFilters() {
  const ctx = useContext(DashboardFiltersContext);
  if (!ctx) throw new Error("useDashboardFilters must be used within a DashboardFiltersProvider");
  return ctx;
}
