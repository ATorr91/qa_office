"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PROJECTS, generateProjectId, type Project, type ProjectStatus } from "@/lib/projects";

const STORAGE_KEY = "qa-office:projects";

interface ProjectsContextValue {
  projects: Project[];
  hydrated: boolean;
  getProject: (id: string) => Project | undefined;
  addProject: (draft: Omit<Project, "id">) => Project;
  updateProject: (id: string, draft: Omit<Project, "id">) => void;
  setStatus: (id: string, status: ProjectStatus) => void;
  removeProject: (id: string) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProjects(JSON.parse(raw));
    } catch {
      // Corrupt or inaccessible storage — fall back to the seed data already in state.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
      // Storage full or unavailable (private browsing) — edits stay in-memory for this session.
    }
  }, [projects, hydrated]);

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      hydrated,
      getProject: (id) => projects.find((p) => p.id === id),
      addProject: (draft) => {
        const id = generateProjectId(draft.name, projects.map((p) => p.id));
        const project: Project = { ...draft, id };
        setProjects((prev) => [project, ...prev]);
        return project;
      },
      updateProject: (id, draft) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...draft, id } : p)));
      },
      setStatus: (id, status) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      },
      removeProject: (id) => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      },
    }),
    [projects, hydrated],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within a ProjectsProvider");
  return ctx;
}
