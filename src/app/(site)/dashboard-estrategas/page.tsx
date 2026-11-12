"use client";

import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import DashboardPrintableReport from "@/components/dashboard/DashboardPrintableReport";
import SourceNote, { type SourceTab } from "@/components/dashboard/SourceNote";
import AutoevaluacionTab from "@/components/dashboard/tabs/AutoevaluacionTab";
import BitacorasTab from "@/components/dashboard/tabs/BitacorasTab";
import CsatTab from "@/components/dashboard/tabs/CsatTab";
import DeadlinesTab from "@/components/dashboard/tabs/DeadlinesTab";
import HistoryTab from "@/components/dashboard/tabs/HistoryTab";
import NpsTab from "@/components/dashboard/tabs/NpsTab";
import OkrKpiTab from "@/components/dashboard/tabs/OkrKpiTab";
import PeerReviewsTab from "@/components/dashboard/tabs/PeerReviewsTab";
import PerformanceTab from "@/components/dashboard/tabs/PerformanceTab";
import QaTab from "@/components/dashboard/tabs/QaTab";
import ProyectosTab from "@/components/dashboard/tabs/ProyectosTab";
import SprintProgressTab from "@/components/dashboard/tabs/SprintProgressTab";
import { useDashboardFilters } from "@/lib/dashboardFilters";

const TABS = [
  { value: "desempeno", label: "Desempeño" },
  { value: "peer", label: "Peer reviews" },
  { value: "okr", label: "OKRs y KPIs" },
  { value: "deadlines", label: "Deadlines" },
  { value: "sprint", label: "Avance del sprint" },
  { value: "proyectos", label: "Proyectos" },
  { value: "bitacoras", label: "Bitácoras" },
  { value: "qa", label: "Calificación QA" },
  { value: "autoevaluacion", label: "Autoevaluación" },
  { value: "historial", label: "Historial" },
  { value: "nps", label: "NPS / Cliente" },
  { value: "csat", label: "CSAT" },
] as const;

type Tab = (typeof TABS)[number]["value"];

const LIVE_TABS: ReadonlySet<Tab> = new Set<Tab>(["autoevaluacion", "sprint", "proyectos"]);

// Every tab starts with a note saying where its numbers come from. All panels stay mounted so switching tabs is instant.
const PANELS: { value: Tab; Component: () => React.JSX.Element | null }[] = [
  { value: "desempeno", Component: PerformanceTab },
  { value: "peer", Component: PeerReviewsTab },
  { value: "okr", Component: OkrKpiTab },
  { value: "deadlines", Component: DeadlinesTab },
  { value: "sprint", Component: SprintProgressTab },
  { value: "proyectos", Component: ProyectosTab },
  { value: "bitacoras", Component: BitacorasTab },
  { value: "qa", Component: QaTab },
  { value: "nps", Component: NpsTab },
  { value: "csat", Component: CsatTab },
  { value: "autoevaluacion", Component: AutoevaluacionTab },
  { value: "historial", Component: HistoryTab },
];

/** The performance evaluation sits on the left of the tab bar; the client-perception views (NPS, CSAT) are scored separately and pushed to the right. */
function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <span aria-hidden className="mb-2 ml-auto mr-2 h-4 w-px shrink-0 self-end bg-[var(--bp-border)]" />
      <span className="shrink-0 self-end whitespace-nowrap pb-2 pr-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--bp-ink-soft)]">{children}</span>
    </>
  );
}

export default function DashboardEstrategasPage() {
  const [tab, setTab] = useState<Tab>("desempeno");
  const { period, filteredStrategists } = useDashboardFilters();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  // The tab lives in the URL hash (#nps), so a refresh, the back button or a shared link opens the same tab.
  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      const found = TABS.find((t) => t.value === hash);
      if (found) setTab(found.value);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function selectTab(value: Tab, focus = false) {
    setTab(value);
    window.history.replaceState(null, "", `#${value}`);
    if (focus) tabRefs.current[value]?.focus();
  }

  // Arrow keys, Home and End move between tabs (the tab bar is one tab stop, as in the WAI-ARIA tabs pattern).
  function onTabKeyDown(e: KeyboardEvent, index: number) {
    const last = TABS.length - 1;
    const next = e.key === "ArrowRight" ? (index === last ? 0 : index + 1) : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    selectTab(TABS[next].value, true);
  }

  return (
    <div className="bp-anim-page flex flex-col gap-5">
      <div className="print:hidden">
        <div>
          <div className="eyebrow" style={{ color: "var(--bp-green)" }}>
            Métricas de Estrategas
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-[var(--bp-ink)]">Panel operativo del equipo</h1>
        </div>

        <div role="tablist" aria-label="Secciones del panel" className="mt-5 flex flex-nowrap gap-0.5 overflow-x-auto border-b border-[var(--bp-border)]">
          {TABS.map((t, i) => (
            <Fragment key={t.value}>
              {t.value === "nps" && <GroupLabel>Percepción del cliente</GroupLabel>}
            <button
              ref={(el) => {
                tabRefs.current[t.value] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.value}`}
              aria-selected={tab === t.value}
              aria-controls={`panel-${t.value}`}
              tabIndex={tab === t.value ? 0 : -1}
              onClick={() => selectTab(t.value)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`bp-tap relative shrink-0 whitespace-nowrap px-2 pb-2 text-[11px] font-semibold transition-colors duration-[var(--bp-dur)] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bp-blue)] ${
                tab === t.value ? "text-[var(--bp-blue)]" : "text-[var(--bp-ink-soft)] hover:text-[var(--bp-ink)]"
              }`}
            >
              {t.label}
              {tab === t.value && <span className="bp-underline absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--bp-blue)]" />}
            </button>
            </Fragment>
          ))}
        </div>

        {PANELS.map(({ value, Component }) => (
          <div key={value} role="tabpanel" id={`panel-${value}`} aria-labelledby={`tab-${value}`} className={`mt-5 ${tab === value ? "bp-row-in flex flex-col gap-4" : "hidden"}`}>
            <SourceNote tab={value as SourceTab} />
            {/* Autoevaluación (admin-only data) and the tabs that poll live data (Jira, projects, hours, tools) only mount while they are the open tab. */}
            {(!LIVE_TABS.has(value) || tab === value) && <Component />}
          </div>
        ))}
      </div>

      <DashboardPrintableReport strategists={filteredStrategists} period={period} />
    </div>
  );
}
