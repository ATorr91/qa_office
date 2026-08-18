"use client";

import { useEffect, useState } from "react";

export type FeedbackValue = "good" | "bad";

const FEEDBACK_KEY = "qa-office:signal-feedback";
const DISMISSED_KEY = "qa-office:signal-dismissed";

const GOOD_BONUS = 20;
const BAD_PENALTY = 25;

export function useSignalFeedback() {
  const [feedback, setFeedbackState] = useState<Record<string, FeedbackValue>>({});
  const [dismissed, setDismissedState] = useState<string[]>([]);

  useEffect(() => {
    try {
      const rawFeedback = window.localStorage.getItem(FEEDBACK_KEY);
      if (rawFeedback) setFeedbackState(JSON.parse(rawFeedback));
      const rawDismissed = window.localStorage.getItem(DISMISSED_KEY);
      if (rawDismissed) setDismissedState(JSON.parse(rawDismissed));
    } catch {
      // Corrupt or inaccessible storage — start empty.
    }
  }, []);

  function setFeedback(id: string, value: FeedbackValue) {
    setFeedbackState((prev) => {
      const next = { ...prev };
      if (next[id] === value) {
        delete next[id];
      } else {
        next[id] = value;
      }
      try {
        window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function dismiss(id: string) {
    setDismissedState((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return { feedback, dismissed, setFeedback, dismiss };
}

/** Boosts signals marked as a "buena tendencia" and demotes ones marked as low-value. */
export function effectiveHeat(heat: number, value: FeedbackValue | undefined): number {
  if (value === "good") return heat + GOOD_BONUS;
  if (value === "bad") return heat - BAD_PENALTY;
  return heat;
}
