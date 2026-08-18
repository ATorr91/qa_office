"use client";

import { useState } from "react";
import DashboardPrintableReport from "@/components/dashboard/DashboardPrintableReport";
import BitacorasTab from "@/components/dashboard/tabs/BitacorasTab";
import DeadlinesTab from "@/components/dashboard/tabs/DeadlinesTab";
import NpsTab from "@/components/dashboard/tabs/NpsTab";
import OkrKpiTab from "@/components/dashboard/tabs/OkrKpiTab";
import PeerReviewsTab from "@/components/dashboard/tabs/PeerReviewsTab";
import PerformanceTab from "@/components/dashboard/tabs/PerformanceTab";
import QaTab from "@/components/dashboard/tabs/QaTab";
import SelfAssessmentTab from "@/components/dashboard/tabs/SelfAssessmentTab";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { getPeriodLabel } from "@/lib/strategists";

const TABS = [
  { value: "desempeno", label: "Evaluación de desempeño" },
  { value: "peer", label: "Peer reviews" },
  { value: "okr", label: "Cumplimiento de OKRs y KPIs" },
  { value: "deadlines", label: "Cumplimiento de deadlines" },
  { value: "bitacoras", label: "Cumplimiento de bitácoras" },
  { value: "qa", label: "Calificación QA" },
  { value: "nps", label: "NPS / Feedback del cliente" },
  { value: "autoevaluacion", label: "Autoevaluación guiada" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export default function DashboardEstrategasPage() {
  const [tab, setTab] = useState<Tab>("desempeno");
  const { period, filteredStrategists } = useDashboardFilters();

  return (
    <div className="bp-anim-page flex flex-col gap-5">
      <div className="print:hidden">
        <div>
          <div className="eyebrow" style={{ color: "var(--bp-green)" }}>
            Métricas de Estrategas
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-[var(--bp-ink)]">Panel operativo del equipo</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--bp-ink-soft)]">
            Seguimiento del desempeño, cumplimiento y calidad de trabajo de los {filteredStrategists.length}{" "}
            estrategas del equipo · Periodo: <span className="font-semibold text-[var(--bp-ink)]">{getPeriodLabel(period)}</span>
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-1 border-b border-[var(--bp-border)]">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`bp-tap relative px-3 pb-2.5 text-[13px] font-semibold transition-colors duration-[var(--bp-dur)] ${
                tab === t.value ? "text-[var(--bp-blue)]" : "text-[var(--bp-ink-soft)] hover:text-[var(--bp-ink)]"
              }`}
            >
              {t.label}
              {tab === t.value && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--bp-blue)]" />}
            </button>
          ))}
        </div>

        <div className={`mt-5 ${tab === "desempeno" ? "" : "hidden"}`}>
          <PerformanceTab />
        </div>
        <div className={`mt-5 ${tab === "peer" ? "" : "hidden"}`}>
          <PeerReviewsTab />
        </div>
        <div className={`mt-5 ${tab === "okr" ? "" : "hidden"}`}>
          <OkrKpiTab />
        </div>
        <div className={`mt-5 ${tab === "deadlines" ? "" : "hidden"}`}>
          <DeadlinesTab />
        </div>
        <div className={`mt-5 ${tab === "bitacoras" ? "" : "hidden"}`}>
          <BitacorasTab />
        </div>
        <div className={`mt-5 ${tab === "qa" ? "" : "hidden"}`}>
          <QaTab />
        </div>
        <div className={`mt-5 ${tab === "nps" ? "" : "hidden"}`}>
          <NpsTab />
        </div>
        <div className={`mt-5 ${tab === "autoevaluacion" ? "" : "hidden"}`}>
          <SelfAssessmentTab />
        </div>
      </div>

      <DashboardPrintableReport strategists={filteredStrategists} period={period} />
    </div>
  );
}
