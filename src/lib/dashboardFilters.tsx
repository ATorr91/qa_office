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
import { useStrategistRecords } from "./strategistRecords";

export type { Period };

export interface MonthDeadlineCount {
  assigned: number;
  onTime: number;
}

export type DeadlinesByEmail = Record<string, Record<MonthKey, MonthDeadlineCount>>;

export interface JiraDeadlinesResponse {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  boardUrl: string | null;
  byEmail: DeadlinesByEmail;
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
  unmatchedNames: string[];
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
}

const DashboardFiltersContext = createContext<DashboardFiltersValue | null>(null);

export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriodState] = useState<Period>(getDefaultPeriod());
  const [specificDate, setSpecificDateState] = useState<string | null>(null);
  const [jiraDeadlines, setJiraDeadlines] = useState<JiraDeadlinesResponse | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const { jiraBoards, hydrated: recordsHydrated } = useStrategistRecords();
  const boardsKey = useMemo(() => JSON.stringify(jiraBoards), [jiraBoards]);
  const lastFetchedBoardsKey = useRef<string | null>(null);

  useEffect(() => {
    if (!recordsHydrated) return;
    if (lastFetchedBoardsKey.current === boardsKey && refreshToken === 0) return;
    lastFetchedBoardsKey.current = boardsKey;

    let cancelled = false;
    fetch("/api/jira/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boards: jiraBoards }),
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
            unmatchedNames: [],
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
      bitacorasSync,
      refreshBitacorasSync,
    }),
    [searchQuery, period, specificDate, filteredStrategists, jiraDeadlines, bitacorasSync],
  );

  return <DashboardFiltersContext.Provider value={value}>{children}</DashboardFiltersContext.Provider>;
}

export function useDashboardFilters() {
  const ctx = useContext(DashboardFiltersContext);
  if (!ctx) throw new Error("useDashboardFilters must be used within a DashboardFiltersProvider");
  return ctx;
}
