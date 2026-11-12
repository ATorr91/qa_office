// The month's team analysis as Markdown, to keep in the management notes or hand to Claude.
import { STRATEGISTS } from "./strategists";
import type { TeamAnalysis } from "./teamAnalysis";

const STATUS = { avanzo: "avanzó", sin_evidencia: "sin evidencia en los datos", cambio_contexto: "cambió el contexto" } as const;

export function analysisToMarkdown(a: TeamAnalysis): string {
  const name = (id: string) => STRATEGISTS.find((s) => s.id === id)?.name ?? id;
  const out = [`# Análisis del equipo · ${a.month}`, "", `Generado con IA (${a.model}) el ${a.generatedAt.slice(0, 10)}. Revisar antes de actuar.`, "", a.summary, ""];
  if (a.followUp.length > 0) out.push("## Seguimiento del mes anterior", "", ...a.followUp.map((f) => `- ${f.action}: ${STATUS[f.status]}. ${f.note}`), "");
  out.push("## Acciones para el equipo", "", ...a.teamActions.map((t) => `- **${t.priority}** · ${t.owner}: ${t.action} _${t.why}_`), "", "## Por persona", "");
  for (const p of a.people) out.push(`### ${name(p.strategistId)}`, "", p.headline, "", ...p.actions.map((x) => `- ${x.action} _${x.why}_`), "");
  return out.join("\n");
}
