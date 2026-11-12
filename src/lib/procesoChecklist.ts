"use client";

// Ticks of the process checklist. For now they live in this browser's localStorage only (like the portal's project list):
// they are not sent to the dashboard until the per-project tracking is built.
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "proceso-estrategas:checklist:v1";

export const checklistItemId = (stageId: string, group: number, item: number) => `${stageId}:${group}:${item}`;

export function useProcessChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  // localStorage only exists on the client, so the ticks are read after mount (keeps the server markup identical).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      // Corrupt or inaccessible storage: start with nothing ticked.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      // Storage full or unavailable: ticks stay in memory for this session.
    }
  }, [done, hydrated]);

  const toggle = useCallback((id: string) => setDone((prev) => ({ ...prev, [id]: !prev[id] })), []);
  const reset = useCallback((stageId: string) => setDone((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !id.startsWith(`${stageId}:`)))), []);

  return { done, toggle, reset, hydrated };
}
