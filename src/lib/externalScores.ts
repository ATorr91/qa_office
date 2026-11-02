// Scores that arrive from outside the dashboard — QA status emails (Gmail), NPS surveys (Figma) and the CSAT
// sheet — stored per account in Postgres and rolled up here into per-strategist, per-month numbers.
// Pure functions only: the API route feeds them rows, the client just reads the result.
import { accountByKey } from "./accounts";
import type { MonthKey } from "./strategists";

export type ScoreSource = "qa" | "nps" | "csat";

export interface ScoreRow {
  source: ScoreSource;
  ref: string;
  account: string;
  period: MonthKey;
  data: Record<string, unknown>;
  updatedAt: string;
}

/** One weekly QA status email. */
export interface QaReport {
  ref: string;
  account: string;
  accountName: string;
  project: string;
  release: string | null;
  cutDate: string;
  progress: number | null;
  /** Null when no test had been executed yet (0% progress): a 0% pass rate there means "not run", not "all failed". */
  passRate: number | null;
  status: string | null;
  strategistIds: string[];
}

export interface SurveyComment {
  text: string;
  score: number | null;
  scale: 5 | 10 | null;
  section: "proyecto" | "empresa";
}

/** One client satisfaction survey (Figma). `nps` is the 1-10 "would you recommend us" answer; null while it's still unanswered. */
export interface NpsSurvey {
  ref: string;
  account: string;
  accountName: string;
  surveyDate: string;
  answer: number | null;
  /** Average of the 1-5 answers, shown as "Calificación ⭐" in the survey. */
  rating: number | null;
  ratingDerived: boolean;
  comments: SurveyComment[];
  strategistIds: string[];
}

export interface ExternalMonthScores {
  /** Average pass rate (0-100) of the QA reports cut this month for the strategist's accounts. */
  qaScore: number | null;
  qaReports: number;
  /** NPS (−100…100) = % promoters − % detractors among the surveys answered this month. */
  nps: number | null;
  npsResponses: number;
  /** Average of the 1-5 survey ratings, rescaled to 0-100. */
  satisfaction: number | null;
  /** Average CSAT (0-100) of the account answers this month. */
  csat: number | null;
  csatResponses: number;
}

export type ExternalByStrategist = Record<string, Record<MonthKey, ExternalMonthScores>>;

export interface ExternalScoresResponse {
  configured: boolean;
  error: string | null;
  fetchedAt: string;
  byStrategistId: ExternalByStrategist;
  qaReports: QaReport[];
  npsSurveys: NpsSurvey[];
  /** Latest update per source (ISO), null when nothing has been synced yet. */
  lastSync: Record<ScoreSource, string | null>;
}

export const EMPTY_EXTERNAL_SCORES: ExternalScoresResponse = {
  configured: false,
  error: null,
  fetchedAt: new Date(0).toISOString(),
  byStrategistId: {},
  qaReports: [],
  npsSurveys: [],
  lastSync: { qa: null, nps: null, csat: null },
};

const EMPTY_MONTH: ExternalMonthScores = { qaScore: null, qaReports: 0, nps: null, npsResponses: 0, satisfaction: null, csat: null, csatResponses: 0 };

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

/** NPS bucket of a 0-10 answer: promoters 9-10 → +100, passives 7-8 → 0, detractors 0-6 → −100. */
export function npsPoints(answer: number): number {
  return answer >= 9 ? 100 : answer >= 7 ? 0 : -100;
}

export function aggregateScores(rows: ScoreRow[]): Omit<ExternalScoresResponse, "configured" | "error" | "fetchedAt"> {
  const lastSync: Record<ScoreSource, string | null> = { qa: null, nps: null, csat: null };
  const qaReports: QaReport[] = [];
  const npsSurveys: NpsSurvey[] = [];

  // strategist → month → raw values, folded into ExternalMonthScores at the end.
  const acc = new Map<string, Map<MonthKey, { qa: number[]; nps: number[]; rating: number[]; csat: number[]; csatN: number }>>();
  const bucket = (id: string, month: MonthKey) => {
    const months = acc.get(id) ?? new Map();
    acc.set(id, months);
    const b = months.get(month) ?? { qa: [], nps: [], rating: [], csat: [], csatN: 0 };
    months.set(month, b);
    return b;
  };

  for (const row of rows) {
    if (lastSync[row.source] === null || row.updatedAt > lastSync[row.source]!) lastSync[row.source] = row.updatedAt;
    const account = accountByKey(row.account);
    const owners = account?.strategists ?? [];
    const accountName = account?.name ?? row.account;

    if (row.source === "qa") {
      const passRate = num(row.data.passRate);
      const cutDate = str(row.data.cutDate);
      if (passRate === null || cutDate === null) continue;
      const notRun = num(row.data.progress) === 0;
      qaReports.push({
        ref: row.ref,
        account: row.account,
        accountName,
        project: str(row.data.project) ?? accountName,
        release: str(row.data.release),
        cutDate,
        progress: num(row.data.progress),
        passRate: notRun ? null : passRate,
        status: str(row.data.status),
        strategistIds: owners,
      });
      if (!notRun) for (const id of owners) bucket(id, row.period).qa.push(passRate);
    } else if (row.source === "nps") {
      const answer = num(row.data.answer);
      const rating = num(row.data.rating);
      npsSurveys.push({
        ref: row.ref,
        account: row.account,
        accountName,
        surveyDate: str(row.data.surveyDate) ?? `${row.period}-01`,
        answer,
        rating,
        ratingDerived: row.data.ratingDerived === true,
        comments: Array.isArray(row.data.comments) ? (row.data.comments as SurveyComment[]) : [],
        strategistIds: owners,
      });
      for (const id of owners) {
        const b = bucket(id, row.period);
        if (answer !== null) b.nps.push(npsPoints(answer));
        if (rating !== null) b.rating.push(((rating - 1) / 4) * 100);
      }
    } else {
      const avg = num(row.data.avg);
      if (avg === null) continue;
      const responses = num(row.data.responses) ?? 1;
      for (const id of owners) {
        const b = bucket(id, row.period);
        b.csat.push(avg);
        b.csatN += responses;
      }
    }
  }

  const byStrategistId: ExternalByStrategist = {};
  for (const [id, months] of acc) {
    byStrategistId[id] = {};
    for (const [month, b] of months) {
      const qa = mean(b.qa);
      const nps = mean(b.nps);
      const satisfaction = mean(b.rating);
      const csat = mean(b.csat);
      byStrategistId[id][month] = {
        ...EMPTY_MONTH,
        qaScore: qa === null ? null : Math.round(qa),
        qaReports: b.qa.length,
        nps: nps === null ? null : Math.round(nps),
        npsResponses: b.nps.length,
        satisfaction: satisfaction === null ? null : Math.round(satisfaction),
        csat: csat === null ? null : Math.round(csat),
        csatResponses: b.csatN,
      };
    }
  }

  qaReports.sort((a, b) => b.cutDate.localeCompare(a.cutDate) || a.accountName.localeCompare(b.accountName));
  npsSurveys.sort((a, b) => b.surveyDate.localeCompare(a.surveyDate));
  return { byStrategistId, qaReports, npsSurveys, lastSync };
}
