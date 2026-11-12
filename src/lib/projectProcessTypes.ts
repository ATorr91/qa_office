// Everything the dashboard keeps about one project's progress through the process: the stage it is in, the checklist ticks,
// each stage's acceptance report, SMART objectives, risks, scope changes, the weekly milestone, the contract and hours.
// Client-safe (no server imports): the Admin editor, the dashboard tabs and the API all share these shapes.
import type { StageId } from "./procesoTypes";

export const STAGE_ORDER: StageId[] = ["discovery", "build", "testing", "entrega", "futureproof"];

export type ReportStatus = "pendiente" | "enviado" | "aceptado" | "aceptado_obs" | "no_aceptado";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pendiente: "Pendiente",
  enviado: "Enviado al cliente",
  aceptado: "Aceptado",
  aceptado_obs: "Aceptado con observaciones",
  no_aceptado: "No aceptado",
};

/** The client has answered: the report no longer waits on anyone. */
export const DECIDED_STATUSES: ReportStatus[] = ["aceptado", "aceptado_obs", "no_aceptado"];

export interface StageReport {
  status: ReportStatus;
  /** "YYYY-MM-DD": when the report is due according to the project timeline. */
  dueDate: string | null;
  sentDate: string | null;
  decisionDate: string | null;
  acceptedBy: string;
  notes: string;
}

export interface Objective {
  id: string;
  text: string;
  metric: string;
  unit: string;
  baseline: number | null;
  target: number | null;
  current: number | null;
  dueDate: string | null;
}

export type RiskKind = "riesgo" | "bloqueo" | "critico";
export type RiskSeverity = "baja" | "media" | "alta";

export const RISK_KIND_LABELS: Record<RiskKind, string> = { riesgo: "Riesgo", bloqueo: "Bloqueo", critico: "Criticidad" };
export const RISK_SEVERITY_LABELS: Record<RiskSeverity, string> = { baja: "Baja", media: "Media", alta: "Alta" };

export interface RiskItem {
  id: string;
  kind: RiskKind;
  title: string;
  severity: RiskSeverity;
  owner: string;
  dueDate: string | null;
  status: "abierto" | "cerrado";
  openedOn: string;
  closedOn: string | null;
}

export type ScopeChangeStatus = "pendiente" | "aceptado" | "rechazado";

export interface ScopeChange {
  id: string;
  title: string;
  impactHours: number | null;
  status: ScopeChangeStatus;
  date: string;
}

/** The one milestone of a week, keyed in `milestones` by that week's Monday ("YYYY-MM-DD"). */
export interface WeeklyMilestone {
  title: string;
  done: boolean;
}

export interface PaymentMilestone {
  id: string;
  label: string;
  amount: number;
  dueDate: string | null;
  invoiced: boolean;
  paid: boolean;
}

export type Currency = "MXN" | "USD";

/** What was sold, read from the contract: the finances of a project come from here. */
export interface ContractData {
  amount: number | null;
  currency: Currency;
  contractedHours: number | null;
  startDate: string | null;
  endDate: string | null;
  /** Weeks sold for each stage (FutureProof's quoted weeks included). */
  stageWeeks: Partial<Record<StageId, number>>;
  payments: PaymentMilestone[];
  contractUrl: string;
  notes: string;
}

export const HANDOFF_ITEMS = [
  { id: "info", label: "Información del proyecto" },
  { id: "prd", label: "PRD claro y completo" },
  { id: "contrato", label: "Contrato con alcance y semanas por etapa" },
  { id: "carpeta", label: "Carpeta de Drive con la estructura estándar" },
  { id: "cliente", label: "Datos y contactos del cliente" },
  { id: "supuestos", label: "Supuestos de alcance explícitos" },
] as const;

export type HandoffItemId = (typeof HANDOFF_ITEMS)[number]["id"];
export type HandoffMark = "completo" | "parcial" | "faltante";

export const HANDOFF_MARK_LABELS: Record<HandoffMark, string> = { completo: "Completo", parcial: "Parcial", faltante: "Falta" };

/** Evaluation of what Comercial handed over. It grades the handoff, not the strategist. */
export interface HandoffReview {
  items: Partial<Record<HandoffItemId, HandoffMark>>;
  notes: string;
  reviewedOn: string | null;
}

export interface ProjectLinks {
  drive: string;
  prd: string;
  readme: string;
}

export interface ProjectProcessData {
  stage: StageId;
  /** Ticked checklist items, by `checklistKey`. */
  checklist: Record<string, boolean>;
  reports: Partial<Record<StageId, StageReport>>;
  objectives: Objective[];
  risks: RiskItem[];
  scopeChanges: ScopeChange[];
  milestones: Record<string, WeeklyMilestone>;
  contract: ContractData | null;
  links: ProjectLinks;
  handoff: HandoffReview;
  /** Hours typed by hand while the team doesn't log time in Jira: week's Monday → strategist id → hours. */
  manualHours: Record<string, Record<string, number>>;
  /** Hours per week each strategist is planned to give this project. */
  allocations: Record<string, number>;
}

export const EMPTY_PROJECT_PROCESS: ProjectProcessData = {
  stage: "discovery",
  checklist: {},
  reports: {},
  objectives: [],
  risks: [],
  scopeChanges: [],
  milestones: {},
  contract: null,
  links: { drive: "", prd: "", readme: "" },
  handoff: { items: {}, notes: "", reviewedOn: null },
  manualHours: {},
  allocations: {},
};

export const EMPTY_CONTRACT: ContractData = {
  amount: null,
  currency: "MXN",
  contractedHours: null,
  startDate: null,
  endDate: null,
  stageWeeks: {},
  payments: [],
  contractUrl: "",
  notes: "",
};

/** Weekly hours each person can give when Admin hasn't set anything. Jira doesn't hold capacity, so this is a setting, not a reading. */
export const DEFAULT_WEEKLY_CAPACITY = 40;

/** What the team writes down about a person, one short sentence per item. Typed in Admin; the dashboard adds what the data says on top. */
export interface ProfileNotes {
  strengths: string[];
  weaknesses: string[];
}

export const EMPTY_PROFILE_NOTES: ProfileNotes = { strengths: [], weaknesses: [] };

export const MAX_PROFILE_ITEMS = 8;
export const MAX_PROFILE_ITEM_LENGTH = 220;

export interface DashboardSettings {
  /** Strategist id → hours per week. */
  weeklyHours: Record<string, number>;
  /** Strategist id → strengths and weaknesses. */
  profiles: Record<string, ProfileNotes>;
  /** `sopKey` → link to the team's own document for that SOP (Drive, Notion...). */
  sopLinks: Record<string, string>;
}

export const EMPTY_SETTINGS: DashboardSettings = { weeklyHours: {}, profiles: {}, sopLinks: {} };

export const TOOLS = [
  "Claude Cowork",
  "Claude Code",
  "Figma",
  "Jira",
  "Google Drive",
  "Tactiq",
  "NotebookLM",
  "Excel",
  "Mobbin",
  "MixPanel",
  "Google Analytics",
  "Impath",
] as const;

export interface ToolUsageRow {
  day: string;
  tool: string;
  strategistId: string;
  /** Catalog project id, or "" when the usage isn't tied to one. */
  projectId: string;
  units: number;
  /** What `units` counts: "sesiones", "versiones", "tickets"... */
  unit: string;
  origin: string;
}

/** A stable key for one SOP of a stage, from its title, so reordering the SOPs does not move their links. */
export function sopKey(stageId: StageId, title: string): string {
  return checklistKey(stageId, `sop:${title}`);
}

/** A stable key for a checklist item that doesn't move if items are reordered or added. */
export function checklistKey(stageId: StageId, text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${stageId}:${(h >>> 0).toString(36)}`;
}
