"use client";

// One row per catalog project with everything the dashboard needs to judge it: its process data, owners, Jira sprint, hours
// and the traffic light. Shared by the Proyectos tab and the project detail so both always agree.
import { useMemo } from "react";
import type { SprintBoardResult, SprintProgressResult } from "./jiraSprintTypes";
import { PROJECT_CATALOG, ownersOfProject, projectIdOf, type CatalogProject } from "./projectCatalog";
import { projectHealth, type ProjectHealth } from "./projectHealth";
import { buildHours, mondayOf, todayInMexico, type HoursModel } from "./projectHours";
import { useProjectProcess } from "./projectProcess";
import type { ProjectProcessData } from "./projectProcessTypes";
import { checklistProgress, hasProcessData } from "./processMetrics";
import { useSprintProgress } from "./useSprintProgress";

export interface ProjectRow {
  id: string;
  project: CatalogProject;
  data: ProjectProcessData;
  tracked: boolean;
  owners: string[];
  boards: SprintBoardResult[];
  hours: number;
  health: ProjectHealth;
  checklist: { done: number; total: number };
}

export interface ProjectsView {
  rows: ProjectRow[];
  hours: HoursModel;
  sprint: SprintProgressResult | null;
  sprintFailed: boolean;
  today: string;
  week: string;
}

export function useProjectsView(): ProjectsView {
  const { projects, getProject, jiraHours } = useProjectProcess();
  const { data: sprint, failed: sprintFailed } = useSprintProgress();
  const today = todayInMexico();
  const week = mondayOf(today);

  const hours = useMemo(() => buildHours(jiraHours, projects), [jiraHours, projects]);

  const rows = useMemo<ProjectRow[]>(
    () =>
      PROJECT_CATALOG.map((project) => {
        const id = projectIdOf(project);
        const data = getProject(id);
        const owners = ownersOfProject(project);
        const boards = (sprint?.boards ?? []).filter((b) => project.jiraKeys.includes(b.key));
        const projectHours = hours.projectTotal[id] ?? 0;
        return {
          id,
          project,
          data,
          tracked: hasProcessData(data),
          owners,
          boards,
          hours: projectHours,
          health: projectHealth({ project, data, boards, hours: projectHours, owners, today, week }),
          checklist: checklistProgress(data),
        };
      }),
    [getProject, sprint, hours, today, week],
  );

  return { rows, hours, sprint, sprintFailed, today, week };
}
