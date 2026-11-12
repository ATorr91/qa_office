// Builds the whole draft as one Markdown document, from the same data the page shows, so it can be pasted into Drive,
// NotebookLM or an email without a second copy to keep in sync.
import {
  ACCEPTANCE_FORMAT,
  BRAIN_MODULES,
  checklistByPhase,
  EVALUATION_GROUPS,
  OPEN_QUESTIONS,
  PILLARS,
  PROCESS_METRICS,
  PROCESS_VERSION,
  STAGES,
} from "./procesoStages";
import { ioOf } from "./procesoIo";
import { dayWithYear, type Schedule } from "./procesoSimulator";
import type { ProcessStage, SignalStatus, StageFile } from "./procesoTypes";

export const SIGNAL_STATUS_LABEL: Record<SignalStatus, string> = {
  existe: "Ya existe",
  "por-integrar": "Por integrar",
  manual: "Captura manual",
};

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
const numbered = (items: string[]) => items.map((s, i) => `${i + 1}. ${s}`).join("\n");

const fileRows = (files: StageFile[], stageName: (id: string) => string) =>
  files.map((f) => `| ${f.name} | ${f.format} | ${f.where}${f.from ? ` (viene de ${stageName(f.from)})` : ""}${f.usedIn?.length ? ` (lo usa ${f.usedIn.map(stageName).join(", ")})` : ""} | ${f.note ?? ""} |`);

export function stageToMarkdown(stage: ProcessStage): string {
  const out: string[] = [`## ${stage.number}. ${stage.name}${stage.service ? ` (servicio ${stage.service})` : ""}`, "", `**Objetivo:** ${stage.goal}`, "", ...stage.summary.flatMap((p) => [p, ""]), `**Ritmo ágil propuesto:** ${stage.rhythm}`, ""];

  out.push("### Checklist", "");
  for (const phase of checklistByPhase(stage)) {
    out.push(`#### ${phase.label}`, "");
    for (const { group } of phase.groups) out.push(`**${group.title}**`, "", ...group.items.map((i) => `- [ ] ${i}`), "");
  }

  const stageName = (id: string) => STAGES.find((s) => s.id === id)?.name ?? id;
  const { inputs, outputs } = ioOf(stage);
  out.push("### Archivos de entrada", "", "| Archivo | Formato | Quién lo da | Para qué |", "| --- | --- | --- | --- |", ...fileRows(inputs, stageName), "");
  out.push("### Archivos de salida", "", "| Archivo | Formato | Dónde queda y quién lo recibe | Qué contiene |", "| --- | --- | --- | --- |", ...fileRows(outputs, stageName), "");

  out.push(`### Documento de entrega: ${stage.deliverable.title}`, "", "Incluye:", "", list(stage.deliverable.contents), "", "Criterios de aceptación:", "");
  out.push("| Criterio | Evidencia | Estado |", "| --- | --- | --- |", ...stage.deliverable.criteria.map((c) => `| ${c.criterion} | ${c.evidence} | ☐ |`), "");

  if (stage.parallel) out.push(`### En paralelo: ${stage.parallel.title}`, "", list(stage.parallel.points), "");

  out.push("### Herramientas", "", ...stage.tools.map((t) => `- **${t.name}**: ${t.use}`), "");
  out.push("### Skills de Claude", "", ...stage.skills.map((s) => `- \`${s.name}\`: ${s.use}`), "");
  out.push("### Agentes propuestos", "", ...stage.agents.map((a) => `- **${a.name}**: ${a.does} _Revisión humana: ${a.humanCheck}_`), "");
  out.push("### SOPs", "");
  for (const sop of stage.sops) out.push(`**${sop.title}** (responsable: ${sop.owner})`, "", numbered(sop.steps), "");
  out.push("### Tips", "", list(stage.tips), "");
  out.push("### Ejemplos", "", ...stage.examples.map((e) => `- **${e.title}**${e.href ? ` (${e.href})` : ""}${e.status === "candidato" ? " [candidato]" : e.status === "por-elegir" || !e.href ? " [por elegir]" : ""}: ${e.note}`), "");
  return out.join("\n");
}

export function processToMarkdown(): string {
  const out: string[] = [
    `# Nuevo proceso de estrategas · ${PROCESS_VERSION}`,
    "",
    "Borrador para revisión del equipo. Cinco etapas (Discovery, Build, Testing, Entrega y FutureProof), cada una con su checklist y su documento de entrega con formato de aceptación del cliente.",
    "",
    "## Los tres pilares",
    "",
  ];
  for (const p of PILLARS) out.push(`### ${p.name}`, "", p.idea, "", list(p.practices), "");

  out.push("## Formato de aceptación del cliente (igual en las 5 etapas)", "", "**Encabezado:**", "", list(ACCEPTANCE_FORMAT.header), "", "**Secciones:**", "", numbered(ACCEPTANCE_FORMAT.sections), "");
  out.push("**Registro de aceptación:**", "", `- Estado: ${ACCEPTANCE_FORMAT.signoff.statuses.map((s) => `☐ ${s}`).join("  ")}`, ...ACCEPTANCE_FORMAT.signoff.fields.map((f) => `- ${f}: ________`), "", ACCEPTANCE_FORMAT.signoff.reviewWindow, "");

  for (const stage of STAGES) out.push(stageToMarkdown(stage));

  out.push("## Evaluación de estrategas", "");
  for (const g of EVALUATION_GROUPS) out.push(`### ${g.name}`, "", `Integrantes: ${g.members.join(", ")}`, "", "Evaluaciones del dashboard que comparten:", "", list(g.common), "", ...(g.extra.length > 0 ? ["Adicionales:", "", list(g.extra), ""] : []), ...(g.pending ? [`_${g.pending}_`, ""] : []));
  out.push("### Medidas nuevas que crea el proceso (propuesta, para todos)", "", ...PROCESS_METRICS.map((m) => `- **${m.name}**: ${m.how}`), "");

  out.push("## El dashboard como cerebro de la operación", "", "| Módulo | Qué muestra | Fuente | Estado | Dónde verlo |", "| --- | --- | --- | --- | --- |", ...BRAIN_MODULES.map((m) => `| ${m.name} | ${m.what} | ${m.source} | ${SIGNAL_STATUS_LABEL[m.status]} | ${m.where?.label ?? "Aún no"} |`), "");
  const open = BRAIN_MODULES.filter((m) => m.open);
  out.push("Pendientes por módulo:", "", ...open.map((m) => `- **${m.name}**: ${m.open}`), "");

  out.push("## Preguntas abiertas del borrador", "", list(OPEN_QUESTIONS), "");
  return out.join("\n");
}

const acceptanceFormatMarkdown = (): string[] => [
  "## Formato de aceptación del cliente (igual en las 5 etapas)",
  "",
  "**Encabezado:**",
  "",
  list(ACCEPTANCE_FORMAT.header),
  "",
  "**Secciones:**",
  "",
  numbered(ACCEPTANCE_FORMAT.sections),
  "",
  "**Registro de aceptación:**",
  "",
  `- Estado: ${ACCEPTANCE_FORMAT.signoff.statuses.map((s) => `☐ ${s}`).join("  ")}`,
  ...ACCEPTANCE_FORMAT.signoff.fields.map((f) => `- ${f}: ________`),
  "",
  ACCEPTANCE_FORMAT.signoff.reviewWindow,
  "",
];

/** One stage on its own, with the context a new Claude conversation needs to use it: the shared acceptance format comes along. */
export function stageMarkdownDocument(stage: ProcessStage): string {
  return [
    `# Nuevo proceso de estrategas · Etapa ${stage.number}: ${stage.name}`,
    "",
    `Parte del proceso de BluePixel para estrategas (${PROCESS_VERSION}), que tiene cinco etapas: Discovery, Build, Testing, Entrega y FutureProof. Es un borrador para corregir entre todos. Este archivo trae solo la etapa ${stage.number}.`,
    "",
    stageToMarkdown(stage),
    ...acceptanceFormatMarkdown(),
  ].join("\n");
}

/** The simulated timeline as a table, for pasting into a plan or a conversation. The weeks are an example, not sold weeks. */
export function timelineMarkdown(schedule: Schedule): string {
  const name = (id: string) => STAGES.find((s) => s.id === id)?.name ?? id;
  const report = (id: string) => STAGES.find((s) => s.id === id)?.deliverable.title ?? "";
  return [
    "# Línea de tiempo del proceso de estrategas (simulación)",
    "",
    `Inicio: ${dayWithYear(schedule.start)} · Fin: ${dayWithYear(schedule.end)} · ${schedule.totalWeeks} semanas en total.`,
    "",
    "Las semanas de cada etapa son un ejemplo editable. Las reales de un proyecto salen de su contrato. Las etapas van una tras otra y cada una cierra el viernes de su última semana con el reporte de aceptación del cliente.",
    "",
    "| Etapa | Semanas | Semana de la simulación | Inicio | Cierre (viernes) | Reporte que la cierra |",
    "| --- | --- | --- | --- | --- | --- |",
    ...schedule.stages.map((s) => `| ${STAGES.findIndex((x) => x.id === s.id) + 1}. ${name(s.id)} | ${s.weeks} | ${s.startWeek === s.endWeek ? s.startWeek : `${s.startWeek} a ${s.endWeek}`} | ${dayWithYear(s.start)} | ${dayWithYear(s.end)} | ${report(s.id)} |`),
    "",
  ].join("\n");
}
