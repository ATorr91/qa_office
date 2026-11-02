// Shared shapes for the strategists' self-evaluation surveys (client and server). A survey is one "run": it is
// created (or scheduled), emailed to each strategist with a response window, reminded, and closed.

/** What a rating question is about; each one with a number behind it is compared with the real metric (perception vs. reality). */
export type Dimension = "deadlines" | "bitacoras" | "qa" | "peer" | "okr" | "csat" | "overall";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  deadlines: "Deadlines",
  bitacoras: "Bitácoras",
  qa: "Calificación QA",
  peer: "Peer review",
  okr: "OKRs y KPIs",
  csat: "Satisfacción del cliente (CSAT)",
  overall: "Desempeño general",
};

export interface SelfEvalQuestion {
  id: string;
  type: "rating" | "text";
  label: string;
  /** Only for ratings: the metric this answer is compared against. */
  dimension: Dimension | null;
  required: boolean;
}

export const RATING_MAX = 5;
export const DEFAULT_WINDOW_HOURS = 24;
/** Hours before the survey closes at which a reminder goes to whoever hasn't answered. */
export const DEFAULT_REMINDER_HOURS = [12, 3];

export const DEFAULT_QUESTIONS: SelfEvalQuestion[] = [
  { id: "deadlines", type: "rating", label: "¿Cómo calificas tu cumplimiento de deadlines en el periodo?", dimension: "deadlines", required: true },
  { id: "bitacoras", type: "rating", label: "¿Cómo calificas tu constancia con las bitácoras?", dimension: "bitacoras", required: true },
  { id: "qa", type: "rating", label: "¿Cómo calificas la calidad de tus entregables (lo que revisa QA)?", dimension: "qa", required: true },
  { id: "peer", type: "rating", label: "¿Cómo crees que te calificarían tus compañeros?", dimension: "peer", required: true },
  { id: "okr", type: "rating", label: "¿Qué tanto avanzaste en tus OKRs y KPIs?", dimension: "okr", required: true },
  { id: "csat", type: "rating", label: "¿Qué tan satisfechos crees que están tus clientes con tu trabajo?", dimension: "csat", required: true },
  { id: "overall", type: "rating", label: "En general, ¿cómo calificas tu desempeño del periodo?", dimension: "overall", required: true },
  { id: "win", type: "text", label: "¿Cuál fue tu mayor logro del periodo?", dimension: null, required: false },
  { id: "learning", type: "text", label: "¿Cuál fue tu peor error o tu mayor aprendizaje?", dimension: null, required: false },
  { id: "skill", type: "text", label: "¿Qué habilidad quieres desarrollar?", dimension: null, required: false },
  { id: "support", type: "text", label: "¿Qué apoyo necesitas del equipo o de liderazgo?", dimension: null, required: false },
];

export type SurveyStatus = "scheduled" | "open" | "closed" | "cancelled";
export type InviteStatus = "pending" | "sent" | "answered" | "expired";

export const SURVEY_STATUS_LABEL: Record<SurveyStatus, string> = {
  scheduled: "Programada",
  open: "Abierta",
  closed: "Cerrada",
  cancelled: "Cancelada",
};

export const INVITE_STATUS_LABEL: Record<InviteStatus, string> = {
  pending: "Sin enviar",
  sent: "Enviada",
  answered: "Respondió",
  expired: "Sin respuesta",
};

/** Answers keyed by question id: a 1-5 number for ratings, text for the rest. */
export type SelfEvalAnswers = Record<string, number | string>;

export interface SurveySummary {
  id: string;
  title: string;
  period: string;
  status: SurveyStatus;
  sendAt: string | null;
  sentAt: string | null;
  closesAt: string | null;
  windowHours: number;
  reminderHours: number[];
  repeatMonthly: boolean;
  createdAt: string;
  invited: number;
  answered: number;
}

export interface InviteDetail {
  strategistId: string;
  email: string;
  token: string;
  status: InviteStatus;
  sentAt: string | null;
  remindersSent: number;
  lastReminderAt: string | null;
  answeredAt: string | null;
}

export interface SurveyEvent {
  id: number;
  strategistId: string | null;
  type: string;
  detail: string;
  at: string;
}

export interface SurveyDetail {
  survey: SurveySummary & { questions: SelfEvalQuestion[] };
  invites: InviteDetail[];
  responses: Record<string, SelfEvalAnswers>;
  events: SurveyEvent[];
}

export interface MailStatus {
  /** "resend" sends straight from the server; "outbox" leaves emails queued for the Google Apps Script worker to deliver. */
  provider: "resend" | "outbox";
  queued: number;
  failed: number;
}

export interface CreateSurveyInput {
  title: string;
  period: string;
  questions: SelfEvalQuestion[];
  recipients: { strategistId: string; email: string }[];
  /** ISO date-time to send at; null sends right away. */
  sendAt: string | null;
  windowHours: number;
  reminderHours: number[];
  repeatMonthly: boolean;
}

export type SurveyAction = "close" | "extend" | "remind" | "resend" | "cancel" | "send-now";

/** Rating answers on a 1-5 scale as 0-100, the way CSAT is shown. */
export function ratingToPercent(value: number): number {
  return Math.round((value / RATING_MAX) * 100);
}
