// The executive reading as a Markdown report, for management meetings or to hand to Claude. Same numbers as the screen.
import { AT_RISK_BELOW, fmtMoney, type Cerebro } from "./cerebro";
import { LIGHT_LABEL } from "./projectHealth";
import { REPORT_STATUS_LABELS } from "./projectProcessTypes";
import { STAGES } from "./procesoStages";
import { EMPLOYMENT_LABELS } from "./strategists";

const v = (n: number | null, suffix = "%") => (n === null ? "sin datos" : `${n}${suffix}`);
const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

export function cerebroToMarkdown(c: Cerebro, periodLabel: string, generatedOn: string): string {
  const p = c.portfolio;
  const out: string[] = [
    "# Reporte ejecutivo · Proceso de estrategas",
    "",
    `Periodo de evaluación: ${periodLabel} · Generado el ${generatedOn} · Cobertura de datos: ${c.coverage.pct}%`,
    "",
    "## Lo que requiere atención",
    "",
    c.attention.length === 0 ? "Sin alertas críticas ni altas." : list(c.attention.slice(0, 12).map((a) => `**${a.level === "critico" ? "Crítica" : a.level === "alto" ? "Alta" : "Media"}** (${a.area}): ${a.text}`)),
    "",
    "## Portafolio",
    "",
    `- Proyectos activos: ${p.active} (${p.tracked} con proceso capturado)`,
    `- Salud: ${p.lights.verde} en verde, ${p.lights.amarillo} en amarillo, ${p.lights.rojo} en rojo, ${p.lights.gris} sin datos`,
    `- Alertas: ${p.alerts.critico} críticas, ${p.alerts.alto} altas, ${p.alerts.medio} medias`,
    `- Riesgos abiertos: ${p.risks.open} (${p.risks.blockers} bloqueos, ${p.risks.critical} criticidades, ${p.risks.overdue} vencidos)`,
    `- Cambios de alcance sin aceptar: ${p.pendingScopeChanges}`,
    `- Sprints: ${p.sprints.al_dia} al día, ${p.sprints.atrasado} atrasados, ${p.sprints.en_riesgo} en riesgo`,
    "",
    "**Proyectos por etapa**",
    "",
    "| Etapa | Proyectos |",
    "| --- | --- |",
    ...STAGES.map((s) => `| ${s.number}. ${s.name} | ${p.byStage[s.id]} |`),
    "",
    "**Reportes de aceptación**",
    "",
    list((Object.keys(p.reports) as (keyof typeof p.reports)[]).map((k) => `${REPORT_STATUS_LABELS[k]}: ${p.reports[k]}`)),
    `- Vencidos sin aceptación: ${p.overdueReports}`,
    "",
  ];
  if (p.critical.length > 0) out.push("**Proyectos en amarillo o rojo**", "", "| Proyecto | Salud | Alertas | Principal |", "| --- | --- | --- | --- |", ...p.critical.slice(0, 15).map((r) => `| ${r.name} | ${LIGHT_LABEL[r.light]} | ${r.alerts} | ${r.top} |`), "");

  out.push("## Entrega y proceso", "", `- Cumplimiento del checklist: ${v(c.delivery.checklistPct)}`, `- Reportes aceptados a la primera: ${v(c.delivery.firstTimePct)}`, `- Reportes entregados a tiempo: ${v(c.delivery.onTimePct)}`, "");

  out.push("## Finanzas", "");
  if (c.finance.withContract === 0) out.push("Aún no hay contratos capturados: las finanzas no se pueden leer.", "");
  else {
    out.push(`Proyectos activos con contrato: ${c.finance.withContract}. Horas ejecutadas ${c.finance.hoursExecuted} de ${c.finance.hoursContracted} contratadas.`, "", "| Moneda | Contratado | Facturado | Cobrado | Por cobrar | Cobro vencido | Por facturar vencido |", "| --- | --- | --- | --- | --- | --- | --- |");
    for (const m of c.finance.money) out.push(`| ${m.currency} | ${fmtMoney(m.contracted, m.currency)} | ${fmtMoney(m.invoiced, m.currency)} | ${fmtMoney(m.paid, m.currency)} | ${fmtMoney(m.toCollect, m.currency)} | ${fmtMoney(m.overdue, m.currency)} | ${fmtMoney(m.unbilledDue, m.currency)} |`);
    out.push("");
  }

  out.push("## Equipo", "", `Desempeño promedio: ${v(c.team.average)} · Bajo ${AT_RISK_BELOW}%: ${c.team.atRisk.length}`, "", "| Grupo | Personas | Desempeño | Checklist | Aceptación 1.ª | Reportes a tiempo |", "| --- | --- | --- | --- | --- | --- |");
  for (const g of c.team.groups) out.push(`| ${EMPLOYMENT_LABELS[g.employment]} | ${g.people} | ${v(g.performance)} | ${v(g.checklist)} | ${v(g.firstTime)} | ${v(g.onTime)} |`);
  out.push("", "**Promedio por métrica**", "", list(c.team.components.map((m) => `${m.label}: ${v(m.value)}`)), "", "**Ranking**", "", ...c.team.ranked.map((x, i) => `${i + 1}. ${x.s.name} (${EMPLOYMENT_LABELS[x.s.employment]}): ${x.r.performanceScore}%`), "");

  out.push("## Cliente y calidad", "", `- CSAT: ${v(c.client.csat)} (${c.client.csatResponses} respuestas)`, `- NPS: ${v(c.client.nps, "")} (${c.client.npsResponses} encuestas)`, `- Calificación QA: ${v(c.client.qa)} (${c.client.qaReports} reportes)`, "");

  out.push("## Cobertura de datos", "", ...c.coverage.items.map((i) => `- ${i.label}: ${i.done} de ${i.total}`), "", "**Fuentes**", "", list(c.coverage.sources.map((s) => `${s.name}: ${s.ok === null ? "cargando" : s.ok ? "conectada" : "con error"} (${s.detail})`)), "");
  return out.join("\n");
}
