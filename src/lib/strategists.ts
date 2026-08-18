// Static roster + shared types for the Dashboard de Estrategas. There is no fabricated
// data here — actual metrics come from Jira (deadlines, see src/lib/jira.ts) or from
// manual entry via the Admin section (see src/lib/strategistRecords.tsx). A strategist
// with no data entered yet simply has no data; nothing here invents numbers to fill gaps.

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export const QUARTER_LABELS: Record<Quarter, string> = {
  Q1: "Q1 2026",
  Q2: "Q2 2026",
  Q3: "Q3 2026",
  Q4: "Q4 2026",
};

export const QUARTER_RANGES: Record<Quarter, [string, string]> = {
  Q1: ["2026-01-01", "2026-03-31"],
  Q2: ["2026-04-01", "2026-06-30"],
  Q3: ["2026-07-01", "2026-09-30"],
  Q4: ["2026-10-01", "2026-12-31"],
};

/** Quarters that have already happened as of the dashboard's "as of" date — Q4 hasn't started yet. */
export const QUARTERS_WITH_DATA: Quarter[] = ["Q1", "Q2", "Q3"];

export const DASHBOARD_LAST_UPDATED = "2026-08-17";

export function quarterFromDate(dateIso: string): Quarter {
  const month = new Date(`${dateIso}T00:00:00`).getMonth(); // 0-11
  if (month <= 2) return "Q1";
  if (month <= 5) return "Q2";
  if (month <= 8) return "Q3";
  return "Q4";
}

export type OkrStatus = "on-track" | "at-risk" | "off-track";

export const OKR_STATUS_LABELS: Record<OkrStatus, string> = {
  "on-track": "En curso",
  "at-risk": "En riesgo",
  "off-track": "Fuera de curso",
};

export function okrStatusFromProgress(progress: number): OkrStatus {
  if (progress >= 72) return "on-track";
  if (progress >= 50) return "at-risk";
  return "off-track";
}

export interface Okr {
  objective: string;
  keyResult: string;
  progress: number;
  status: OkrStatus;
}

export type CommentSentiment = "positivo" | "constructivo";

export interface PeerComment {
  from: string;
  comment: string;
  sentiment: CommentSentiment;
}

export interface SelfAssessment {
  biggestWin: string;
  mistakeLearning: string;
  skillToDevelop: string;
}

export interface Strategist {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
}

const AVATAR_COLORS = ["var(--bp-blue)", "var(--bp-magenta)", "var(--bp-purple)", "var(--bp-green)", "var(--bp-cyan)"];

// Roster real del equipo de estrategas (10 personas), sin datos ficticios asociados.
const PROFILES: { id: string; name: string; role: string; email: string }[] = [
  { id: "adriana-ruiz", name: "Adriana Ruiz", role: "Estratega", email: "adriana.ruiz@bluepixel.mx" },
  { id: "alexis-aguilar", name: "Alexis Aguilar", role: "Estratega", email: "alexis.aguilar@bluepixel.mx" },
  { id: "carlos-gonzalez", name: "Carlos González", role: "Estratega", email: "carlos.gonzalez@bluepixel.mx" },
  { id: "daniel-gamboa", name: "Daniel Gamboa", role: "Estratega", email: "daniel.gamboa@bluepixel.mx" },
  { id: "johanna-quiroga", name: "Johanna Quiroga", role: "Estratega", email: "johanna.quiroga@bluepixel.mx" },
  { id: "jorge-carballo", name: "Jorge Carballo", role: "Estratega", email: "jorge@bluepixel.mx" },
  { id: "lucero-cervantes", name: "Lucero Cervantes", role: "Estratega", email: "lucero.cervantes@bluepixel.mx" },
  { id: "luis-rodriguez", name: "Luis Rodríguez", role: "Estratega", email: "luis.rodriguez@bluepixel.mx" },
  { id: "camila", name: "Camila", role: "Estratega", email: "camila@bluepixel.mx" },
  { id: "montserrat-hernandez", name: "Montserrat Hernández", role: "Estratega", email: "montserrat.hernandez@bluepixel.mx" },
];

export const STRATEGISTS: Strategist[] = PROFILES.map((p, i) => ({
  ...p,
  avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
}));

export function getPeriodLabel(period: Quarter | "anual"): string {
  return period === "anual" ? "Anual" : QUARTER_LABELS[period];
}

/** The quarter with data immediately before the given one, or null if it's the first. */
export function getPreviousQuarter(quarter: Quarter): Quarter | null {
  const idx = QUARTERS_WITH_DATA.indexOf(quarter);
  if (idx <= 0) return null;
  return QUARTERS_WITH_DATA[idx - 1];
}

export function daysSince(dateIso: string): number {
  return Math.round((Date.now() - new Date(`${dateIso}T00:00:00`).getTime()) / 86_400_000);
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function pct(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return clamp((part / whole) * 100);
}
