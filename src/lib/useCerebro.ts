"use client";

// Gathers every live source the dashboard already loads and turns it into the executive reading (see cerebro.ts).
import { useMemo } from "react";
import { buildCerebro, type Cerebro, type SourceState } from "./cerebro";
import { useDashboardFilters } from "./dashboardFilters";
import { processMetricsFor } from "./processMetrics";
import { useProjectProcess } from "./projectProcess";
import { useAllEffectiveRecords } from "./strategistRecords";
import { useProjectsView } from "./useProjectsView";

export function useCerebro(): { cerebro: Cerebro; hydrated: boolean; period: string } {
  const { rows, sprint, sprintFailed, today, week } = useProjectsView();
  const { projects, jiraHours, hydrated } = useProjectProcess();
  const { jiraDeadlines, bitacorasSync, externalScores, period } = useDashboardFilters();
  const people = useAllEffectiveRecords();

  const cerebro = useMemo(() => {
    const processById = Object.fromEntries(people.map(({ s }) => [s.id, processMetricsFor(s.id, projects, today)]));
    const state = (name: string, res: { configured?: boolean; error?: string | null } | null, okDetail: string): SourceState => {
      if (res === null) return { name, ok: null, detail: "cargando" };
      if (res.configured === false) return { name, ok: false, detail: "no está configurada" };
      if (res.error) return { name, ok: false, detail: res.error };
      return { name, ok: true, detail: okDetail };
    };
    const sources: SourceState[] = [
      state("Jira (deadlines)", jiraDeadlines, "leyendo"),
      sprintFailed ? { name: "Jira (sprints)", ok: false, detail: "no se pudo leer" } : sprint === null ? { name: "Jira (sprints)", ok: null, detail: "cargando" } : state("Jira (sprints)", sprint, `${sprint.boards.length} tableros`),
      state("Jira (horas)", jiraHours, jiraHours?.lastWorklogDay ? `última hora registrada: ${jiraHours.lastWorklogDay}` : "sin horas registradas todavía"),
      state("Hoja de bitácoras", bitacorasSync, "leyendo"),
      state("QA, NPS y CSAT", externalScores, "leyendo"),
    ];
    return buildCerebro({ rows, people, processById, today, week, sources });
  }, [rows, people, projects, today, week, jiraDeadlines, bitacorasSync, externalScores, jiraHours, sprint, sprintFailed]);

  return { cerebro, hydrated, period };
}
