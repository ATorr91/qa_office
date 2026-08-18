"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TRENDS, generateTrendId, normalizeTrend, type Trend } from "@/lib/trends";

const STORAGE_KEY = "qa-office:trends";

interface TrendsContextValue {
  trends: Trend[];
  hydrated: boolean;
  getTrend: (id: string) => Trend | undefined;
  addTrend: (draft: Omit<Trend, "id">) => Trend;
  updateTrend: (id: string, draft: Omit<Trend, "id">) => void;
  removeTrend: (id: string) => void;
  togglePin: (id: string) => void;
}

const TrendsContext = createContext<TrendsContextValue | null>(null);

export function TrendsProvider({ children }: { children: ReactNode }) {
  const [trends, setTrends] = useState<Trend[]>(TRENDS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setTrends((JSON.parse(raw) as Trend[]).map(normalizeTrend));
    } catch {
      // Corrupt or inaccessible storage — fall back to the seed data already in state.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trends));
    } catch {
      // Storage full or unavailable (private browsing) — edits stay in-memory for this session.
    }
  }, [trends, hydrated]);

  const value = useMemo<TrendsContextValue>(
    () => ({
      trends,
      hydrated,
      getTrend: (id) => trends.find((t) => t.id === id),
      addTrend: (draft) => {
        const id = generateTrendId(draft.title, trends.map((t) => t.id));
        const trend: Trend = { ...draft, id };
        setTrends((prev) => [trend, ...prev]);
        return trend;
      },
      updateTrend: (id, draft) => {
        setTrends((prev) => prev.map((t) => (t.id === id ? { ...draft, id } : t)));
      },
      removeTrend: (id) => {
        setTrends((prev) => prev.filter((t) => t.id !== id));
      },
      togglePin: (id) => {
        setTrends((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
      },
    }),
    [trends, hydrated],
  );

  return <TrendsContext.Provider value={value}>{children}</TrendsContext.Provider>;
}

export function useTrends() {
  const ctx = useContext(TrendsContext);
  if (!ctx) throw new Error("useTrends must be used within a TrendsProvider");
  return ctx;
}
