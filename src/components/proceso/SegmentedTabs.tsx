"use client";

import { useRef, type KeyboardEvent } from "react";

export interface SegmentedTab {
  id: string;
  label: string;
}

/** Inline tabs (WAI-ARIA tabs pattern: one tab stop, arrows move between tabs). The panels are rendered by the caller with `panelId`. */
export function SegmentedTabs({ tabs, value, onChange, idPrefix, label }: { tabs: SegmentedTab[]; value: string; onChange: (id: string) => void; idPrefix: string; label: string }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: KeyboardEvent, i: number) {
    const last = tabs.length - 1;
    const next = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="flex flex-nowrap gap-1 overflow-x-auto border-b border-[var(--bp-border)]">
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${t.id}`}
          aria-selected={value === t.id}
          aria-controls={`${idPrefix}-panel-${t.id}`}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
          className={`relative shrink-0 whitespace-nowrap px-3 pb-2 pt-2.5 text-[12px] font-semibold transition-colors duration-[var(--bp-dur-fast)] ${value === t.id ? "text-[var(--bp-blue-600)]" : "text-[var(--bp-ink-soft)] hover:text-[var(--bp-ink)]"}`}
        >
          {t.label}
          {value === t.id && <span aria-hidden className="bp-underline absolute inset-x-2 -bottom-px h-0.5 bg-[var(--bp-blue)]" />}
        </button>
      ))}
    </div>
  );
}

export default SegmentedTabs;
