// Shapes of the monthly team analysis (what the AI proposes the director do with the team) and of the compact snapshot of the
// dashboard that is sent to produce it. Client-safe: the server module (teamAnalysisServer.ts) validates and uses the same shapes.
import type { Cerebro } from "./cerebro";
import { EMPLOYMENT_LABELS, type Strategist } from "./strategists";
import type { ProfileNotes } from "./projectProcessTypes";

export type ActionPriority = "alta" | "media" | "baja";

export interface TeamAction {
  priority: ActionPriority;
  action: string;
  why: string;
  /** Who does it: "Dirección" or a person's first name. */
  owner: string;
}

export interface PersonAnalysis {
  strategistId: string;
  headline: string;
  actions: { action: string; why: string }[];
}

export interface FollowUp {
  action: string;
  status: "avanzo" | "sin_evidencia" | "cambio_contexto";
  note: string;
}

export interface TeamAnalysis {
  /** "YYYY-MM": the month the analysis is for. */
  month: string;
  generatedAt: string;
  model: string;
  summary: string;
  teamActions: TeamAction[];
  people: PersonAnalysis[];
  /** What happened with the previous month's actions, when there was an analysis. */
  followUp: FollowUp[];
}

export interface SnapshotPerson {
  id: string;
  name: string;
  employment: string;
  performance: number | null;
  peerReview: number | null;
  okr: number | null;
  deadlines: number | null;
  bitacoras: number | null;
  qa: number | null;
  csat: number | null;
  checklistPct: number | null;
  firstTimePct: number | null;
  onTimePct: number | null;
  activeProjects: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface AnalysisSnapshot {
  periodLabel: string;
  generatedOn: string;
  coveragePct: number;
  teamAverage: number | null;
  atRisk: string[];
  portfolio: { active: number; red: number; yellow: number; overdueReports: number; unassigned: string[]; pendingScopeChanges: number };
  attention: string[];
  groups: { group: string; people: number; performance: number | null; checklist: number | null; firstTime: number | null; onTime: number | null }[];
  people: SnapshotPerson[];
}

/** Compact, name-bearing summary of the dashboard for the analysis. Only what the reading needs: no emails, no contract amounts. */
export function buildSnapshot(c: Cerebro, periodLabel: string, generatedOn: string, notes: Record<string, ProfileNotes>, ownedProjects: (s: Strategist) => string[]): AnalysisSnapshot {
  return {
    periodLabel,
    generatedOn,
    coveragePct: c.coverage.pct,
    teamAverage: c.team.average,
    atRisk: c.team.atRisk.map((p) => p.s.name),
    portfolio: {
      active: c.portfolio.active,
      red: c.portfolio.lights.rojo,
      yellow: c.portfolio.lights.amarillo,
      overdueReports: c.portfolio.overdueReports,
      unassigned: c.portfolio.unassigned,
      pendingScopeChanges: c.portfolio.pendingScopeChanges,
    },
    attention: c.attention.slice(0, 12).map((a) => `${a.level}: ${a.text}`),
    groups: c.team.groups.map((g) => ({ group: EMPLOYMENT_LABELS[g.employment], people: g.people, performance: g.performance, checklist: g.checklist, firstTime: g.firstTime, onTime: g.onTime })),
    people: c.team.people.map(({ s, r }) => ({
      id: s.id,
      name: s.name,
      employment: EMPLOYMENT_LABELS[s.employment],
      performance: r.performanceScore,
      peerReview: r.peerReviewScore,
      okr: r.okrCompletion,
      deadlines: r.deadlineComplianceRate,
      bitacoras: r.bitacoraComplianceRate,
      qa: r.qaScore,
      csat: r.csatScore,
      checklistPct: c.team.process[s.id]?.checklistPct ?? null,
      firstTimePct: c.team.process[s.id]?.firstTimePct ?? null,
      onTimePct: c.team.process[s.id]?.onTimePct ?? null,
      activeProjects: ownedProjects(s),
      strengths: notes[s.id]?.strengths ?? [],
      weaknesses: notes[s.id]?.weaknesses ?? [],
    })),
  };
}

export const currentMonth = (today: string) => today.slice(0, 7);
