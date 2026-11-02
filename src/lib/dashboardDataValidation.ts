// Shape checks for what the Admin section writes to the database. Used by the API only; it rebuilds each
// value from known fields, so nothing the client sends beyond the expected shape is ever stored.
import type { ManualMonthlyData } from "@/lib/strategistRecords";
import type { Okr, PeerComment, ProjectAssignment, ProjectStatus } from "@/lib/strategists";

export type DashboardWrite =
  | { kind: "month"; strategistId: string; month: string; data: ManualMonthlyData }
  | { kind: "projects"; strategistId: string; projects: ProjectAssignment[] }
  | { kind: "board"; strategistId: string; projectKeys: string }
  | { kind: "sources"; strategistId: string; jira: boolean; bitacoras: boolean };

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_TEXT = 4000;
const MAX_LIST = 100;

export class ValidationError extends Error {}

function fail(message: string): never {
  throw new ValidationError(message);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function text(v: unknown, label: string): string {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") fail(`${label} debe ser texto.`);
  if (v.length > MAX_TEXT) fail(`${label} es demasiado largo.`);
  return v;
}

function numberOrNull(v: unknown, label: string, min: number, max: number): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) fail(`${label} debe ser un número.`);
  if (v < min || v > max) fail(`${label} debe estar entre ${min} y ${max}.`);
  return v;
}

function list(v: unknown, label: string): unknown[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) fail(`${label} debe ser una lista.`);
  if (v.length > MAX_LIST) fail(`${label} tiene demasiados elementos.`);
  return v;
}

function monthData(v: unknown): ManualMonthlyData {
  if (!isObject(v)) fail("Los datos del mes no son válidos.");
  const okrs: Okr[] = list(v.okrs, "OKRs").map((o) => {
    if (!isObject(o)) fail("Un OKR no es válido.");
    const status = o.status;
    if (status !== "on-track" && status !== "at-risk" && status !== "off-track") fail("Un OKR tiene un estado no válido.");
    return {
      objective: text(o.objective, "Objetivo"),
      keyResult: text(o.keyResult, "Key Result"),
      progress: numberOrNull(o.progress, "Avance del OKR", 0, 100) ?? 0,
      status,
    };
  });
  const peerComments: PeerComment[] = list(v.peerComments, "Comentarios").map((c) => {
    if (!isObject(c)) fail("Un comentario no es válido.");
    if (c.sentiment !== "positivo" && c.sentiment !== "constructivo") fail("Un comentario tiene un tono no válido.");
    return { from: text(c.from, "Autor del comentario"), comment: text(c.comment, "Comentario"), sentiment: c.sentiment };
  });
  return {
    peerReviewScore: numberOrNull(v.peerReviewScore, "Peer review", 0, 100),
    peerReviewCount: numberOrNull(v.peerReviewCount, "Evaluaciones recibidas", 0, 100000),
    peerComments,
    okrCompletion: numberOrNull(v.okrCompletion, "OKRs y KPIs", 0, 100),
    okrs,
    qaScore: numberOrNull(v.qaScore, "Calificación QA", 0, 100),
    qaReviewsCount: numberOrNull(v.qaReviewsCount, "Entregables revisados", 0, 100000),
    qaIssuesFound: numberOrNull(v.qaIssuesFound, "Hallazgos encontrados", 0, 100000),
    npsScore: numberOrNull(v.npsScore, "NPS", -100, 100),
    deadlineCompliance: numberOrNull(v.deadlineCompliance, "Deadlines", 0, 100),
    bitacoraCompliance: numberOrNull(v.bitacoraCompliance, "Bitácoras", 0, 100),
    selfAssessmentBiggestWin: text(v.selfAssessmentBiggestWin, "Mayor victoria"),
    selfAssessmentMistakeLearning: text(v.selfAssessmentMistakeLearning, "Peor error / aprendizaje"),
    selfAssessmentSkillToDevelop: text(v.selfAssessmentSkillToDevelop, "Habilidad a desarrollar"),
  };
}

function projects(v: unknown): ProjectAssignment[] {
  return list(v, "Proyectos").map((p) => {
    if (!isObject(p)) fail("Un proyecto no es válido.");
    const endDate = p.endDate === null || p.endDate === undefined || p.endDate === "" ? null : text(p.endDate, "Fecha de fin");
    const status = p.status === undefined || p.status === null || p.status === "" ? undefined : p.status;
    if (status !== undefined && !["active", "planned", "paused", "completed", "inactive"].includes(status as string)) fail("Un proyecto tiene un estatus no válido.");
    return {
      id: text(p.id, "Id del proyecto") || fail("Un proyecto no tiene id."),
      ...(p.code ? { code: text(p.code, "Código del proyecto") } : {}),
      ...(p.cell ? { cell: text(p.cell, "Célula del proyecto") } : {}),
      ...(status ? { status: status as ProjectStatus } : {}),
      projectName: text(p.projectName, "Nombre del proyecto"),
      client: text(p.client, "Cliente"),
      role: text(p.role, "Rol"),
      startDate: text(p.startDate, "Fecha de inicio"),
      endDate,
      notes: text(p.notes, "Notas"),
    };
  });
}

/** Validates and normalizes one write. Throws ValidationError with a user-readable Spanish message. */
export function parseWrite(raw: unknown, knownStrategistIds: ReadonlySet<string>): DashboardWrite {
  if (!isObject(raw)) fail("Escritura no válida.");
  const strategistId = raw.strategistId;
  if (typeof strategistId !== "string" || !knownStrategistIds.has(strategistId)) fail("Estratega desconocido.");

  if (raw.kind === "month") {
    if (typeof raw.month !== "string" || !MONTH_RE.test(raw.month)) fail("Mes no válido.");
    return { kind: "month", strategistId, month: raw.month, data: monthData(raw.data) };
  }
  if (raw.kind === "projects") return { kind: "projects", strategistId, projects: projects(raw.projects) };
  if (raw.kind === "board") {
    const projectKeys = text(raw.projectKeys, "Project keys");
    if (!/^[A-Za-z0-9_,\s-]*$/.test(projectKeys)) fail("Las claves de proyecto solo pueden tener letras, números, comas y guiones.");
    return { kind: "board", strategistId, projectKeys: projectKeys.trim() };
  }
  if (raw.kind === "sources") {
    if (typeof raw.jira !== "boolean" || typeof raw.bitacoras !== "boolean") fail("Las fuentes deben ser verdadero o falso.");
    return { kind: "sources", strategistId, jira: raw.jira, bitacoras: raw.bitacoras };
  }
  return fail("Tipo de escritura desconocido.");
}
