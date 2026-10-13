// Client-side registry of portal projects shown in the home table.
// There's no backend: everything lives in this browser's localStorage.
import { useEffect, useState } from "react";

export interface PortalProject {
  id: string;
  title: string;
  project: string;
  description: string;
  /** One of OWNERS, or "" when nobody has been assigned yet. */
  owner: string;
  createdAt: number;
  /** The project's web: an external URL (https://…) or an internal route (/ruta). */
  href?: string;
}

/** The only people a project can be assigned to. */
export const OWNERS = ["Alan Torres", "Jorge de Buen", "Camila Mora", "Johanna Quiroga"] as const;

// Projects shipped with the portal (the sections that used to be cards on the home, plus later additions).
// Each one is seeded once into the editable list, so deleting it sticks. `createdAt` is small so they sort
// after user-created projects.
export const SEED_PROJECTS: PortalProject[] = [
  {
    id: "seed-capacitacion",
    href: "/capacitacion",
    title: "Capacitación",
    project: "capacitacion",
    description:
      "Prototipos interactivos LGPSM: modelo 3D, cortina de caracteres con física de viento y sonido generativo, y showroom de lentes en 3D.",
    owner: "",
    createdAt: 3,
  },
  {
    id: "seed-entrega-mvp-template",
    href: "/entrega-mvp-template",
    title: "Entrega del MVP (template)",
    project: "entrega-mvp-template",
    description:
      "Template de la presentación de entrega de un MVP: portada, alcance con checklist por módulo, recorrido y mockups, calidad y arquitectura, documentación, diseño, siguientes pasos y glosario.",
    owner: "",
    createdAt: 2,
  },
  {
    id: "seed-simulador-facturacion-fase3",
    href: "/simulador-facturacion-fase3",
    title: "Simulador de facturación Fase 3",
    project: "CF3",
    description:
      "Simula cómo cambia la entrega de Fase 3 según la fecha en que Cemex decida sobre pagos y facturación: margen, entrega, retraso, línea de tiempo y proyección día a día.",
    owner: "",
    createdAt: 1,
  },
  {
    id: "seed-qa-office",
    href: "/qa-office",
    title: "QA Office",
    project: "qa-office",
    description: "Reportes instantáneos de métricas de QA: proyectos, timelines, bugs por severidad y accionables.",
    owner: "",
    createdAt: 0,
  },
  {
    id: "seed-trend-hunting",
    href: "/estrategas",
    title: "Trend Hunting",
    project: "estrategas",
    description:
      "Radar de tendencias para trend hunting: señales de mercado, tecnología y diseño UX/UI antes de que sean mainstream.",
    owner: "",
    createdAt: -1,
  },
  {
    id: "seed-dashboard-estrategas",
    href: "/dashboard-estrategas",
    title: "Dashboard de Estrategas",
    project: "dashboard-estrategas",
    description:
      "Panel de control para el equipo de estrategas: indicadores y seguimiento del trabajo estratégico en un solo lugar.",
    owner: "",
    createdAt: -2,
  },
  {
    id: "seed-mapa-valor-estrategas",
    href: "/mapa-valor-estrategas",
    title: "Mapa de Valor de Estrategas",
    project: "mapa-valor-estrategas",
    description:
      "Próximamente: visualiza en qué proyectos y cuentas está generando valor cada estratega, y dónde hay oportunidades de crecimiento.",
    owner: "",
    createdAt: -3,
  },
  {
    id: "seed-mapa-valor-servicios",
    href: "/mapa-valor-servicios",
    title: "Mapa de Valor de Servicios",
    project: "mapa-valor-servicios",
    description:
      "Matriz de trazabilidad BUILD, FutureProof y Agentic: qué promete cada servicio, qué tan comprobado está por proyecto y dónde están las brechas.",
    owner: "",
    createdAt: -4,
  },
];

const STORAGE_KEY = "qa-office:portal-projects:v2";
// v1 only held user-created projects; they are carried over into v2 the first time it loads.
const LEGACY_STORAGE_KEY = "qa-office:portal-projects";
// Ids of the seed projects already added to this browser's list, so a seed the user deleted never comes back.
const SEEDED_KEY = "qa-office:portal-projects:seeded";
// Seeds that existed before SEEDED_KEY was introduced: a list saved back then already had them (or the user deleted them).
const ORIGINAL_SEED_IDS = [
  "seed-qa-office",
  "seed-trend-hunting",
  "seed-dashboard-estrategas",
  "seed-mapa-valor-estrategas",
  "seed-mapa-valor-servicios",
];

function readJson<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

function loadProjects(): PortalProject[] {
  try {
    const saved = readJson<PortalProject[]>(STORAGE_KEY);
    const seededIds = new Set(readJson<string[]>(SEEDED_KEY) ?? (saved ? ORIGINAL_SEED_IDS : []));
    const base = saved ?? readJson<PortalProject[]>(LEGACY_STORAGE_KEY) ?? [];
    const known = new Set(base.map((p) => p.id));
    const fresh = SEED_PROJECTS.filter((p) => !seededIds.has(p.id) && !known.has(p.id));
    // Anything saved before the owner list was fixed ("Por asignar", free text) becomes unassigned.
    return [...base, ...fresh].map((p) => ((OWNERS as readonly string[]).includes(p.owner) ? p : { ...p, owner: "" }));
  } catch {
    // Corrupt or inaccessible storage — fall back to the built-in projects.
    return SEED_PROJECTS;
  }
}

/** Projects list persisted in localStorage. `hydrated` flips to true once it has been read on the client. */
export function usePortalProjects() {
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // localStorage only exists on the client, so the list is loaded after mount (keeps SSR markup identical).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects(loadProjects());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      window.localStorage.setItem(SEEDED_KEY, JSON.stringify(SEED_PROJECTS.map((p) => p.id)));
    } catch {
      // Storage full or unavailable — edits stay in memory for this session.
    }
  }, [projects, hydrated]);

  return { projects, setProjects, hydrated };
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Accepts "https://…", an internal "/ruta", or a bare domain ("mi-sitio.vercel.app", which gets https://).
 * Returns null when the text isn't a usable link.
 */
export function normalizeHref(raw: string): string | null {
  const value = raw.trim();
  if (value === "") return null;
  if (value.startsWith("/") && !value.startsWith("//") && !/\s/.test(value)) return value;
  const withScheme = isExternalHref(value) ? value : /^[^\s/]+\.[^\s/]+/.test(value) ? `https://${value}` : null;
  if (!withScheme) return null;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}
