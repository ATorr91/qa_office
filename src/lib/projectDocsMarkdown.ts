// A project's fact sheet as Markdown: what the dashboard knows plus what its Drive folder says. For handing to Claude or pasting in a plan.
import { STAGES } from "./procesoStages";
import { DOC_KIND_LABELS, DOC_KIND_ORDER, type ProjectBrief } from "./projectDocs";
import { LIGHT_LABEL } from "./projectHealth";
import { PROJECT_STATUS_LABELS, STRATEGISTS } from "./strategists";
import type { ProjectRow } from "./useProjectsView";

const list = (items: string[]) => (items.length === 0 ? "_Sin información._" : items.map((i) => `- ${i}`).join("\n"));

export function projectToMarkdown(row: ProjectRow, brief: ProjectBrief | null, folderUrl: string | null, daysLeft: number): string {
  const { project, data, health, owners, boards } = row;
  const owner = owners.map((id) => STRATEGISTS.find((s) => s.id === id)?.name ?? id);
  const stage = STAGES.find((s) => s.id === data.stage)!;
  const out: string[] = [
    `# ${project.name}`,
    "",
    `${project.code} · ${project.client} · ${project.cell} · ${PROJECT_STATUS_LABELS[project.status]}`,
    "",
    `- Fechas: ${project.start} a ${project.end} (${daysLeft >= 0 ? `${daysLeft} días restantes` : `terminó hace ${-daysLeft} días`})`,
    `- Equipo: ${owner.length > 0 ? owner.join(", ") : "sin estratega asignado"}`,
    `- Etapa: ${row.tracked ? stage.name : "proceso sin capturar"}${row.tracked ? ` (checklist ${row.checklist.done}/${row.checklist.total})` : ""}`,
    `- Salud: cronograma ${LIGHT_LABEL[health.schedule.light]}, alcance ${LIGHT_LABEL[health.scope.light]}, finanzas ${LIGHT_LABEL[health.finance.light]}`,
    `- Carpeta de Drive: ${folderUrl ?? "sin vincular"}`,
    "",
    "## Alertas",
    "",
    list(health.alerts.map((a) => `${a.level}: ${a.text}`)),
    "",
    "## Alcance",
    "",
    list(brief?.scope ?? []),
    "",
    "## Objetivos a cubrir",
    "",
    list(brief?.objectives ?? []),
    "",
    "## Entregables",
    "",
    list(brief?.deliverables ?? []),
    "",
    "## Cronograma de los documentos",
    "",
    list(brief?.timeline ?? []),
    "",
    "## Objetivos SMART capturados",
    "",
    list(data.objectives.map((o) => `${o.text} (${o.metric || "sin métrica"}: ${o.current ?? "—"} ${o.unit}, meta ${o.target ?? "—"})`)),
    "",
    "## Sprint en Jira",
    "",
    list(boards.map((b) => (b.sprint ? `${b.key}: ${b.sprint.name}, ${b.sprint.donePct}% hecho frente a ${b.sprint.expectedPct}% esperado (${b.sprint.pace.replace("_", " ")})` : `${b.key}: ${b.note ?? "sin sprint en curso"}`))),
    "",
    "## Documentos",
    "",
  ];
  const docs = brief?.docs ?? [];
  if (docs.length === 0) out.push("_Sin archivos sincronizados._", "");
  for (const kind of DOC_KIND_ORDER) {
    const group = docs.filter((d) => d.kind === kind);
    if (group.length === 0) continue;
    out.push(`**${DOC_KIND_LABELS[kind]}**`, "", ...group.map((d) => `- [${d.name}](${d.url})${d.path ? ` (${d.path})` : ""}`), "");
  }
  return out.join("\n");
}
