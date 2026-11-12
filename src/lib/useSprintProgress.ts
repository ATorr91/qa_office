"use client";

import { useCallback, useEffect, useState } from "react";
import type { SprintProgressResult } from "@/lib/jiraSprintTypes";

const REFRESH_MS = 60_000;

/** Polls the server every minute while the tab is on screen, and again as soon as the user comes back to it. */
export function useSprintProgress() {
  const [data, setData] = useState<SprintProgressResult | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (refresh: boolean) => {
    try {
      const res = await fetch(`/api/jira/sprints${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as SprintProgressResult);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    const whenVisible = () => {
      if (document.visibilityState === "visible") void load(false);
    };
    whenVisible();
    const timer = setInterval(whenVisible, REFRESH_MS);
    document.addEventListener("visibilitychange", whenVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", whenVisible);
    };
  }, [load]);

  return { data, failed, load };
}
