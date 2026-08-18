"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DASHBOARD_LAST_UPDATED,
  quarterFromDate,
  STRATEGISTS,
  type Quarter,
  type Strategist,
} from "./strategists";

export type Period = Quarter | "anual";

export interface QuarterDeadlineCount {
  assigned: number;
  onTime: number;
}

export type DeadlinesByEmail = Record<string, Record<Quarter, QuarterDeadlineCount>>;

export interface JiraDeadlinesResponse {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  boardUrl: string | null;
  byEmail: DeadlinesByEmail;
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
}

const DashboardFiltersContext = createContext<DashboardFiltersValue | null>(null);

export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriodState] = useState<Period>("anual");
  const [specificDate, setSpecificDateState] = useState<string | null>(null);
  const [jiraDeadlines, setJiraDeadlines] = useState<JiraDeadlinesResponse | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setJiraDeadlines((prev) => (refreshToken === 0 ? prev : null));
    fetch("/api/jira/deadlines")
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
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  function refreshJiraDeadlines() {
    setRefreshToken((n) => n + 1);
  }

  function setPeriod(p: Period) {
    setPeriodState(p);
    setSpecificDateState(null);
  }

  function setSpecificDate(d: string | null) {
    setSpecificDateState(d);
    if (d) setPeriodState(quarterFromDate(d));
  }

  function clearFilters() {
    setSearchQuery("");
    setPeriodState("anual");
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
    }),
    [searchQuery, period, specificDate, filteredStrategists, jiraDeadlines],
  );

  return <DashboardFiltersContext.Provider value={value}>{children}</DashboardFiltersContext.Provider>;
}

export function useDashboardFilters() {
  const ctx = useContext(DashboardFiltersContext);
  if (!ctx) throw new Error("useDashboardFilters must be used within a DashboardFiltersProvider");
  return ctx;
}
