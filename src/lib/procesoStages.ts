// Content of the draft "Proceso de Estrategas": 5 stages, the pillars that run through them, how each person is evaluated
// and what the dashboard has to show. It is a DRAFT for the team to correct. Nothing here is measured data: every number
// the dashboard shows still comes from Jira, the sheets or Admin (see strategists.ts). Skill names are the ones installed
// in the team's Claude environment; agents are proposals to build, not things that exist yet.
import type { BrainModule, ChecklistPhase, EvaluationGroup, Pillar, ProcessStage } from "./procesoTypes";
import { build } from "./proceso/stages/build";
import { discovery } from "./proceso/stages/discovery";
import { entrega } from "./proceso/stages/entrega";
import { futureproof } from "./proceso/stages/futureproof";
import { testing } from "./proceso/stages/testing";
import { STRATEGISTS } from "./strategists";

const namesOf = (employment: "nomina" | "proveedor") => STRATEGISTS.filter((s) => s.employment === employment).map((s) => s.name);

export const PROCESS_VERSION = "Borrador v0.1";

export const PILLARS: Pillar[] = [
  {
    name: "Proceso ágil",
    idea: "Ciclos cortos con el cliente dentro. Cada etapa cierra con un reporte aceptado.",
    practices: [
      "Jira como fuente de verdad: épicas por objetivo, avance en «Avance del sprint».",
      "Un hito clave por semana: se define el lunes, se revisa el viernes.",
      "Definition of Done: reporte de aceptación firmado por el cliente.",
      "Todo cambio de alcance se escribe y se acepta antes de ejecutarse.",
      "Bloqueos y riesgos con dueño y fecha desde el día uno.",
      "Apoyo entre estrategas: en su tiempo libre, cada quien puede ayudar a otro a validar detalles. Cómo se pide y se registra: por validar.",
    ],
  },
  {
    name: "Agentización",
    idea: "Lo repetitivo lo hace un agente; la decisión, la persona. Siempre con revisión humana.",
    practices: [
      "Cada agente tiene entrada, salida, dueño y checkpoint humano antes del cliente.",
      "Skills o flujos reutilizables en biblioteca compartida, no uno por proyecto.",
      "El estratega responde por el resultado, lo produzca quien lo produzca.",
      "Empezar por lector de contrato/PRD, secretario de taller y preparador de peer review.",
    ],
  },
  {
    name: "Nueva forma de usar la IA",
    idea: "La IA es herramienta con rol por etapa: Cowork investiga, Claude Code construye la UI.",
    practices: [
      "Cowork investiga, Claude Code hace UI y sitio de entrega, NotebookLM consulta fuentes.",
      "Prompts y fuentes clave van al Drive del proyecto para auditarse.",
      "Toda cifra de investigación lleva fuente y la verifica el estratega.",
      "Definir qué datos del cliente entran a cada herramienta de IA.",
      "El uso de IA se mide para aprender, no para vigilar.",
    ],
  },
];

/** Same structure for every stage's report; the stage-specific criteria are in each stage. */
export const ACCEPTANCE_FORMAT = {
  header: ["Proyecto y código", "Cliente", "Etapa", "Versión y fecha", "Estratega responsable", "Revisor interno (peer review)", "Aceptante del cliente"],
  sections: [
    "Resumen ejecutivo (una página)",
    "Objetivos y resultado de la etapa",
    "Entregables con enlace",
    "Criterios (criterio, evidencia, estado)",
    "Decisiones y quién las tomó",
    "Cambios de alcance: impacto en tiempo y costo",
    "Riesgos, bloqueos y pendientes (dueño, fecha)",
    "Siguientes pasos y fechas",
  ],
  signoff: {
    statuses: ["Aceptado", "Aceptado con observaciones", "No aceptado"],
    fields: ["Observaciones del cliente", "Nombre y cargo", "Fecha", "Firma"],
    reviewWindow: "Revisión del cliente: [N] días hábiles (propuesta: 3). Si no responde: por definir con Comercial y Legal.",
  },
};

export const STAGES: ProcessStage[] = [discovery, build, testing, entrega, futureproof];

/** What the dashboard has to become to be the operation's brain, with an honest read of what exists today. */
const TAB = (label: string, hash: string) => ({ label, href: `/dashboard-estrategas#${hash}` });

export const BRAIN_MODULES: BrainModule[] = [
  {
    name: "Ficha del proyecto",
    what: "Contrato, PRD, Drive, equipo, etapa, decisiones y cambios de alcance.",
    source: "Catálogo de proyectos y Admin → Proyectos y proceso",
    status: "existe",
    where: TAB("Proyectos", "proyectos"),
  },
  {
    name: "Objetivos SMART y su avance",
    what: "Objetivos del business case: línea base, meta, fecha, valor actual.",
    source: "Admin; valor actual manual hasta conectar analítica",
    status: "manual",
    open: "¿Quién actualiza el valor actual y cada cuánto?",
    where: TAB("Proyectos", "proyectos"),
  },
  {
    name: "Timeline en curso y desvíos",
    what: "Avance frente al calendario, con desvíos visibles.",
    source: "Sprint de Jira contra calendario y fechas límite de reportes",
    status: "existe",
    where: TAB("Avance del sprint", "sprint"),
  },
  {
    name: "Hito clave de la semana",
    what: "Un hito por proyecto y semana, y si se cumplió.",
    source: "Admin → Hito semanal; el dashboard avisa si falta",
    status: "manual",
    where: TAB("Proyectos", "proyectos"),
  },
  {
    name: "Alertas de criticidad, bloqueos y riesgos",
    what: "Riesgos con severidad, dueño y fecha; alertas de vencimiento o sprint atrasado.",
    source: "Registro en Admin, señales de Jira y reportes vencidos",
    status: "existe",
    where: TAB("Proyectos", "proyectos"),
  },
  {
    name: "Semáforo de salud del proyecto y del alcance",
    what: "Un color por proyecto: cronograma, alcance y finanzas.",
    source: "Reglas en Documentación; umbrales ajustables",
    status: "existe",
    open: "¿Umbrales correctos: 10 y 25 puntos de horas vs. calendario, reporte atrasado 7 días?",
    where: TAB("Proyectos", "proyectos"),
  },
  {
    name: "Horas ejecutadas frente a asignadas",
    what: "Horas reales contra contratadas y planeadas, por proyecto y persona.",
    source: "Worklogs de Jira; mientras nadie registre, captura manual semanal",
    status: "manual",
    open: "Que el equipo registre tiempo en Jira: reemplazará la captura manual.",
  },
  {
    name: "Porcentaje de ocupación",
    what: "Capacidad semanal comprometida por persona.",
    source: "Horas registradas sobre capacidad; se fija en Admin (40 h por defecto)",
    status: "manual",
    open: "¿Capacidad semanal real de cada persona, sobre todo proveedores?",
  },
  {
    name: "Salud financiera",
    what: "Horas consumidas contra contratadas; facturación y cobro por pago.",
    source: "Contrato en Admin: monto, horas, semanas por etapa, calendario de pagos",
    status: "manual",
    open: "Capturar el contrato de cada proyecto activo; se pueden leer desde Drive.",
    where: TAB("Proyectos", "proyectos"),
  },
  {
    name: "Uso de Claude y de cada herramienta",
    what: "Uso de Claude, Figma, Jira y otras herramientas, por persona.",
    source: "Jira directo (tickets); el resto por Admin o automatización",
    status: "manual",
    open: "Claude y Figma no reportan uso: falta automatización (o token de Figma).",
  },
];

/** Both groups share the dashboard's current evaluations; providers get extra metrics that are still to come. */
export const EVALUATION_GROUPS: EvaluationGroup[] = [
  {
    id: "nomina",
    name: "Estrategas de nómina",
    members: namesOf("nomina"),
    common: [
      "Peer reviews",
      "OKRs y KPIs",
      "Deadlines (Jira)",
      "Bitácoras",
      "Calificación QA",
      "Autoevaluación",
      "Percepción del cliente: NPS y CSAT (se calcula aparte)",
    ],
    extra: [],
    pending: "Sin métricas adicionales por ahora.",
  },
  {
    id: "proveedor",
    name: "Estrategas proveedores",
    members: namesOf("proveedor"),
    common: [
      "Peer reviews",
      "OKRs y KPIs",
      "Deadlines (Jira)",
      "Bitácoras",
      "Calificación QA",
      "Autoevaluación",
      "Percepción del cliente: NPS y CSAT (se calcula aparte)",
    ],
    extra: [],
    pending: "Métricas adicionales de proveedores: por definir.",
  },
];

/** New measures the process creates for everyone. They are computed per person, but none enters the performance score yet. */
export const PROCESS_METRICS: { name: string; how: string }[] = [
  { name: "Cumplimiento del proceso", how: "Checklist completo en las etapas alcanzadas de los proyectos confirmados." },
  { name: "Aceptación a la primera", how: "Reportes aceptados sin observaciones, sobre los ya respondidos." },
  { name: "Reportes a tiempo", how: "Reportes entregados antes de su fecha límite, sobre los entregados o vencidos." },
  { name: "Calidad del trabajo en revisión", how: "Peer reviews de Build, desglosados por etapa («Peer reviews»)." },
  { name: "Adopción de herramientas e IA", how: "Uso de Claude, Figma y demás para compartir prácticas, no penalizar." },
];

export const OPEN_QUESTIONS: string[] = [
  "Nadie registra horas en Jira (último registro: julio): ¿cuándo empiezan?",
  "Jira no guarda capacidad semanal: ¿cuántas horas tiene cada persona? Hoy, 40.",
  "Sin Lucero ni Johanna: Cemex, APAC, PMI y otros sin estratega. ¿Quién los toma?",
  "¿Los contratos están en Drive? Con la carpeta se capturan monto, horas y pagos.",
  "¿Qué métricas adicionales tendrán los proveedores?",
  "¿Checklist, aceptación a la primera y reportes a tiempo entran ya al desempeño?",
  "«Impath»: confirmar nombre y qué mide.",
  "«Check fast de Google»: se asumió PageSpeed Insights.",
  "Apoyo entre estrategas en tiempo libre: ¿qué detalles se validan, cómo se pide y se registra?",
  "Plazo de revisión del cliente y silencio: definir con Comercial y Legal.",
  "¿Qué datos del cliente entran a cada herramienta de IA?",
  "¿Qué proyecto del catálogo es ejemplo de referencia por etapa?",
  "Uso de Claude y Figma en vivo: falta automatización y token de Figma.",
];

export function stageById(id: string): ProcessStage | undefined {
  return STAGES.find((s) => s.id === id);
}

export const CHECKLIST_PHASES: { id: ChecklistPhase; label: string }[] = [
  { id: "principio", label: "Al principio" },
  { id: "despues", label: "Después" },
  { id: "final", label: "Al final" },
];

/** A stage's sub-stages split by phase. `index` is the group's position in `stage.checklist`, which the tick ids are built from. */
export function checklistByPhase(stage: ProcessStage) {
  return CHECKLIST_PHASES.map((p) => ({
    ...p,
    groups: stage.checklist.flatMap((group, index) => (group.phase === p.id ? [{ group, index }] : [])),
  })).filter((p) => p.groups.length > 0);
}

export function checklistTotal(stage: ProcessStage): number {
  return stage.checklist.reduce((n, g) => n + g.items.length, 0);
}
