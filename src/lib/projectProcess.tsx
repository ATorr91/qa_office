"use client";

// Client side of the project tracking: reads each project's process data, the dashboard settings, the hours logged in Jira and
// the tool usage; saves what Admin edits. Like the strategist records it uses the database when there is one and falls back to
// this browser's storage when there isn't. Everything refreshes by itself while the tab is visible.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { JiraHoursResult } from "./jiraHoursTypes";
import { sanitizeProjectProcess, sanitizeSettings } from "./projectProcessValidation";
import { EMPTY_PROJECT_PROCESS, EMPTY_SETTINGS, type DashboardSettings, type ProjectProcessData, type ToolUsageRow } from "./projectProcessTypes";
import { STRATEGISTS } from "./strategists";

const LOCAL_KEY = "strategist:project-process:v1";
const LOCAL_USAGE_KEY = "strategist:tool-usage:v1";
const POLL_MS = 60_000;
const HOURS_POLL_MS = 5 * 60_000;
const KNOWN_IDS: ReadonlySet<string> = new Set(STRATEGISTS.map((s) => s.id));

type StorageMode = "loading" | "db" | "local";
type ProjectsState = Record<string, ProjectProcessData>;

interface ProjectProcessContextValue {
  hydrated: boolean;
  storage: StorageMode;
  dbError: string | null;
  saveError: string | null;
  projects: ProjectsState;
  /** A project's data, with every field present even when nothing has been entered. */
  getProject: (projectId: string) => ProjectProcessData;
  saveProject: (projectId: string, data: ProjectProcessData) => Promise<boolean>;
  settings: DashboardSettings;
  saveSettings: (settings: DashboardSettings) => Promise<boolean>;
  /** null until the first answer arrives. */
  jiraHours: JiraHoursResult | null;
  refreshJiraHours: () => void;
  toolUsage: ToolUsageRow[];
  addToolUsage: (rows: Omit<ToolUsageRow, "origin">[]) => Promise<boolean>;
}

const Ctx = createContext<ProjectProcessContextValue | null>(null);

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function sanitizeAll(raw: unknown): ProjectsState {
  const out: ProjectsState = {};
  if (typeof raw !== "object" || raw === null) return out;
  for (const [id, data] of Object.entries(raw)) {
    try {
      out[id] = sanitizeProjectProcess(data, KNOWN_IDS);
    } catch {
      // A stored entry that no longer parses is skipped rather than breaking the whole dashboard.
    }
  }
  return out;
}

async function putJson(body: unknown): Promise<void> {
  const res = await fetch("/api/project-process", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(res.status === 401 ? "Tu sesión de admin venció: vuelve a entrar para guardar." : (json.error ?? `Error ${res.status} al guardar.`));
  }
}

export function ProjectProcessProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectsState>({});
  const [settings, setSettings] = useState<DashboardSettings>(EMPTY_SETTINGS);
  const [storage, setStorage] = useState<StorageMode>("loading");
  const [dbError, setDbError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [jiraHours, setJiraHours] = useState<JiraHoursResult | null>(null);
  const [toolUsage, setToolUsage] = useState<ToolUsageRow[]>([]);
  const saving = useRef(0);

  const load = useCallback(async () => {
    if (saving.current > 0) return;
    try {
      const res = await fetch("/api/project-process", { cache: "no-store" });
      const json = (await res.json()) as { configured: boolean; error?: string; projects?: unknown; settings?: unknown };
      if (json.configured && res.ok) {
        setProjects(sanitizeAll(json.projects));
        try {
          setSettings(sanitizeSettings(json.settings, KNOWN_IDS));
        } catch {
          setSettings(EMPTY_SETTINGS);
        }
        setDbError(null);
        setStorage("db");
        const usage = (await fetch("/api/tool-usage", { cache: "no-store" }).then((r) => r.json()).catch(() => null)) as { rows?: ToolUsageRow[] } | null;
        setToolUsage(usage?.rows ?? []);
        return;
      }
      setDbError(json.configured ? (json.error ?? "No se pudo leer la base de datos.") : null);
    } catch {
      setDbError("No se pudo conectar con el servidor.");
    }
    const local = readLocal<{ projects?: unknown; settings?: unknown }>(LOCAL_KEY, {});
    setProjects(sanitizeAll(local.projects));
    try {
      setSettings(sanitizeSettings(local.settings ?? {}, KNOWN_IDS));
    } catch {
      setSettings(EMPTY_SETTINGS);
    }
    setToolUsage(readLocal<ToolUsageRow[]>(LOCAL_USAGE_KEY, []));
    setStorage("local");
  }, []);

  const refreshJiraHours = useCallback(() => {
    fetch("/api/jira/hours", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: JiraHoursResult) => setJiraHours(json))
      .catch(() => setJiraHours((prev) => prev ?? { configured: true, error: "No se pudo conectar con el servidor de la aplicación.", fetchedAt: new Date(0).toISOString(), since: "", issuesWithWorklogs: 0, lastWorklogDay: null, rows: [], ticketsCreated30d: {} }));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    refreshJiraHours();
    const visible = () => document.visibilityState === "visible";
    const poll = window.setInterval(() => visible() && void load(), POLL_MS);
    const pollHours = window.setInterval(() => visible() && refreshJiraHours(), HOURS_POLL_MS);
    const onVisible = () => visible() && void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(pollHours);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, refreshJiraHours]);

  // In "local" mode every change is mirrored to localStorage; in "db" mode the database is the source of truth.
  useEffect(() => {
    if (storage !== "local") return;
    try {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify({ projects, settings }));
      window.localStorage.setItem(LOCAL_USAGE_KEY, JSON.stringify(toolUsage));
    } catch {
      // Storage full or unavailable: edits stay in memory for this session.
    }
  }, [storage, projects, settings, toolUsage]);

  const guarded = useCallback(
    async (write: () => Promise<void>): Promise<boolean> => {
      saving.current += 1;
      try {
        await write();
        setSaveError(null);
        return true;
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "No se pudo guardar.");
        return false;
      } finally {
        saving.current -= 1;
        // Show what the database actually has (also undoes an optimistic edit that did not land).
        if (storage === "db") void load();
      }
    },
    [storage, load],
  );

  const saveProject = useCallback(
    async (projectId: string, data: ProjectProcessData) => {
      setProjects((prev) => ({ ...prev, [projectId]: data }));
      if (storage !== "db") return true;
      return guarded(() => putJson({ projectId, data }));
    },
    [storage, guarded],
  );

  const saveSettings = useCallback(
    async (next: DashboardSettings) => {
      setSettings(next);
      if (storage !== "db") return true;
      return guarded(() => putJson({ settings: next }));
    },
    [storage, guarded],
  );

  const addToolUsage = useCallback(
    async (rows: Omit<ToolUsageRow, "origin">[]) => {
      if (storage !== "db") {
        setToolUsage((prev) => {
          const keyOf = (r: Omit<ToolUsageRow, "origin">) => `${r.day}|${r.tool}|${r.strategistId}|${r.projectId}`;
          const replaced = new Set(rows.map(keyOf));
          return [...rows.filter((r) => r.units > 0).map((r) => ({ ...r, origin: "manual" })), ...prev.filter((r) => !replaced.has(keyOf(r)))];
        });
        return true;
      }
      return guarded(async () => {
        const res = await fetch("/api/tool-usage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(res.status === 401 ? "Tu sesión de admin venció: vuelve a entrar para guardar." : (json.error ?? `Error ${res.status} al guardar.`));
        }
      });
    },
    [storage, guarded],
  );

  const value = useMemo<ProjectProcessContextValue>(
    () => ({
      hydrated: storage !== "loading",
      storage,
      dbError,
      saveError,
      projects,
      getProject: (projectId) => projects[projectId] ?? EMPTY_PROJECT_PROCESS,
      saveProject,
      settings,
      saveSettings,
      jiraHours,
      refreshJiraHours,
      toolUsage,
      addToolUsage,
    }),
    [storage, dbError, saveError, projects, saveProject, settings, saveSettings, jiraHours, refreshJiraHours, toolUsage, addToolUsage],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProjectProcess() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProjectProcess must be used within a ProjectProcessProvider");
  return ctx;
}
