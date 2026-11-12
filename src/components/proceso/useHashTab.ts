"use client";

import { useCallback, useEffect, useState } from "react";

/** The open tab lives in the URL hash (#archivos), so a link can point straight at it. Reads the hash after mount, like any browser-only value. */
export function useHashTab(ids: readonly string[], fallback: string): [string, (id: string) => void] {
  const [tab, setTab] = useState(fallback);

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      setTab(ids.includes(h) ? h : fallback);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [ids, fallback]);

  const select = useCallback((id: string) => {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  return [tab, select];
}
