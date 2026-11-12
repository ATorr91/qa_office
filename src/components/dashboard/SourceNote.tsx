"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";

export type SourceTab = "desempeno" | "peer" | "okr" | "deadlines" | "sprint" | "proyectos" | "bitacoras" | "qa" | "nps" | "csat" | "autoevaluacion" | "historial";

interface SourceLinks {
  bitacorasSheetUrl: string | null;
  jiraUrl: string | null;
  figmaUrl: string;
  qaMailUrl: string;
}

const ADMIN_HREF = "/dashboard-estrategas/admin";
const DOCS_HREF = "/dashboard-estrategas/documentacion";

// One request shared by every tab (they all stay mounted on the dashboard page).
let linksRequest: Promise<SourceLinks | null> | null = null;
function loadLinks(): Promise<SourceLinks | null> {
  linksRequest ??= fetch("/api/dashboard-sources")
    .then((res) => (res.ok ? (res.json() as Promise<SourceLinks>) : null))
    .catch(() => null);
  return linksRequest;
}

interface Note {
  description: string;
  /** What the source is called, shown when there's no link to give (restricted files). */
  sourceName?: string;
  restricted?: boolean;
  links: (links: SourceLinks | null) => { label: string; href: string; external?: boolean }[];
}

const NOTES: Record<SourceTab, Note> = {
  desempeno: {
    description: "Promedio simple de peer review, OKRs y KPIs, deadlines, bitácoras y QA. Sin dato no cuenta. NPS y CSAT van aparte.",
    links: () => [{ label: "Cómo se calcula", href: DOCS_HREF }],
  },
  peer: {
    description: "Calificación de 0 a 100 de los pares en el mes, capturada en Admin. Sin peer review: NA, no cuenta.",
    links: () => [{ label: "Capturar en Admin", href: ADMIN_HREF }],
  },
  okr: {
    description: "OKRs y KPIs de 0 a 100 por mes, con avance por objetivo. Se captura en Admin.",
    links: () => [{ label: "Capturar en Admin", href: ADMIN_HREF }],
  },
  deadlines: {
    description: "Incidencias de Jira con fecha límite. A tiempo: cerrada hasta 1 día después. Sin fecha límite no cuenta (se muestra aparte). En vivo.",
    links: (l) => (l?.jiraUrl ? [{ label: "Abrir Jira", href: l.jiraUrl, external: true }] : []),
  },
  sprint: {
    description: "Sprint activo en Jira por proyecto y épica, solo sus tickets (sin sub-tareas). % terminado frente a % de días hábiles transcurridos. En vivo, cada minuto.",
    links: (l) => (l?.jiraUrl ? [{ label: "Abrir Jira", href: l.jiraUrl, external: true }] : []),
  },
  proyectos: {
    description:
      "Etapa, checklist, reportes, objetivos SMART, hito semanal, riesgos, bloqueos, cambios de alcance, contrato y horas por proyecto. Semáforo: cronograma (sprint de Jira, reportes vencidos), alcance y finanzas (horas, pagos). Lo que no es de Jira se captura en Admin.",
    links: () => [{ label: "Cómo se calcula", href: DOCS_HREF }, { label: "Capturar en Admin", href: ADMIN_HREF + "#proyectos" }],
  },
  bitacoras: {
    description: "Casilla semanal en la hoja de bitácoras; cada semana cuenta en el mes en que termina. En vivo.",
    links: (l) => (l?.bitacorasSheetUrl ? [{ label: "Hoja de bitácoras", href: l.bitacorasSheetUrl, external: true }] : []),
  },
  qa: {
    description: "Promedio del Pass Rate de los correos «[Estatus QA]» semanales por proyecto. Con 0% de avance no cuenta. Revisión diaria.",
    links: (l) => (l ? [{ label: "Correos en Gmail", href: l.qaMailUrl, external: true }] : []),
  },
  nps: {
    description: "Respuesta de 1 a 10 a «¿qué tanto nos recomendarías?» por proyecto. NPS = % promotores (9-10) − % detractores (0-6). Figma, lectura diaria. No entra al desempeño.",
    links: (l) => (l ? [{ label: "Figma de encuestas", href: l.figmaUrl, external: true }] : []),
  },
  csat: {
    description: "Promedio mensual de CSAT por estratega. Archivo sensible: solo promedios, sin clientes ni respuestas. No entra al desempeño.",
    sourceName: "Archivo «CUENTAS 2026» · pestaña «CSAT - Respuestas»",
    restricted: true,
    links: () => [],
  },
  autoevaluacion: {
    description: "Encuesta por correo de autocalificación: 24 horas, recordatorios automáticos. Se compara con las métricas reales. Solo administración la crea y ve respuestas.",
    links: () => [{ label: "Cómo funciona", href: DOCS_HREF }],
  },
  historial: {
    description: "Resumen mensual de todas las métricas; cada pestaña indica su fuente.",
    links: () => [{ label: "Documentación", href: DOCS_HREF }],
  },
};

const LINK_CLASS =
  "bp-tap inline-flex items-center gap-1.5 rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-transparent px-2.5 py-1 text-[12px] font-semibold text-[var(--bp-ink)] transition-all duration-[var(--bp-dur)] ease-[var(--bp-ease)] hover:border-[var(--bp-blue)] active:scale-[0.96]";

/** Short description of where a tab's numbers come from, with a link to the source when it can be shared. */
export function SourceNote({ tab }: { tab: SourceTab }) {
  const [links, setLinks] = useState<SourceLinks | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadLinks().then((l) => {
      if (!cancelled) setLinks(l);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const note = NOTES[tab];
  const items = note.links(links);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--bp-radius-lg)] border border-dashed border-[var(--bp-border)] bg-[var(--bp-surface-alt)] px-4 py-3">
      <div className="min-w-0 flex-1 basis-80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">De dónde sale</span>
          {note.restricted && <Badge color="warning">Acceso restringido</Badge>}
        </div>
        {note.sourceName && <p className="mt-1 text-[12px] font-semibold text-[var(--bp-ink)]">{note.sourceName}</p>}
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--bp-ink-soft)]">{note.description}</p>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((l) =>
            l.external ? (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={LINK_CLASS}>
                {l.label} <span aria-hidden>↗</span>
              </a>
            ) : (
              <Link key={l.label} href={l.href} className={LINK_CLASS}>
                {l.label} <span aria-hidden>→</span>
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default SourceNote;
