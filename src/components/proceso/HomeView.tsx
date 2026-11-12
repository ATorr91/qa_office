"use client";

import { useMemo, useState } from "react";
import ExportMenu from "@/components/proceso/ExportMenu";
import { PillarsSection } from "@/components/proceso/OverviewSections";
import TimelineSimulator from "@/components/proceso/TimelineSimulator";
import { usePrintSheet } from "@/components/proceso/usePrintSheet";
import PageContainer from "@/components/site/PageContainer";
import { processToMarkdown } from "@/lib/procesoMarkdown";
import { buildSchedule, clampWeeks, DEFAULT_WEEKS } from "@/lib/procesoSimulator";
import { PROCESS_VERSION } from "@/lib/procesoStages";
import type { StageId } from "@/lib/procesoTypes";
import { mondayOf, todayInMexico } from "@/lib/projectHours";

/** Home of the site: the process in one view. The timeline joins the five stage sites; the dashboard sits next to them in the menu. */
export default function HomeView() {
  const { printMarkdown, sheet } = usePrintSheet();
  const [start, setStart] = useState(() => mondayOf(todayInMexico()));
  const [weeks, setWeeks] = useState<Record<StageId, number>>(DEFAULT_WEEKS);
  const [simWeekRaw, setSimWeek] = useState(1);
  const today = todayInMexico();

  const schedule = useMemo(() => buildSchedule(start, weeks), [start, weeks]);
  const simWeek = Math.min(Math.max(1, simWeekRaw), schedule.totalWeeks);

  return (
    <>
      <div className="print:hidden">
        <PageContainer>
          <div className="bp-anim-page flex flex-col gap-7">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-[var(--bp-ink)]">Proceso de estrategas</h1>
                <p className="mt-1.5 max-w-[60ch] text-[15px] font-semibold leading-snug text-[var(--bp-ink)]">Cinco etapas ágiles, con agentes e IA, y un reporte de aceptación del cliente al cierre de cada una.</p>
                <p className="mt-1 text-[12px] text-[var(--bp-ink-soft)]">{PROCESS_VERSION}</p>
              </div>
              <ExportMenu subject="todo el proceso" filename="proceso-estrategas-borrador" getMarkdown={processToMarkdown} onPdf={printMarkdown} />
            </header>

            <TimelineSimulator
              schedule={schedule}
              start={start}
              onStart={(iso) => setStart(mondayOf(iso))}
              weeks={weeks}
              onWeeks={(id, w) => setWeeks((prev) => ({ ...prev, [id]: clampWeeks(w) }))}
              simWeek={simWeek}
              onSimWeek={setSimWeek}
              onReset={() => {
                setStart(mondayOf(todayInMexico()));
                setWeeks(DEFAULT_WEEKS);
                setSimWeek(1);
              }}
              today={today}
              onPdf={printMarkdown}
            />

            <PillarsSection />
          </div>
        </PageContainer>
      </div>
      {sheet}
    </>
  );
}
