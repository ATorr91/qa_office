import { RING_LABELS, RING_OPTIONS, type Trend } from "./trends";

export function trendsToMarkdown(trends: Trend[]): string {
  const lines: string[] = [];
  lines.push("# Radar de Tendencias — BluePixel Studio");
  lines.push("");
  lines.push(`_Generado el ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} · ${trends.length} tendencia${trends.length === 1 ? "" : "s"}_`);
  lines.push("");

  for (const ring of RING_OPTIONS) {
    const items = trends.filter((t) => t.ring === ring);
    if (items.length === 0) continue;
    lines.push(`## ${RING_LABELS[ring]}`);
    lines.push("");
    for (const t of items) {
      lines.push(`### ${t.pinned ? "⭐ " : ""}${t.title}`);
      lines.push("");
      lines.push(`**Categoría:** ${t.category}${t.pestle.length ? ` · **PESTLE:** ${t.pestle.join(", ")}` : ""}`);
      lines.push(`**Puntajes:** Relevancia ${t.relevance} · En tendencia ${t.trending} · Oportunidad ${t.opportunity}`);
      lines.push("");
      lines.push(t.summary);
      lines.push("");
      if (t.adopters.length > 0) {
        lines.push(`**Ya lo usan:** ${t.adopters.join(", ")}`);
        lines.push("");
      }
      if (t.realExamples.length > 0) {
        lines.push("**Ejemplos reales:**");
        for (const ex of t.realExamples) {
          lines.push(`- ${ex.org} — ${ex.detail}`);
        }
        lines.push("");
      }
      if (t.impactPotential) {
        lines.push(`**Impacto potencial:** ${t.impactPotential}`);
        lines.push("");
      }
      lines.push(`**Fuente:** ${t.source}${t.sourceUrl ? ` (${t.sourceUrl})` : ""} · detectada el ${t.spottedAt}`);
      lines.push("");
      lines.push("**El filtro \"So What?\"**");
      lines.push(`- ¿Por qué nos importa? ${t.soWhat.porque}`);
      lines.push(`- ¿Cómo impacta? ${t.soWhat.impacto}`);
      lines.push(`- ¿Qué acción concreta? ${t.soWhat.accion}`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
