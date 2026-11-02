import { getEffectiveRecord, type ManualMonthlyData } from "./strategistRecords";
import { getMonthLabel, getPeriodLabel, type MonthKey, type Strategist } from "./strategists";
import type { BitacorasByStrategistId, DeadlinesByEmail, Period } from "./dashboardFilters";

function periodLabel(period: Period): string {
  return getPeriodLabel(period);
}

const NO_DATA = "Sin información disponible";

export function dashboardToMarkdown(
  strategists: Strategist[],
  period: Period,
  recordsByStrategist: Record<string, Partial<Record<MonthKey, ManualMonthlyData>>>,
  jiraDeadlines: { configured: boolean; error: string | null; byEmail: DeadlinesByEmail } | null,
  bitacorasSync: { configured: boolean; error: string | null; byStrategistId: BitacorasByStrategistId } | null = null,
): string {
  const lines: string[] = [];
  lines.push("# Dashboard de Estrategas — BluePixel Studio");
  lines.push("");
  lines.push(
    `_Periodo: ${periodLabel(period)} · Generado el ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} · ${strategists.length} estratega${strategists.length === 1 ? "" : "s"}_`,
  );
  lines.push("");

  for (const s of strategists) {
    const manualByMonth = recordsByStrategist[s.id] ?? {};
    const deadlinesByMonth = jiraDeadlines?.configured && !jiraDeadlines.error ? jiraDeadlines.byEmail[s.email] ?? null : null;
    const bitacorasByMonth = bitacorasSync?.configured && !bitacorasSync.error ? bitacorasSync.byStrategistId[s.id] ?? null : null;
    const r = getEffectiveRecord(manualByMonth, deadlinesByMonth, period, bitacorasByMonth);

    lines.push(`## ${s.name} — ${s.role}`);
    lines.push("");
    lines.push(`- **Evaluación de desempeño:** ${r.performanceScore !== null ? `${r.performanceScore}%` : NO_DATA}`);
    lines.push(`- **Peer reviews:** ${r.peerReviewScore !== null ? `${r.peerReviewScore}%` : NO_DATA}${r.peerReviewCount !== null ? ` (${r.peerReviewCount} evaluaciones recibidas)` : ""}`);
    lines.push(`- **Cumplimiento de OKRs y KPIs:** ${r.okrCompletion !== null ? `${r.okrCompletion}%` : NO_DATA}`);
    lines.push(`- **Cumplimiento de deadlines (Jira):** ${r.deadlineComplianceRate !== null ? `${r.deadlineComplianceRate}% (${r.deadlinesOnTime}/${r.deadlinesAssigned})` : jiraDeadlines?.configured ? "sin deadlines vencidos en este periodo" : "Jira no conectado"}`);
    lines.push(`- **Cumplimiento de bitácoras (Google Sheets):** ${r.bitacoraComplianceRate !== null ? `${r.bitacoraComplianceRate}% (${r.bitacorasSubmitted}/${r.bitacorasExpected})` : NO_DATA}${r.lastBitacoraDate ? ` · última: ${r.lastBitacoraDate}` : ""}`);
    lines.push(`- **Calificación QA:** ${r.qaScore !== null ? `${r.qaScore}%` : NO_DATA}${r.qaReviewsCount !== null ? ` (${r.qaReviewsCount} entregables revisados, ${r.qaIssuesFound ?? 0} hallazgos)` : ""}`);
    lines.push(`- **NPS de cliente (aparte del desempeño):** ${r.npsScore !== null ? r.npsScore : NO_DATA}`);
    lines.push("");
    if (r.okrs.length > 0) {
      lines.push("**OKRs del periodo:**");
      for (const okr of r.okrs) {
        lines.push(`- ${okr.objective} — ${okr.keyResult} (${okr.progress}%)`);
      }
      lines.push("");
    }
    if (r.peerComments.length > 0) {
      lines.push("**Comentarios de peer review:**");
      for (const c of r.peerComments) {
        lines.push(`- _${c.from}:_ ${c.comment}`);
      }
      lines.push("");
    }
    if (r.selfAssessments.length > 0) {
      lines.push("**Autoevaluación guiada:**");
      for (const a of r.selfAssessments) {
        const prefix = r.selfAssessments.length > 1 ? `_${getMonthLabel(a.month)}_ — ` : "";
        lines.push(`- ${prefix}**Mayor victoria:** ${a.biggestWin}`);
        lines.push(`- ${prefix}**Peor error / aprendizaje:** ${a.mistakeLearning}`);
        lines.push(`- ${prefix}**Habilidad a desarrollar:** ${a.skillToDevelop}`);
      }
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export { downloadTextFile } from "./trendExport";
