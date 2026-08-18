"use client";

import { useEffect, useState } from "react";

const MAX_HISTORY = 8;

export function useSearchHistory(key: string) {
  const storageKey = `qa-office:search-history:${key}`;
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // Corrupt or inaccessible storage — start empty.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function addQuery(query: string) {
    const trimmed = query.trim();
    if (trimmed === "") return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_HISTORY,
      );
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Storage full or unavailable — history stays in-memory for this session.
      }
      return next;
    });
  }

  function removeQuery(query: string) {
    setHistory((prev) => {
      const next = prev.filter((h) => h !== query);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  return { history, addQuery, removeQuery, clearHistory };
}
