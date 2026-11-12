// Pure: the traffic light of a project (schedule, scope and finances) and the alerts behind it. The rules are deliberately simple
// and written down in HEALTH_RULES so the dashboard can show them; change a threshold here and every project follows.
import { stageById } from "./procesoStages";
import { daysBetween } from "./projectHours";
import type { SprintBoardResult } from "./jiraSprintTypes";
import type { CatalogProject } from "./projectCatalog";
import { DECIDED_STATUSES, STAGE_ORDER, type ProjectProcessData } from "./projectProcessTypes";

export type Light = "verde" | "amarillo" | "rojo" | "gris";

export interface HealthPart {
  light: Light;
  reason: string;
}

export type AlertLevel = "critico" | "alto" | "medio";

export interface ProjectAlert {
  level: AlertLevel;
  text: string;
}

export interface ProjectHealth {
  schedule: HealthPart;
  scope: HealthPart;
  finance: HealthPart;
  overall: Light;
  alerts: ProjectAlert[];
}

export const HEALTH_RULES = {
  /** Points of hours consumed above the calendar share elapsed that turn the finances yellow / red. */
  hoursGapYellow: 10,
  hoursGapRed: 25,
  /** Days a report may be late before the schedule is red instead of yellow. */
  reportRedAfterDays: 7,
  /** Share of the contracted hours that scope changes may add before the scope is yellow / red. */
  scopeChangeYellowPct: 10,
  scopeChangeRedPct: 20,
  /** Days after a payment's due date that a billed-but-unpaid invoice turns red. */
  unpaidRedAfterDays: 30,
} as const;

const RANK: Record<Light, number> = { gris: 0, verde: 1, amarillo: 2, rojo: 3 };

export function worst(parts: HealthPart[]): Light {
  const known = parts.filter((p) => p.light !== "gris");
  if (known.length === 0) return "gris";
  return known.reduce<Light>((w, p) => (RANK[p.light] > RANK[w] ? p.light : w), "verde");
}

const part = (light: Light, reason: string): HealthPart => ({ light, reason });

const pctOf = (n: number, whole: number) => Math.round((n / whole) * 100);
const stageName = (id: string) => stageById(id)?.name ?? id;

export interface HealthInput {
  project: CatalogProject;
  data: ProjectProcessData;
  /** Jira boards of the project's keys (with their current sprint, when running). */
  boards: SprintBoardResult[];
  /** Hours logged on the project, all people. 0 when there are none. */
  hours: number;
  owners: string[];
  today: string;
  /** Monday of the current week. */
  week: string;
}

function scheduleOf({ project, data, boards, today }: HealthInput, alerts: ProjectAlert[]): HealthPart {
  const reasons: string[] = [];
  let light: Light = "gris";
  const raise = (to: Light, reason: string) => {
    reasons.push(reason);
    if (RANK[to] > RANK[light]) light = to;
  };

  const sprints = boards.filter((b) => b.sprint).map((b) => ({ key: b.key, sprint: b.sprint! }));
  for (const { key, sprint } of sprints) {
    const gap = `${sprint.donePct}% hecho frente a ${sprint.expectedPct}% esperado`;
    if (sprint.pace === "al_dia") raise("verde", `${key}: al día (${gap})`);
    else if (sprint.pace === "atrasado") {
      raise("amarillo", `${key}: atrasado (${gap})`);
      alerts.push({ level: "medio", text: `Sprint de ${key} atrasado: ${gap}` });
    } else if (sprint.pace === "en_riesgo") {
      raise("rojo", `${key}: en riesgo (${gap})`);
      alerts.push({ level: "alto", text: `Sprint de ${key} en riesgo: ${gap}` });
    }
  }

  for (const stage of STAGE_ORDER) {
    const r = data.reports[stage];
    if (!r || !r.dueDate || DECIDED_STATUSES.includes(r.status) || r.dueDate >= today) continue;
    const late = daysBetween(r.dueDate, today);
    const rojo = late > HEALTH_RULES.reportRedAfterDays;
    raise(rojo ? "rojo" : "amarillo", `Reporte de ${stageName(stage)} con ${late} día${late === 1 ? "" : "s"} de retraso`);
    alerts.push({ level: rojo ? "alto" : "medio", text: `El reporte de ${stageName(stage)} venció hace ${late} día${late === 1 ? "" : "s"} y el cliente no lo ha aceptado` });
  }

  if (light === "gris") return part("gris", project.status === "active" ? "Sin sprint en curso ni reportes con fecha" : "Proyecto sin actividad");
  return part(light, reasons.join(" · "));
}

function scopeOf({ data, hours, today }: HealthInput, alerts: ProjectAlert[]): HealthPart {
  const open = data.risks.filter((r) => r.status === "abierto");
  const blockers = open.filter((r) => r.kind !== "riesgo");
  const pendingChanges = data.scopeChanges.filter((c) => c.status === "pendiente");
  const registered = data.risks.length + data.scopeChanges.length + data.objectives.length + Object.keys(data.reports).length + Object.keys(data.checklist).length;
  if (registered === 0 && hours === 0) return part("gris", "Aún no hay registro de riesgos, alcance ni objetivos");

  const reasons: string[] = [];
  let light: Light = "verde";
  const raise = (to: Light, reason: string) => {
    reasons.push(reason);
    if (RANK[to] > RANK[light]) light = to;
  };

  for (const b of blockers) {
    const critical = b.kind === "critico" || b.severity === "alta";
    raise(critical ? "rojo" : "amarillo", `${b.kind === "critico" ? "Criticidad" : "Bloqueo"}: ${b.title}`);
    alerts.push({ level: critical ? "critico" : "alto", text: `${b.kind === "critico" ? "Criticidad" : "Bloqueo"} abierto: ${b.title}${b.owner ? ` (${b.owner})` : ""}` });
  }
  for (const r of open.filter((x) => x.kind === "riesgo" && x.severity === "alta")) {
    raise("amarillo", `Riesgo alto: ${r.title}`);
    alerts.push({ level: "alto", text: `Riesgo alto abierto: ${r.title}` });
  }
  for (const r of open) {
    if (!r.dueDate || r.dueDate >= today) continue;
    const late = daysBetween(r.dueDate, today);
    raise("amarillo", `Vencido hace ${late} día${late === 1 ? "" : "s"}: ${r.title}`);
    alerts.push({ level: "medio", text: `${r.kind === "riesgo" ? "Riesgo" : r.kind === "bloqueo" ? "Bloqueo" : "Criticidad"} sin resolver, venció hace ${late} día${late === 1 ? "" : "s"}: ${r.title}` });
  }
  if (pendingChanges.length > 0) {
    raise("amarillo", `${pendingChanges.length} cambio${pendingChanges.length === 1 ? "" : "s"} de alcance sin aceptar`);
    alerts.push({ level: "medio", text: `${pendingChanges.length} cambio${pendingChanges.length === 1 ? "" : "s"} de alcance esperando aceptación del cliente` });
  }
  return part(light, reasons.length > 0 ? reasons.join(" · ") : "Sin bloqueos ni cambios de alcance abiertos");
}

function financeOf({ project, data, hours, today }: HealthInput, alerts: ProjectAlert[]): HealthPart {
  const c = data.contract;
  const flagged = project.flags?.includes("overBudget");
  if (!c) {
    if (flagged) return part("rojo", "Marcado como «sobre presupuesto» en el catálogo; falta capturar el contrato");
    return part("gris", project.flags?.includes("noBudget") ? "Marcado como «sin presupuesto» en el catálogo" : "Falta capturar el contrato");
  }

  const reasons: string[] = [];
  let light: Light = "gris";
  const raise = (to: Light, reason: string) => {
    reasons.push(reason);
    if (RANK[to] > RANK[light]) light = to;
  };

  if (c.contractedHours && c.contractedHours > 0) {
    if (hours > 0) {
      const start = c.startDate ?? project.start;
      const end = c.endDate ?? project.end;
      const span = Math.max(1, daysBetween(start, end));
      const elapsed = Math.min(100, Math.max(0, pctOf(daysBetween(start, today), span)));
      const consumed = pctOf(hours, c.contractedHours);
      const gap = consumed - elapsed;
      const text = `${consumed}% de las horas contratadas consumido con ${elapsed}% del tiempo transcurrido`;
      if (consumed >= 100) {
        raise("rojo", `Horas contratadas agotadas (${consumed}%)`);
        alerts.push({ level: "alto", text: `Se agotaron las horas contratadas (${Math.round(hours)} de ${c.contractedHours})` });
      } else if (gap > HEALTH_RULES.hoursGapRed) {
        raise("rojo", text);
        alerts.push({ level: "alto", text: `Consumo de horas muy por encima del calendario: ${text}` });
      } else if (gap > HEALTH_RULES.hoursGapYellow) {
        raise("amarillo", text);
        alerts.push({ level: "medio", text: `Consumo de horas por encima del calendario: ${text}` });
      } else raise("verde", text);
    }
    const scopeHours = data.scopeChanges.filter((s) => s.status === "aceptado").reduce((n, s) => n + (s.impactHours ?? 0), 0);
    const scopePct = pctOf(scopeHours, c.contractedHours);
    if (scopePct > HEALTH_RULES.scopeChangeYellowPct) {
      raise(scopePct > HEALTH_RULES.scopeChangeRedPct ? "rojo" : "amarillo", `Cambios de alcance aceptados suman ${scopePct}% de las horas contratadas`);
      alerts.push({ level: "medio", text: `Los cambios de alcance aceptados ya suman ${scopePct}% de las horas contratadas` });
    }
  }

  for (const p of c.payments) {
    if (p.paid || !p.dueDate || p.dueDate >= today) continue;
    if (!p.invoiced) {
      raise("amarillo", `Por facturar: ${p.label}`);
      alerts.push({ level: "medio", text: `Pago vencido sin facturar: ${p.label}` });
    } else if (daysBetween(p.dueDate, today) > HEALTH_RULES.unpaidRedAfterDays) {
      raise("rojo", `Cobro vencido: ${p.label}`);
      alerts.push({ level: "alto", text: `Cobro vencido hace más de ${HEALTH_RULES.unpaidRedAfterDays} días: ${p.label}` });
    } else {
      raise("amarillo", `Facturado y sin cobrar: ${p.label}`);
    }
  }
  if (flagged && RANK[light] < RANK.rojo) raise("rojo", "Marcado como «sobre presupuesto» en el catálogo");

  if (light === "gris") return part("verde", "Contrato capturado; aún sin horas ni pagos vencidos");
  return part(light, reasons.join(" · "));
}

export function projectHealth(input: HealthInput): ProjectHealth {
  const alerts: ProjectAlert[] = [];
  const schedule = scheduleOf(input, alerts);
  const scope = scopeOf(input, alerts);
  const finance = financeOf(input, alerts);

  if (input.project.status === "active") {
    if (input.owners.length === 0) alerts.push({ level: "alto", text: "Sin estratega asignado" });
    if (!input.data.milestones[input.week]) alerts.push({ level: "medio", text: "Sin hito clave definido para esta semana" });
  }
  const order: Record<AlertLevel, number> = { critico: 0, alto: 1, medio: 2 };
  alerts.sort((a, b) => order[a.level] - order[b.level]);
  return { schedule, scope, finance, overall: worst([schedule, scope, finance]), alerts };
}

export const LIGHT_LABEL: Record<Light, string> = { verde: "Verde", amarillo: "Amarillo", rojo: "Rojo", gris: "Sin datos" };
