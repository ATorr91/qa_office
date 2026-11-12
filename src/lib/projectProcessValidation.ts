// Cleans whatever the client sends before it is stored: unknown shapes are dropped, strings and lists are capped, numbers must be
// finite. Pure (no server imports) so the same function also tidies what comes back from browser storage.
import { checklistKey, DEFAULT_WEEKLY_CAPACITY, EMPTY_CONTRACT, EMPTY_PROJECT_PROCESS, HANDOFF_ITEMS, MAX_PROFILE_ITEM_LENGTH, MAX_PROFILE_ITEMS, STAGE_ORDER } from "./projectProcessTypes";
import type {
  ContractData,
  Currency,
  DashboardSettings,
  HandoffMark,
  HandoffReview,
  Objective,
  PaymentMilestone,
  ProjectLinks,
  ProjectProcessData,
  ReportStatus,
  RiskItem,
  RiskKind,
  RiskSeverity,
  ScopeChange,
  ScopeChangeStatus,
  StageReport,
  WeeklyMilestone,
} from "./projectProcessTypes";
import type { StageId } from "./procesoTypes";

export class ValidationError extends Error {}

const MAX_TEXT = 2000;
const MAX_ITEMS = 200;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function text(v: unknown, max = MAX_TEXT): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}
function date(v: unknown): string | null {
  return typeof v === "string" && DATE.test(v) && !Number.isNaN(Date.parse(v)) ? v : null;
}
function num(v: unknown, min = -1e12, max = 1e12): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null;
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
function list<T>(v: unknown, each: (x: unknown) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, MAX_ITEMS).map(each).filter((x): x is T => x !== null);
}
function id(v: unknown): string {
  const s = typeof v === "string" ? v.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) : "";
  return s || Math.random().toString(36).slice(2, 10);
}
/** Only http(s) links are kept, so a stored value can never become a script URL. */
function url(v: unknown): string {
  const s = text(v, 500);
  return /^https?:\/\//i.test(s) ? s : "";
}

const REPORT_STATUSES = ["pendiente", "enviado", "aceptado", "aceptado_obs", "no_aceptado"] as const satisfies readonly ReportStatus[];
const RISK_KINDS = ["riesgo", "bloqueo", "critico"] as const satisfies readonly RiskKind[];
const RISK_SEVERITIES = ["baja", "media", "alta"] as const satisfies readonly RiskSeverity[];
const SCOPE_STATUSES = ["pendiente", "aceptado", "rechazado"] as const satisfies readonly ScopeChangeStatus[];
const MARKS = ["completo", "parcial", "faltante"] as const satisfies readonly HandoffMark[];

function report(v: unknown): StageReport | null {
  if (!isObj(v)) return null;
  return {
    status: oneOf(v.status, REPORT_STATUSES, "pendiente"),
    dueDate: date(v.dueDate),
    sentDate: date(v.sentDate),
    decisionDate: date(v.decisionDate),
    acceptedBy: text(v.acceptedBy, 200),
    notes: text(v.notes),
  };
}

function objective(v: unknown): Objective | null {
  if (!isObj(v) || text(v.text) === "") return null;
  return { id: id(v.id), text: text(v.text), metric: text(v.metric, 200), unit: text(v.unit, 30), baseline: num(v.baseline), target: num(v.target), current: num(v.current), dueDate: date(v.dueDate) };
}

function risk(v: unknown): RiskItem | null {
  if (!isObj(v) || text(v.title) === "") return null;
  const status = v.status === "cerrado" ? "cerrado" : "abierto";
  return {
    id: id(v.id),
    kind: oneOf(v.kind, RISK_KINDS, "riesgo"),
    title: text(v.title, 300),
    severity: oneOf(v.severity, RISK_SEVERITIES, "media"),
    owner: text(v.owner, 120),
    dueDate: date(v.dueDate),
    status,
    openedOn: date(v.openedOn) ?? new Date().toISOString().slice(0, 10),
    closedOn: status === "cerrado" ? (date(v.closedOn) ?? new Date().toISOString().slice(0, 10)) : null,
  };
}

function scopeChange(v: unknown): ScopeChange | null {
  if (!isObj(v) || text(v.title) === "") return null;
  return { id: id(v.id), title: text(v.title, 300), impactHours: num(v.impactHours, -100000, 100000), status: oneOf(v.status, SCOPE_STATUSES, "pendiente"), date: date(v.date) ?? new Date().toISOString().slice(0, 10) };
}

function payment(v: unknown): PaymentMilestone | null {
  if (!isObj(v)) return null;
  const amount = num(v.amount, 0);
  if (amount === null || text(v.label, 200) === "") return null;
  return { id: id(v.id), label: text(v.label, 200), amount, dueDate: date(v.dueDate), invoiced: v.invoiced === true, paid: v.paid === true };
}

function contract(v: unknown): ContractData | null {
  if (!isObj(v)) return null;
  const stageWeeks: ContractData["stageWeeks"] = {};
  if (isObj(v.stageWeeks)) for (const stage of STAGE_ORDER) {
    const weeks = num(v.stageWeeks[stage], 0, 520);
    if (weeks !== null) stageWeeks[stage] = weeks;
  }
  return {
    amount: num(v.amount, 0),
    currency: oneOf<Currency>(v.currency, ["MXN", "USD"], EMPTY_CONTRACT.currency),
    contractedHours: num(v.contractedHours, 0, 1e6),
    startDate: date(v.startDate),
    endDate: date(v.endDate),
    stageWeeks,
    payments: list(v.payments, payment),
    contractUrl: url(v.contractUrl),
    notes: text(v.notes),
  };
}

function links(v: unknown): ProjectLinks {
  const o = isObj(v) ? v : {};
  return { drive: url(o.drive), prd: url(o.prd), readme: url(o.readme) };
}

function handoff(v: unknown): HandoffReview {
  const o = isObj(v) ? v : {};
  const items: HandoffReview["items"] = {};
  if (isObj(o.items)) for (const item of HANDOFF_ITEMS) {
    const mark = o.items[item.id];
    if (typeof mark === "string" && (MARKS as readonly string[]).includes(mark)) items[item.id] = mark as HandoffMark;
  }
  return { items, notes: text(o.notes), reviewedOn: date(o.reviewedOn) };
}

/** A week key is the Monday's date; anything else is dropped. */
function weekKeyed<T>(v: unknown, each: (x: unknown) => T | null): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isObj(v)) return out;
  for (const [k, value] of Object.entries(v).slice(0, 400)) {
    const week = date(k);
    const parsed = week ? each(value) : null;
    if (week && parsed !== null) out[week] = parsed;
  }
  return out;
}

function hoursMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isObj(v)) return out;
  for (const [k, value] of Object.entries(v).slice(0, 50)) {
    const hours = num(value, 0, 168);
    if (/^[a-z0-9-]{1,60}$/.test(k) && hours !== null) out[k] = hours;
  }
  return out;
}

export function sanitizeProjectProcess(input: unknown, knownStrategistIds?: ReadonlySet<string>): ProjectProcessData {
  if (!isObj(input)) throw new ValidationError("Datos del proyecto no válidos.");
  const checklist: Record<string, boolean> = {};
  if (isObj(input.checklist)) for (const [k, value] of Object.entries(input.checklist).slice(0, 600)) if (value === true && /^[a-z]+:[a-z0-9]{1,10}$/.test(k)) checklist[k] = true;

  const reports: ProjectProcessData["reports"] = {};
  if (isObj(input.reports)) for (const stage of STAGE_ORDER) {
    const r = report(input.reports[stage]);
    if (r) reports[stage] = r;
  }

  const manualHours = weekKeyed(input.manualHours, hoursMap);
  const allocations = hoursMap(input.allocations);
  const keep = (m: Record<string, number>) => (knownStrategistIds ? Object.fromEntries(Object.entries(m).filter(([k]) => knownStrategistIds.has(k))) : m);

  return {
    stage: oneOf<StageId>(input.stage, STAGE_ORDER, EMPTY_PROJECT_PROCESS.stage),
    checklist,
    reports,
    objectives: list(input.objectives, objective),
    risks: list(input.risks, risk),
    scopeChanges: list(input.scopeChanges, scopeChange),
    milestones: weekKeyed(input.milestones, (m): WeeklyMilestone | null => (isObj(m) && text(m.title, 300) !== "" ? { title: text(m.title, 300), done: m.done === true } : null)),
    contract: contract(input.contract),
    links: links(input.links),
    handoff: handoff(input.handoff),
    manualHours: Object.fromEntries(Object.entries(manualHours).map(([week, m]) => [week, keep(m)])),
    allocations: keep(allocations),
  };
}

export function sanitizeSettings(input: unknown, knownStrategistIds?: ReadonlySet<string>): DashboardSettings {
  if (!isObj(input)) throw new ValidationError("Ajustes no válidos.");
  const weeklyHours: Record<string, number> = {};
  if (isObj(input.weeklyHours)) for (const [k, value] of Object.entries(input.weeklyHours)) {
    const hours = num(value, 1, 80);
    if (hours !== null && /^[a-z0-9-]{1,60}$/.test(k) && (!knownStrategistIds || knownStrategistIds.has(k))) weeklyHours[k] = hours;
  }
  const profiles: DashboardSettings["profiles"] = {};
  if (isObj(input.profiles)) for (const [k, value] of Object.entries(input.profiles)) {
    if (!isObj(value) || !/^[a-z0-9-]{1,60}$/.test(k) || (knownStrategistIds && !knownStrategistIds.has(k))) continue;
    const items = (v: unknown) => (Array.isArray(v) ? v : []).map((x) => text(x, MAX_PROFILE_ITEM_LENGTH)).filter((x) => x !== "").slice(0, MAX_PROFILE_ITEMS);
    const notes = { strengths: items(value.strengths), weaknesses: items(value.weaknesses) };
    if (notes.strengths.length > 0 || notes.weaknesses.length > 0) profiles[k] = notes;
  }
  const sopLinks: Record<string, string> = {};
  if (isObj(input.sopLinks)) for (const [k, value] of Object.entries(input.sopLinks)) {
    const link = url(value);
    if (link && /^[a-z]+:[a-z0-9]{1,12}$/.test(k)) sopLinks[k] = link;
  }
  return { weeklyHours, profiles, sopLinks };
}

/** The weekly capacity to use for a person: what Admin set, else the default. */
export function capacityOf(settings: DashboardSettings, strategistId: string): number {
  return settings.weeklyHours[strategistId] ?? DEFAULT_WEEKLY_CAPACITY;
}

export { checklistKey };
