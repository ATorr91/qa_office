"use client";

// The team's own link for each SOP, typed in Admin (saved with the dashboard settings). Process pages read them without the
// dashboard providers: one request to the same endpoint, or this browser's copy when there is no database.
import { useEffect, useState } from "react";
import { sanitizeSettings } from "./projectProcessValidation";

const LOCAL_KEY = "strategist:project-process:v1";

export function useSopLinks(): Record<string, string> {
  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    const apply = (settings: unknown) => {
      try {
        if (alive) setLinks(sanitizeSettings(settings ?? {}).sopLinks);
      } catch {
        // Unreadable settings: no team links, the references still show.
      }
    };
    fetch("/api/project-process", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { configured?: boolean; settings?: unknown }) => {
        if (json.configured) return apply(json.settings);
        try {
          apply((JSON.parse(window.localStorage.getItem(LOCAL_KEY) ?? "{}") as { settings?: unknown }).settings);
        } catch {
          // Corrupt local copy: nothing to show.
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return links;
}
