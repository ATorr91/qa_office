// Pure: turns everything the dashboard knows (projects and their process data, the people and their evaluations, client scores,
// the state of the live sources) into one executive reading: how healthy the portfolio is, what is late, what money is at stake,
// how the team performs, and how much of this can be trusted because it was actually captured. Nothing here is estimated: a
// number with nothing behind it stays null and shows up in `coverage` as a gap.
import type { ProcessMetrics } from "./processMetrics";
import { STAGE_ORDER, DECIDED_STATUSES, type Currency, type ReportStatus } from "./projectProcessTypes";
import type { Light, AlertLevel } from "./projectHealth";
import type { EffectiveRecord } from "./strategistRecords";
import type { StageId } from "./procesoTypes";
import { briefOf } from "./projectDocs";
import type { ProjectRow } from "./useProjectsView";
import type { Employment, Strategist } from "./strategists";

export const AT_RISK_BELOW = 70;

export interface Person {
  s: Strategist;
  r: EffectiveRecord;
}

export interface SourceState {
  name: string;
  /** null while it is still loading. */
  ok: boolean | null;
  detail: string;
}

export interface CerebroInput {
  rows: ProjectRow[];
  people: Person[];
  processById: Record<string, ProcessMetrics>;
  today: string;
  week: string;
  sources: SourceState[];
}

export interface Attention {
  level: AlertLevel;
  area: "Proyectos" | "Finanzas" | "Equipo" | "Datos";
  text: string;
  /** Where to go to see or fix it. */
  href?: string;
}

export interface Money {
  currency: Currency;
  contracted: number;
  invoiced: number;
  paid: number;
  /** Billed and not paid yet. */
  toCollect: number;
  /** Due date passed and not paid. */
  overdue: number;
  /** Due date passed and not billed. */
  unbilledDue: number;
}

export interface FinanceRow {
  id: string;
  name: string;
  currency: Currency;
  amount: number | null;
  invoicedPct: number | null;
  paidPct: number | null;
  hoursPct: number | null;
  light: Light;
}

export interface GroupSummary {
  employment: Employment;
  people: number;
  performance: number | null;
  checklist: number | null;
  firstTime: number | null;
  onTime: number | null;
}

export interface CoverageItem {
  label: string;
  done: number;
  total: number;
  /** Admin section where it gets captured. */
  fix?: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  client: string;
  code: string;
  owners: string[];
  stage: StageId | null;
  light: Light;
  alerts: number;
  sprintDonePct: number | null;
  sprintExpectedPct: number | null;
  docs: number;
  hasFolder: boolean;
}

export const projectHref = (id: string) => `/dashboard-estrategas/cerebro/proyecto/${encodeURIComponent(id)}`;

export interface Cerebro {
  portfolio: {
    active: number;
    lights: Record<Light, number>;
    tracked: number;
    byStage: Record<StageId, number>;
    unassigned: string[];
    alerts: { critico: number; alto: number; medio: number };
    risks: { open: number; blockers: number; critical: number; overdue: number };
    pendingScopeChanges: number;
    reports: Record<ReportStatus, number>;
    overdueReports: number;
    sprints: { al_dia: number; atrasado: number; en_riesgo: number; sin_trabajo: number };
    checklistPct: number | null;
    milestonesDefined: number;
    critical: { id: string; name: string; light: Light; alerts: number; top: string }[];
    /** Every active project, for the project list. */
    list: ProjectListItem[];
  };
  delivery: { firstTimePct: number | null; onTimePct: number | null; checklistPct: number | null };
  finance: {
    withContract: number;
    money: Money[];
    hoursExecuted: number;
    hoursContracted: number;
    rows: FinanceRow[];
    overBudget: number;
  };
  team: {
    people: Person[];
    ranked: Person[];
    atRisk: Person[];
    average: number | null;
    groups: GroupSummary[];
    components: { label: string; value: number | null }[];
    /** Process metrics of each person (checklist, first-time acceptance, on-time reports). */
    process: Record<string, ProcessMetrics>;
  };
  client: {
    csat: number | null;
    csatResponses: number;
    nps: number | null;
    npsResponses: number;
    qa: number | null;
    qaReports: number;
    satisfaction: number | null;
  };
  coverage: { items: CoverageItem[]; pct: number; sources: SourceState[] };
  attention: Attention[];
}

const avg = (values: (number | null | undefined)[]): number | null => {
  const v = values.filter((x): x is number => typeof x === "number");
  return v.length === 0 ? null : Math.round(v.reduce((a, b) => a + b, 0) / v.length);
};
const pct = (n: number, whole: number): number | null => (whole > 0 ? Math.round((n / whole) * 100) : null);
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const firstName = (name: string) => name.split(" ")[0];

const EMPTY_REPORTS = (): Record<ReportStatus, number> => ({ pendiente: 0, enviado: 0, aceptado: 0, aceptado_obs: 0, no_aceptado: 0 });

export function buildCerebro(input: CerebroInput): Cerebro {
  const { rows, people, processById, today, week, sources } = input;
  const active = rows.filter((r) => r.project.status === "active");
  const tracked = active.filter((r) => r.tracked);

  // Portfolio
  const lights: Record<Light, number> = { verde: 0, amarillo: 0, rojo: 0, gris: 0 };
  for (const r of active) lights[r.health.overall] += 1;
  const byStage = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0])) as Record<StageId, number>;
  for (const r of tracked) byStage[r.data.stage] += 1;
  const alertsCount = { critico: 0, alto: 0, medio: 0 };
  // "Sin estratega asignado" is reported once, aggregated, in the attention list: counting it per project would inflate the totals.
  for (const r of active) for (const a of r.health.alerts) if (a.text !== "Sin estratega asignado") alertsCount[a.level] += 1;

  const openRisks = tracked.flatMap((r) => r.data.risks.filter((k) => k.status === "abierto"));
  const reports = EMPTY_REPORTS();
  let overdueReports = 0;
  for (const r of tracked) {
    for (const stage of STAGE_ORDER) {
      const rep = r.data.reports[stage];
      if (!rep) continue;
      reports[rep.status] += 1;
      if (rep.dueDate && rep.dueDate < today && !DECIDED_STATUSES.includes(rep.status)) overdueReports += 1;
    }
  }
  const sprints = { al_dia: 0, atrasado: 0, en_riesgo: 0, sin_trabajo: 0 };
  for (const r of active) for (const b of r.boards) if (b.sprint) sprints[b.sprint.pace] += 1;
  const checklistDone = sum(tracked.map((r) => r.checklist.done));
  const checklistTotal = sum(tracked.map((r) => r.checklist.total));
  const rank: Record<Light, number> = { rojo: 3, amarillo: 2, verde: 1, gris: 0 };
  const critical = active
    .filter((r) => r.health.overall === "rojo" || r.health.overall === "amarillo")
    .sort((a, b) => rank[b.health.overall] - rank[a.health.overall] || b.health.alerts.length - a.health.alerts.length)
    .map((r) => ({ id: r.id, name: r.project.name, light: r.health.overall, alerts: r.health.alerts.length, top: r.health.alerts[0]?.text ?? r.health.schedule.reason }));
  const unassigned = active.filter((r) => r.owners.length === 0).map((r) => r.project.name);

  // Finance (only projects whose contract has been captured)
  const withContract = active.filter((r) => r.data.contract);
  const moneyByCurrency = new Map<Currency, Money>();
  const financeRows: FinanceRow[] = [];
  let hoursExecuted = 0;
  let hoursContracted = 0;
  for (const r of withContract) {
    const c = r.data.contract!;
    const m = moneyByCurrency.get(c.currency) ?? { currency: c.currency, contracted: 0, invoiced: 0, paid: 0, toCollect: 0, overdue: 0, unbilledDue: 0 };
    const amount = c.amount ?? sum(c.payments.map((p) => p.amount));
    m.contracted += amount;
    for (const p of c.payments) {
      if (p.invoiced) m.invoiced += p.amount;
      if (p.paid) m.paid += p.amount;
      else if (p.invoiced) m.toCollect += p.amount;
      if (!p.paid && p.dueDate && p.dueDate < today) {
        if (p.invoiced) m.overdue += p.amount;
        else m.unbilledDue += p.amount;
      }
    }
    moneyByCurrency.set(c.currency, m);
    if (c.contractedHours && c.contractedHours > 0) {
      hoursContracted += c.contractedHours;
      hoursExecuted += r.hours;
    }
    const invoiced = sum(c.payments.filter((p) => p.invoiced).map((p) => p.amount));
    const paid = sum(c.payments.filter((p) => p.paid).map((p) => p.amount));
    financeRows.push({
      id: r.id,
      name: r.project.name,
      currency: c.currency,
      amount: amount > 0 ? amount : null,
      invoicedPct: amount > 0 ? pct(invoiced, amount) : null,
      paidPct: amount > 0 ? pct(paid, amount) : null,
      hoursPct: c.contractedHours ? pct(r.hours, c.contractedHours) : null,
      light: r.health.finance.light,
    });
  }
  const lightRank: Record<Light, number> = { rojo: 3, amarillo: 2, verde: 1, gris: 0 };
  financeRows.sort((a, b) => lightRank[b.light] - lightRank[a.light]);

  // Team
  const withScore = people.filter((p) => p.r.performanceScore !== null);
  const ranked = [...withScore].sort((a, b) => b.r.performanceScore! - a.r.performanceScore!);
  const atRisk = ranked.filter((p) => p.r.performanceScore! < AT_RISK_BELOW);
  const groups: GroupSummary[] = (["nomina", "proveedor"] as const).map((employment) => {
    const members = people.filter((p) => p.s.employment === employment);
    return {
      employment,
      people: members.length,
      performance: avg(members.map((p) => p.r.performanceScore)),
      checklist: avg(members.map((p) => processById[p.s.id]?.checklistPct)),
      firstTime: avg(members.map((p) => processById[p.s.id]?.firstTimePct)),
      onTime: avg(members.map((p) => processById[p.s.id]?.onTimePct)),
    };
  });
  const components = [
    { label: "Peer review", value: avg(people.map((p) => p.r.peerReviewScore)) },
    { label: "OKRs y KPIs", value: avg(people.map((p) => p.r.okrCompletion)) },
    { label: "Deadlines", value: avg(people.map((p) => p.r.deadlineComplianceRate)) },
    { label: "Bitácoras", value: avg(people.map((p) => p.r.bitacoraComplianceRate)) },
    { label: "Calificación QA", value: avg(people.map((p) => p.r.qaScore)) },
  ];

  // Client
  const client = {
    csat: avg(people.map((p) => p.r.csatScore)),
    csatResponses: sum(people.map((p) => p.r.csatResponses)),
    nps: avg(people.map((p) => p.r.npsScore)),
    npsResponses: sum(people.map((p) => p.r.npsResponses)),
    qa: avg(people.map((p) => p.r.qaScore)),
    qaReports: sum(people.map((p) => p.r.qaReportCount)),
    satisfaction: avg(people.map((p) => p.r.satisfactionScore)),
  };

  // Coverage: how much of the above rests on captured data
  const items: CoverageItem[] = [
    { label: "Proyectos activos con estratega", done: active.length - unassigned.length, total: active.length },
    { label: "Proyectos activos con proceso capturado", done: tracked.length, total: active.length, fix: "/dashboard-estrategas/admin#proyectos" },
    { label: "Proyectos activos con contrato", done: withContract.length, total: active.length, fix: "/dashboard-estrategas/admin#proyectos" },
    { label: "Proyectos activos con objetivos SMART", done: active.filter((r) => r.data.objectives.length > 0).length, total: active.length, fix: "/dashboard-estrategas/admin#proyectos" },
    { label: "Proyectos activos con hito de la semana", done: active.filter((r) => r.data.milestones[week]).length, total: active.length, fix: "/dashboard-estrategas/admin#proyectos" },
    { label: "Estrategas con desempeño medido", done: withScore.length, total: people.length },
  ];
  const coveragePct = Math.round(avg(items.map((i) => (i.total > 0 ? (i.done / i.total) * 100 : null))) ?? 0);

  // Attention: the short list a director should read first
  const attention: Attention[] = [];
  for (const r of active) {
    for (const a of r.health.alerts) {
      if (a.level === "medio" || a.text === "Sin estratega asignado") continue;
      attention.push({ level: a.level, area: "Proyectos", text: `${r.project.name}: ${a.text}`, href: projectHref(r.id) });
    }
  }
  if (unassigned.length > 0) attention.push({ level: "alto", area: "Proyectos", text: `${unassigned.length} proyecto${unassigned.length === 1 ? "" : "s"} activo${unassigned.length === 1 ? "" : "s"} sin estratega: ${unassigned.slice(0, 4).join(", ")}${unassigned.length > 4 ? "…" : ""}` });
  if (overdueReports > 0) attention.push({ level: "alto", area: "Proyectos", text: `${overdueReports} reporte${overdueReports === 1 ? "" : "s"} de etapa vencido${overdueReports === 1 ? "" : "s"} sin aceptación del cliente` });
  for (const m of moneyByCurrency.values()) {
    if (m.overdue > 0) attention.push({ level: "alto", area: "Finanzas", text: `Cobro vencido: ${fmtMoney(m.overdue, m.currency)}` });
    if (m.unbilledDue > 0) attention.push({ level: "medio", area: "Finanzas", text: `Por facturar con fecha vencida: ${fmtMoney(m.unbilledDue, m.currency)}` });
  }
  if (atRisk.length > 0) attention.push({ level: "alto", area: "Equipo", text: `${atRisk.length} estratega${atRisk.length === 1 ? "" : "s"} bajo ${AT_RISK_BELOW}% de desempeño: ${atRisk.map((p) => firstName(p.s.name)).join(", ")}`, href: "/dashboard-estrategas" });
  for (const s of sources) if (s.ok === false) attention.push({ level: "alto", area: "Datos", text: `${s.name} no responde: ${s.detail}` });
  if (active.length > 0 && withContract.length < active.length) attention.push({ level: "medio", area: "Datos", text: `Solo ${withContract.length} de ${active.length} proyectos activos tienen contrato: las finanzas están incompletas`, href: "/dashboard-estrategas/admin#proyectos" });
  if (active.length > 0 && tracked.length < active.length) attention.push({ level: "medio", area: "Datos", text: `${active.length - tracked.length} proyecto${active.length - tracked.length === 1 ? "" : "s"} activo${active.length - tracked.length === 1 ? "" : "s"} sin proceso capturado`, href: "/dashboard-estrategas/admin#proyectos" });
  const order: Record<AlertLevel, number> = { critico: 0, alto: 1, medio: 2 };
  attention.sort((a, b) => order[a.level] - order[b.level]);

  return {
    portfolio: {
      active: active.length,
      lights,
      tracked: tracked.length,
      byStage,
      unassigned,
      alerts: alertsCount,
      risks: {
        open: openRisks.length,
        blockers: openRisks.filter((k) => k.kind === "bloqueo").length,
        critical: openRisks.filter((k) => k.kind === "critico").length,
        overdue: openRisks.filter((k) => k.dueDate && k.dueDate < today).length,
      },
      pendingScopeChanges: sum(tracked.map((r) => r.data.scopeChanges.filter((c) => c.status === "pendiente").length)),
      reports,
      overdueReports,
      sprints,
      checklistPct: pct(checklistDone, checklistTotal),
      milestonesDefined: active.filter((r) => r.data.milestones[week]).length,
      critical,
      list: active
        .map((r) => {
          const sprint = r.boards.find((b) => b.sprint)?.sprint ?? null;
          const brief = briefOf(r.id);
          return {
            id: r.id,
            name: r.project.name,
            client: r.project.client,
            code: r.project.code,
            owners: r.owners,
            stage: r.tracked ? r.data.stage : null,
            light: r.health.overall,
            alerts: r.health.alerts.length,
            sprintDonePct: sprint?.donePct ?? null,
            sprintExpectedPct: sprint?.expectedPct ?? null,
            docs: brief?.docs.length ?? 0,
            hasFolder: !!(r.data.links.drive || brief?.folderUrl),
          };
        })
        .sort((a, b) => rank[b.light] - rank[a.light] || b.alerts - a.alerts || a.code.localeCompare(b.code)),
    },
    delivery: {
      firstTimePct: avg(people.map((p) => processById[p.s.id]?.firstTimePct)),
      onTimePct: avg(people.map((p) => processById[p.s.id]?.onTimePct)),
      checklistPct: pct(checklistDone, checklistTotal),
    },
    finance: { withContract: withContract.length, money: [...moneyByCurrency.values()], hoursExecuted: Math.round(hoursExecuted), hoursContracted, rows: financeRows, overBudget: financeRows.filter((f) => f.light === "rojo").length },
    team: { people, ranked, atRisk, average: avg(withScore.map((p) => p.r.performanceScore)), groups, components, process: processById },
    client,
    coverage: { items, pct: coveragePct, sources },
    attention,
  };
}

export function fmtMoney(amount: number, currency: Currency): string {
  return `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(Math.round(amount))} ${currency}`;
}
