"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import ManualDeadlinesNotice from "@/components/dashboard/ManualDeadlinesNotice";
import Badge, { type BadgeColor } from "@/components/ui/Badge";
import { useDashboardFilters } from "@/lib/dashboardFilters";
import { HEALTH_RULES } from "@/lib/projectHealth";
import { useStrategistRecords } from "@/lib/strategistRecords";
import { STRATEGISTS, type Employment } from "@/lib/strategists";

const listNames = (employment: Employment) => new Intl.ListFormat("es", { style: "long", type: "conjunction" }).format(STRATEGISTS.filter((s) => s.employment === employment).map((s) => s.name));

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
        ? { color: "warning", text: "Solo en este navegador" }
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
      : { color: "warning", text: "Sin sincronizar" };
  };

  const manualSource = "Admin → Captura rápida (Postgres)";
  const adminCta: Cta = { label: "Capturar en Admin", href: ADMIN_HREF, primary: true };

  const cards: MetricCard[] = [
    {
      id: "peer",
      title: "Peer reviews",
      source: manualSource,
      badge: adminBadge,
      measures: "Calificación de 0 a 100 de los pares, con evaluaciones y comentarios.",
      how: "Sin peer review: NA, no cuenta (no es 0).",
      ctas: [adminCta],
    },
    {
      id: "okr",
      title: "OKRs y KPIs",
      source: manualSource,
      badge: adminBadge,
      measures: "Cumplimiento de 0 a 100 por mes, y avance por objetivo.",
      how: "Estado: 72+ en curso, 50+ en riesgo, menos fuera de curso.",
      ctas: [adminCta],
    },
    {
      id: "bitacoras",
      title: "Bitácoras",
      source: `Hoja de Google · pestaña «${sheetTab}»`,
      badge: sheetsBadge,
      measures: "Casilla semanal marcada en la hoja del equipo.",
      how: "Entregadas ÷ esperadas. Solo semanas terminadas desde el 31 de julio de 2026, contadas en el mes en que terminan. Quien no está en la hoja: manual.",
      ctas: [
        ...(sheetUrl ? [{ label: "Hoja de bitácoras", href: sheetUrl, external: true, primary: true }] : []),
        { label: "Fuentes por persona", href: ADMIN_HREF },
      ],
    },
    {
      id: "qa",
      title: "Calificación QA",
      source: "Gmail «[Estatus QA]» · revisión diaria",
      badge: syncBadge("qa"),
      measures: "Pass Rate (Tasa de Aprobación) semanal por proyecto, con % de avance.",
      how: "Promedio del mes. Con 0% de avance no cuenta. Sin reportes: se usa Admin.",
      ctas: [{ label: "Correos en Gmail", href: qaMailUrl, external: true, primary: true }],
    },
    {
      id: "nps",
      title: "NPS / Cliente",
      source: "Figma «Encuesta de Satisfacción de clientes», por proyecto",
      badge: syncBadge("nps"),
      measures: "Respuesta de 1 a 10 a «¿qué tanto nos recomendarías?» y «Calificación ⭐» (promedio de 1 a 5).",
      how: "NPS = % promotores (9-10) − % detractores (0-6) del mes. Percepción del cliente: no entra al desempeño. Páginas solo con captura de pantalla: a mano.",
      ctas: [{ label: "Figma de encuestas", href: figmaUrl, external: true, primary: true }, { label: "Capturar en Admin", href: ADMIN_HREF }],
    },
    {
      id: "csat",
      title: "CSAT",
      source: "Archivo «CUENTAS 2026» · pestaña «CSAT - Respuestas»",
      badge: syncBadge("csat"),
      measures: "Satisfacción por cuenta y mes. Archivo restringido: el panel recibe solo promedios.",
      how: "Promedio del mes. No entra al desempeño.",
      ctas: [{ label: "Ver el tab CSAT", href: "/dashboard-estrategas" }],
    },
    {
      id: "autoevaluacion",
      title: "Autoevaluación",
      source: "Encuesta por correo (solo administración)",
      badge: { color: "info", text: "Autopercepción" },
      measures: "Autocalificación (1 a 5) en deadlines, bitácoras, QA, peer review, OKRs, CSAT y desempeño general.",
      how: "No entra al promedio: se compara con el dato real del mes. Enlace personal, 24 horas, recordatorios.",
      ctas: [{ label: "Abrir el tab", href: "/dashboard-estrategas" }],
    },
    {
      id: "deadlines",
      title: "Deadlines",
      source: "Jira · tablero(s) de cada estratega",
      badge: jiraBadge,
      measures: "Incidencias de Jira con fecha límite (proyectos configurados en Admin).",
      how: "A tiempo: cerrada hasta 1 día después de su fecha límite; abierta con ese día vencido: no cumplida. Menos de 20 incidencias con fecha: «pocos datos». Sin fecha límite no cuentan (se muestran aparte). Quien no usa Jira: captura manual.",
      ctas: [
        ...(jiraUrl ? [{ label: "Abrir Jira", href: jiraUrl, external: true, primary: true }] : []),
        { label: "Configurar tableros", href: ADMIN_HREF },
      ],
    },
    {
      id: "sprint",
      title: "Avance del sprint",
      source: "Jira · sprint activo por proyecto activo (en vivo)",
      badge: jiraBadge,
      measures: "% terminado del sprint en curso, por proyecto y épica, sin acumulado.",
      how: "Tickets Finalizado ÷ tickets del sprint (sin sub-tareas ni épicas) frente al % de días hábiles transcurridos: al día hasta 10 pts por debajo, atrasado hasta 30 pts, en riesgo más allá. Sprint vencido aún activo en Jira: se avisa. Cada minuto.",
      ctas: [...(jiraUrl ? [{ label: "Abrir Jira", href: jiraUrl, external: true, primary: true }] : [])],
    },
    {
      id: "proyectos",
      title: "Proyectos y semáforo de salud",
      source: "Jira (sprint) + Admin → Proyectos y proceso",
      badge: { color: "info", text: "Jira + captura manual" },
      measures: "Etapa (de 5) y salud en cronograma, alcance y finanzas, con alertas por color.",
      how: `Cronograma: sprint vs. calendario (al día verde, atrasado amarillo, en riesgo rojo); reportes sin respuesta tras su fecha límite (amarillo; rojo con más de ${HEALTH_RULES.reportRedAfterDays} días). Alcance: criticidad o bloqueo de severidad alta = rojo; otros bloqueos, riesgos altos, cambios sin aceptar o pendientes vencidos = amarillo. Finanzas: horas vs. tiempo transcurrido (más de ${HEALTH_RULES.hoursGapYellow} puntos = amarillo; más de ${HEALTH_RULES.hoursGapRed} o 100% = rojo); cambios de alcance aceptados (más de ${HEALTH_RULES.scopeChangeYellowPct}% de las horas = amarillo; más de ${HEALTH_RULES.scopeChangeRedPct}% = rojo); pagos (vencido sin facturar = amarillo; sin cobrar más de ${HEALTH_RULES.unpaidRedAfterDays} días = rojo). General = el peor. Sin datos: gris, no cuenta.`,
      ctas: [{ label: "Capturar proyectos", href: `${ADMIN_HREF}#proyectos`, primary: true }, { label: "Ver el proceso", href: "/" }],
    },
    {
      id: "tipos",
      title: "Nómina y proveedores",
      source: "Lista del equipo",
      badge: { color: "success", text: "Fijo en el código" },
      measures: "Nómina o proveedor. Ambos comparten las evaluaciones; los proveedores tendrán métricas adicionales por definir.",
      how: `Nómina: ${listNames("nomina")}. Proveedores: ${listNames("proveedor")}. El filtro «Nómina y proveedores» limita las pestañas a un grupo. Checklist, aceptación a la primera y reportes a tiempo se calculan por persona, pero aún no puntúan.`,
      ctas: [{ label: "Ver el proceso", href: "/", primary: true }],
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
          La «Evaluación de desempeño» promedia peer reviews, OKRs y KPIs, bitácoras, QA y deadlines. NPS y CSAT van aparte. Cada tarjeta indica fuente, cálculo y dónde cambiar el dato.
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
          <li>Promedio simple de las cinco métricas con dato.</li>
          <li>Sin dato no cuenta ni baja el promedio. Sin ninguna: «Sin información disponible».</li>
          <li>Anual: meses con dato desde junio de 2026 (inicio del seguimiento).</li>
          <li>Los datos en vivo (Jira, hoja de bitácoras, correos de QA, Figma) mandan; el manual solo rellena si falta dato en vivo.</li>
          <li>NPS, CSAT y Autoevaluación tienen su propio tab y no entran al promedio.</li>
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
