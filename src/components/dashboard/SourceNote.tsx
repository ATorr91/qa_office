"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";

export type SourceTab = "desempeno" | "peer" | "okr" | "deadlines" | "sprint" | "bitacoras" | "qa" | "nps" | "csat" | "autoevaluacion" | "historial";

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
    description:
      "Promedio simple de las métricas de ejecución que sí tienen dato de cada estratega: peer review, OKRs y KPIs, deadlines, bitácoras y QA. Una métrica sin dato no cuenta ni baja el promedio. NPS y CSAT se evalúan aparte.",
    links: () => [{ label: "Cómo se calcula", href: DOCS_HREF }],
  },
  peer: {
    description:
      "Calificación de 0 a 100 que cada estratega recibe de sus pares en el mes. Se captura a mano en la sección Admin. Los meses sin peer review se muestran como NA y no cuentan en la evaluación.",
    links: () => [{ label: "Capturar en Admin", href: ADMIN_HREF }],
  },
  okr: {
    description: "Cumplimiento de OKRs y KPIs de 0 a 100 por mes, más el avance de cada objetivo. Se captura a mano en la sección Admin.",
    links: () => [{ label: "Capturar en Admin", href: ADMIN_HREF }],
  },
  deadlines: {
    description:
      "Incidencias con fecha límite asignadas a cada estratega en Jira. Cuenta como a tiempo la que se cierra hasta 1 día después de su fecha límite; las que no tienen fecha límite no cuentan y se muestran aparte. Se consulta en vivo cada vez que abres el panel.",
    links: (l) => (l?.jiraUrl ? [{ label: "Abrir Jira", href: l.jiraUrl, external: true }] : []),
  },
  sprint: {
    description:
      "Avance del sprint que está corriendo hoy en el tablero de Jira de cada proyecto activo: solo los tickets de ese sprint (sin sub-tareas y sin lo acumulado de sprints anteriores), por proyecto y por épica. Se compara el % terminado con el % de días hábiles del sprint que ya pasaron, para saber si va al día. Se lee en vivo y se actualiza solo cada minuto.",
    links: (l) => (l?.jiraUrl ? [{ label: "Abrir Jira", href: l.jiraUrl, external: true }] : []),
  },
  bitacoras: {
    description:
      "Casilla semanal marcada en la hoja de bitácoras del equipo; cada semana cuenta en el mes en que termina. Se consulta en vivo cada vez que abres el panel.",
    links: (l) => (l?.bitacorasSheetUrl ? [{ label: "Abrir la hoja de bitácoras", href: l.bitacorasSheetUrl, external: true }] : []),
  },
  qa: {
    description:
      "Promedio de la Tasa de Aprobación (Pass Rate) de los correos «[Estatus QA]» que QA envía cada semana por proyecto. Un reporte sin pruebas ejecutadas (0% de avance) no cuenta. Se revisa a diario y se actualiza solo.",
    links: (l) => (l ? [{ label: "Ver los correos en Gmail", href: l.qaMailUrl, external: true }] : []),
  },
  nps: {
    description:
      "Respuesta de 1 a 10 a «¿qué tanto nos recomendarías?» en la encuesta de satisfacción de cada proyecto. NPS = % de promotores (9-10) − % de detractores (0-6). El archivo de Figma se lee a diario. Es una vista de cómo percibe el cliente el trabajo: no entra al promedio de desempeño.",
    links: (l) => (l ? [{ label: "Abrir el Figma de encuestas", href: l.figmaUrl, external: true }] : []),
  },
  csat: {
    description:
      "Promedio mensual de las respuestas de CSAT de las cuentas de cada estratega. El archivo contiene información sensible y tiene acceso restringido, por eso aquí solo se muestran promedios, sin clientes ni respuestas individuales. No entra al promedio de desempeño.",
    sourceName: "Archivo «CUENTAS 2026» · pestaña «CSAT - Respuestas»",
    restricted: true,
    links: () => [],
  },
  autoevaluacion: {
    description:
      "Encuesta que cada estratega recibe en su correo para calificarse a sí mismo, con 24 horas para responder, recordatorios automáticos y cierre al terminar el plazo. Sus respuestas se comparan con las métricas reales para ver cómo se perciben. Solo administración puede crear encuestas y ver respuestas.",
    links: () => [{ label: "Cómo funciona", href: DOCS_HREF }],
  },
  historial: {
    description: "Resumen mes a mes de todas las métricas. Cada columna viene de la fuente que se indica en su pestaña.",
    links: () => [{ label: "Ver documentación", href: DOCS_HREF }],
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
