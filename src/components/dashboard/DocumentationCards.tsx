"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import ManualDeadlinesNotice from "@/components/dashboard/ManualDeadlinesNotice";
import Badge, { type BadgeColor } from "@/components/ui/Badge";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { useStrategistRecords } from "@/lib/strategistRecords";

const ADMIN_HREF = "/dashboard-estrategas/admin";

const CTA_PRIMARY =
  "bg-[var(--bp-blue)] text-white hover:bg-[var(--bp-blue-600)] hover:shadow-[var(--bp-shadow-blue)] hover:-translate-y-px";
const CTA_OUTLINE = "bg-transparent text-[var(--bp-ink)] border-[var(--bp-border)] hover:border-[var(--bp-blue)]";

interface Cta {
  label: string;
  href: string;
  /** External links open in a new tab. */
  external?: boolean;
  primary?: boolean;
}

function CtaLink({ cta }: { cta: Cta }) {
  const className = `bp-tap inline-flex items-center gap-1.5 rounded-[var(--bp-radius-sm)] border px-2.5 py-1 text-[12px] font-semibold transition-all duration-[var(--bp-dur)] ease-[var(--bp-ease)] active:scale-[0.96] ${
    cta.primary ? `border-transparent ${CTA_PRIMARY}` : CTA_OUTLINE
  }`;
  return cta.external ? (
    <a href={cta.href} target="_blank" rel="noreferrer" className={className}>
      {cta.label} <span aria-hidden>↗</span>
    </a>
  ) : (
    <Link href={cta.href} className={className}>
      {cta.label} <span aria-hidden>→</span>
    </Link>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">{label}</dt>
      <dd className="mt-0.5 text-[12px] leading-relaxed text-[var(--bp-ink)]">{children}</dd>
    </div>
  );
}

interface MetricCard {
  id: string;
  title: string;
  /** Where the number comes from. */
  source: string;
  badge: { color: BadgeColor; text: string };
  measures: string;
  how: string;
  ctas: Cta[];
}

export function DocumentationCards({
  sheetUrl,
  sheetTab,
  jiraUrl,
  figmaUrl,
  qaMailUrl,
}: {
  sheetUrl: string | null;
  sheetTab: string;
  jiraUrl: string | null;
  figmaUrl: string;
  qaMailUrl: string;
}) {
  const { jiraDeadlines, bitacorasSync, externalScores } = useDashboardFilters();
  const { storage } = useStrategistRecords();

  const adminBadge: { color: BadgeColor; text: string } =
    storage === "db"
      ? { color: "success", text: "Base de datos conectada" }
      : storage === "local"
        ? { color: "warning", text: "Guardado solo en este navegador" }
        : { color: "neutral", text: "Cargando…" };

  const sheetsBadge: { color: BadgeColor; text: string } = !bitacorasSync
    ? { color: "neutral", text: "Conectando…" }
    : !bitacorasSync.configured
      ? { color: "warning", text: "Sin configurar" }
      : bitacorasSync.error
        ? { color: "danger", text: "Error de conexión" }
        : { color: "success", text: `Conectada · sync ${new Date(bitacorasSync.fetchedAt).toLocaleTimeString("es-MX", { timeStyle: "short" })}` };

  const jiraBadge: { color: BadgeColor; text: string } = !jiraDeadlines
    ? { color: "neutral", text: "Conectando…" }
    : !jiraDeadlines.configured
      ? { color: "warning", text: "Sin configurar" }
      : jiraDeadlines.error
        ? { color: "danger", text: "Error de conexión" }
        : { color: "success", text: `Conectado · sync ${new Date(jiraDeadlines.fetchedAt).toLocaleTimeString("es-MX", { timeStyle: "short" })}` };

  // QA, NPS and CSAT arrive through automations; "synced" means the latest data landed in the database.
  const syncBadge = (source: "qa" | "nps" | "csat"): { color: BadgeColor; text: string } => {
    if (!externalScores) return { color: "neutral", text: "Conectando…" };
    if (!externalScores.configured) return { color: "warning", text: "Sin base de datos" };
    if (externalScores.error) return { color: "danger", text: "Error de conexión" };
    const last = externalScores.lastSync[source];
    return last
      ? { color: "success", text: `Sincronizado · ${new Date(last).toLocaleDateString("es-MX", { dateStyle: "medium" })}` }
      : { color: "warning", text: "Esperando primera sincronización" };
  };

  const manualSource = "Admin → Captura rápida (Postgres)";
  const adminCta: Cta = { label: "Capturar en Admin", href: ADMIN_HREF, primary: true };

  const cards: MetricCard[] = [
    {
      id: "peer",
      title: "Peer reviews",
      source: manualSource,
      badge: adminBadge,
      measures: "Calificación de 0 a 100 que recibe cada estratega de sus pares en el mes, más el número de evaluaciones y los comentarios.",
      how: "Cada mes capturado entra al promedio; un mes sin peer review se muestra como NA y no cuenta en la evaluación (no se toma como 0).",
      ctas: [adminCta],
    },
    {
      id: "okr",
      title: "OKRs y KPIs",
      source: manualSource,
      badge: adminBadge,
      measures: "Un solo cumplimiento de OKRs y KPIs de 0 a 100 por mes, más la lista de objetivos con su avance y estado.",
      how: "Es una sola métrica dentro del promedio. El estado del OKR sale del avance: 72+ en curso, 50+ en riesgo, menos fuera de curso.",
      ctas: [adminCta],
    },
    {
      id: "bitacoras",
      title: "Bitácoras",
      source: `Hoja de Google · pestaña «${sheetTab}»`,
      badge: sheetsBadge,
      measures: "Si cada estratega registró su bitácora semanal: una casilla marcada por semana en la hoja compartida del equipo.",
      how: "Bitácoras entregadas ÷ esperadas. Solo cuentan semanas ya terminadas y desde el 31 de julio de 2026; cada semana cuenta en el mes en que termina. Quien no está en la hoja se captura a mano.",
      ctas: [
        ...(sheetUrl ? [{ label: "Abrir la hoja de bitácoras", href: sheetUrl, external: true, primary: true }] : []),
        { label: "Fuentes por persona", href: ADMIN_HREF },
      ],
    },
    {
      id: "qa",
      title: "Calificación QA",
      source: "Correos «[Estatus QA]» de Gmail · se revisan a diario",
      badge: syncBadge("qa"),
      measures: "La Tasa de Aprobación (Pass Rate) que QA reporta cada semana por proyecto, con su porcentaje de avance y su estatus (a tiempo, en riesgo o atrasado).",
      how: "Promedio de los Pass Rate de los reportes del mes en las cuentas de cada estratega. Un reporte sin pruebas ejecutadas (0% de avance) no cuenta. Si un mes no tiene reportes, se usa lo capturado en Admin.",
      ctas: [{ label: "Ver los correos en Gmail", href: qaMailUrl, external: true, primary: true }],
    },
    {
      id: "nps",
      title: "NPS / Cliente",
      source: "Figma · archivo «Encuesta de Satisfacción de clientes», una página por proyecto",
      badge: syncBadge("nps"),
      measures: "La respuesta de 1 a 10 a «¿qué tanto nos recomendarías?» de cada encuesta, y su «Calificación ⭐» (promedio de las respuestas de 1 a 5).",
      how: "NPS = % de promotores (9-10) − % de detractores (0-6) de las encuestas del mes en las cuentas del estratega; es una vista aparte de cómo percibe el cliente el trabajo y no entra al promedio de desempeño. Las páginas que son solo una captura de pantalla se registran a mano.",
      ctas: [{ label: "Abrir el Figma de encuestas", href: figmaUrl, external: true, primary: true }, { label: "Capturar en Admin", href: ADMIN_HREF }],
    },
    {
      id: "csat",
      title: "CSAT",
      source: "Archivo «CUENTAS 2026» · pestaña «CSAT - Respuestas»",
      badge: syncBadge("csat"),
      measures: "La satisfacción de los clientes por cuenta y por mes. El archivo es sensible y de acceso restringido: el panel solo recibe el promedio mensual por cuenta, nunca los clientes ni las respuestas individuales.",
      how: "Promedio de las respuestas del mes en las cuentas de cada estratega. Es una vista aparte de cómo percibe el cliente el trabajo y no entra al promedio de desempeño.",
      ctas: [{ label: "Ver el tab CSAT", href: "/dashboard-estrategas" }],
    },
    {
      id: "autoevaluacion",
      title: "Autoevaluación",
      source: "Encuesta por correo · se crea y se sigue en el tab Autoevaluación (solo administración)",
      badge: { color: "info", text: "Percepción del propio estratega" },
      measures: "Cómo se califica cada estratega a sí mismo (1 a 5) en deadlines, bitácoras, QA, peer review, OKRs, CSAT y desempeño general, más sus respuestas abiertas.",
      how: "No entra al promedio de desempeño: se compara con el dato real del mismo mes para ver quién se percibe mejor o peor de lo que muestran las métricas. Cada encuesta se manda con un enlace personal, dura 24 horas por defecto, manda recordatorios a quien no responde y puede repetirse cada mes.",
      ctas: [{ label: "Abrir el tab", href: "/dashboard-estrategas" }],
    },
    {
      id: "deadlines",
      title: "Deadlines",
      source: "Jira · tablero(s) de cada estratega",
      badge: jiraBadge,
      measures: "Incidencias asignadas a cada estratega con fecha límite, en los proyectos de Jira que se configuran en Admin.",
      how: "A tiempo = cerrada el día de su fecha límite o antes; abierta y ya vencida cuenta como no cumplida. Las incidencias sin fecha límite no cuentan (se muestran aparte). Quien no usa Jira se captura a mano: ver el aviso de arriba.",
      ctas: [
        ...(jiraUrl ? [{ label: "Abrir Jira", href: jiraUrl, external: true, primary: true }] : []),
        { label: "Configurar tableros", href: ADMIN_HREF },
      ],
    },
  ];

  return (
    <div className="bp-anim-page flex flex-col gap-5">
      <div>
        <div className="eyebrow" style={{ color: "var(--bp-green)" }}>
          Documentación
        </div>
        <h1 className="mt-1.5 text-2xl font-bold text-[var(--bp-ink)]">De dónde sale cada calificación</h1>
        <p className="mt-1 max-w-3xl text-[13px] text-[var(--bp-ink-soft)]">
          La «Evaluación de desempeño» de cada estratega es el promedio de cinco métricas de ejecución (peer reviews, OKRs y KPIs, bitácoras, QA y deadlines). NPS y CSAT se evalúan aparte, como visibilidad de lo que opina el cliente. Aquí está de dónde viene cada una, cómo se
          calcula y a dónde ir para ver o cambiar el dato.
        </p>
      </div>

      <ManualDeadlinesNotice />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c, i) => (
          <article
            key={c.id}
            className="bp-row-in flex flex-col gap-3 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[14px] font-semibold text-[var(--bp-ink)]">{c.title}</h2>
              <Badge color={c.badge.color}>{c.badge.text}</Badge>
            </div>
            <dl className="flex flex-1 flex-col gap-2.5">
              <Row label="Fuente">{c.source}</Row>
              <Row label="Qué mide">{c.measures}</Row>
              <Row label="Cómo entra al promedio">{c.how}</Row>
            </dl>
            <div className="flex flex-wrap gap-2 pt-1">
              {c.ctas.map((cta) => (
                <CtaLink key={cta.label} cta={cta} />
              ))}
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
        <h2 className="text-[14px] font-semibold text-[var(--bp-ink)]">Cómo se calcula el promedio</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[12px] leading-relaxed text-[var(--bp-ink)]">
          <li>Promedio simple de las métricas que sí tienen dato: peer review, OKRs y KPIs, deadlines, bitácoras y QA.</li>
          <li>Una métrica sin dato no cuenta y no baja el promedio. Si no hay ninguna, se muestra «Sin información disponible».</li>
          <li>En el periodo anual se combinan los meses con dato desde julio de 2026, que es cuando empezó el seguimiento.</li>
          <li>Los datos en vivo (Jira, la hoja de bitácoras, los correos de QA y las encuestas de Figma) siempre mandan; un valor manual solo se usa cuando la fuente en vivo no tiene dato o la persona no la usa.</li>
          <li>NPS y CSAT se muestran en sus propios tabs, en el grupo «Percepción del cliente», y la Autoevaluación en el suyo: ninguno entra a este promedio.</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <CtaLink cta={{ label: "Ver el panel", href: "/dashboard-estrategas", primary: true }} />
          <CtaLink cta={{ label: "Ir a Admin", href: ADMIN_HREF }} />
        </div>
      </section>
    </div>
  );
}

export default DocumentationCards;
