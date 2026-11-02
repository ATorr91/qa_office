// Static roster + shared types for the Dashboard de Estrategas. There is no fabricated
// data here — actual metrics come from Jira (deadlines, see src/lib/jira.ts) or from
// manual entry via the Admin section (see src/lib/strategistRecords.tsx). A strategist
// with no data entered yet simply has no data; nothing here invents numbers to fill gaps.

/** "YYYY-MM", e.g. "2026-03". */
export type MonthKey = string;

/** A single month ("YYYY-MM") or a whole year's aggregate ("YYYY-anual"). */
export type Period = string;

export const DASHBOARD_LAST_UPDATED = "2026-10-29";

export const [CURRENT_YEAR, CURRENT_MONTH] = DASHBOARD_LAST_UPDATED.split("-").slice(0, 2).map(Number) as [number, number];

export const EARLIEST_YEAR = CURRENT_YEAR - 1;

/** Selectable years in the history/filter UI, oldest first. */
export const YEARS: number[] = Array.from({ length: CURRENT_YEAR - EARLIEST_YEAR + 1 }, (_, i) => EARLIEST_YEAR + i);

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MONTH_NAMES_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function monthKey(year: number, month: number): MonthKey {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthKey(mk: MonthKey): { year: number; month: number } {
  const [year, month] = mk.split("-").map(Number);
  return { year, month };
}

export function getMonthLabel(mk: MonthKey): string {
  const { year, month } = parseMonthKey(mk);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function getMonthShortLabel(mk: MonthKey): string {
  const { month } = parseMonthKey(mk);
  return MONTH_NAMES_SHORT[month - 1];
}

/** Extracts the "YYYY-MM" month a full ISO date ("YYYY-MM-DD...") falls in. */
export function monthFromDate(dateIso: string): MonthKey {
  return dateIso.slice(0, 7);
}

export function isFutureMonth(mk: MonthKey): boolean {
  const { year, month } = parseMonthKey(mk);
  return year > CURRENT_YEAR || (year === CURRENT_YEAR && month > CURRENT_MONTH);
}

/** Nothing gets tracked before this month — the whole dashboard treats earlier months as "no data", not zero. */
export const TRACKING_START_MONTH: MonthKey = "2026-07";

export function isBeforeTrackingStart(mk: MonthKey): boolean {
  return mk < TRACKING_START_MONTH;
}

/** All months in a year that have already happened AND are within the tracked range. */
export function monthsInYear(year: number): MonthKey[] {
  const maxMonth = year === CURRENT_YEAR ? CURRENT_MONTH : year > CURRENT_YEAR ? 0 : 12;
  return Array.from({ length: maxMonth }, (_, i) => monthKey(year, i + 1)).filter((mk) => !isBeforeTrackingStart(mk));
}

/** Every elapsed, tracked month across every selectable year, oldest first — the full history range. */
export function allMonthsWithData(): MonthKey[] {
  return YEARS.flatMap((y) => monthsInYear(y));
}

export function isAnnualPeriod(p: Period): boolean {
  return p.endsWith("-anual");
}

export function annualPeriod(year: number): Period {
  return `${year}-anual`;
}

export function periodYear(p: Period): number {
  return Number(p.split("-")[0]);
}

/** Resolves a period to the concrete list of months it covers — months before tracking started never count. */
export function monthsForPeriod(p: Period): MonthKey[] {
  const months = isAnnualPeriod(p) ? monthsInYear(periodYear(p)) : [p];
  return months.filter((mk) => !isBeforeTrackingStart(mk));
}

export function getPeriodLabel(p: Period): string {
  return isAnnualPeriod(p) ? `Anual ${periodYear(p)}` : getMonthLabel(p);
}

export function getDefaultPeriod(): Period {
  return annualPeriod(CURRENT_YEAR);
}

/** The month immediately before the given one, or null if it's before tracking started. */
export function getPreviousMonth(mk: MonthKey | undefined): MonthKey | null {
  if (!mk) return null;
  const { year, month } = parseMonthKey(mk);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  if (prevYear < EARLIEST_YEAR) return null;
  return monthKey(prevYear, prevMonth);
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

export type ProjectStatus = "active" | "planned" | "paused" | "completed" | "inactive";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Activo",
  planned: "Planeado",
  paused: "En pausa",
  completed: "Terminado",
  inactive: "Inactivo",
};

/** One project a strategist has worked on — not tied to a single month, spans a date range. */
export interface ProjectAssignment {
  id: string;
  /** Tracker code ("395.02"), cell ("Cell 2") and status, when the project comes from the project tracker. */
  code?: string;
  cell?: string;
  status?: ProjectStatus;
  projectName: string;
  client: string;
  role: string;
  startDate: string;
  endDate: string | null;
  notes: string;
}

export interface Strategist {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
  /** Path under /public, or null when there is no photo yet (the avatar then shows initials). */
  photo: string | null;
}

const AVATAR_COLORS = ["var(--bp-blue)", "var(--bp-magenta)", "var(--bp-purple)", "var(--bp-green)", "var(--bp-cyan)"];

// Roster real del equipo de estrategas (10 personas), sin datos ficticios asociados.
const PROFILES: { id: string; name: string; role: string; email: string }[] = [
  { id: "adriana-ruiz", name: "Adriana Ruiz", role: "Estratega", email: "adriana.ruiz@bluepixel.mx" },
  { id: "alexis-aguilar", name: "Alexis Aguilar", role: "Estratega", email: "alexis.aguilar@bluepixel.mx" },
  { id: "daniel-gamboa", name: "Daniel Gamboa", role: "Estratega", email: "daniel.gamboa@bluepixel.mx" },
  { id: "daniel-morfin", name: "Daniel Morfin", role: "Estratega", email: "daniel.morfin@bluepixel.mx" },
  { id: "johanna-quiroga", name: "Johanna Quiroga", role: "Estratega", email: "johanna.quiroga@bluepixel.mx" },
  { id: "jorge-de-buen", name: "Jorge de Buen", role: "Estratega", email: "jorge@bluepixel.mx" },
  { id: "lucero-cervantes", name: "Lucero Cervantes", role: "Estratega", email: "lucero.cervantes@bluepixel.mx" },
  { id: "luis-rodriguez", name: "Luis Rodríguez", role: "Estratega", email: "luis.rodriguez@bluepixel.mx" },
  { id: "camila", name: "Camila Mora", role: "Estratega", email: "camila@bluepixel.mx" },
  { id: "montserrat-hernandez", name: "Montserrat Hernández", role: "Estratega", email: "montserrat.hernandez@bluepixel.mx" },
];

// Photos live in public/strategists/<id>.jpg (taken from the team's email signatures). Add the id here when a new one is dropped in.
const PHOTO_IDS = new Set([
  "adriana-ruiz",
  "alexis-aguilar",
  "camila",
  "daniel-gamboa",
  "johanna-quiroga",
  "jorge-de-buen",
  "lucero-cervantes",
  "luis-rodriguez",
  "montserrat-hernandez",
]);

export const STRATEGISTS: Strategist[] = PROFILES.map((p, i) => ({
  ...p,
  avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
  photo: PHOTO_IDS.has(p.id) ? `/strategists/${p.id}.jpg` : null,
}));

/**
 * Which live sources feed a strategist's metrics. When one is off, that metric is typed by hand in Admin
 * instead (deadlines for people who don't work in Jira, bitácoras for people who aren't on the sheet).
 */
export interface StrategistSources {
  jira: boolean;
  bitacoras: boolean;
}

export const ALL_SOURCES: StrategistSources = { jira: true, bitacoras: true };

// Starting point for people who are known not to be in a live source. Admin can change any of these.
const DEFAULT_SOURCE_OVERRIDES: Record<string, Partial<StrategistSources>> = {
  "daniel-morfin": { jira: false, bitacoras: false },
};

/** A strategist's sources: what Admin saved, else the roster default, else everything live. */
export function resolveSources(strategistId: string, saved?: Partial<StrategistSources>): StrategistSources {
  return { ...ALL_SOURCES, ...DEFAULT_SOURCE_OVERRIDES[strategistId], ...saved };
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
