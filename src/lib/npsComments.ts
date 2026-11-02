// Picks the client comments that matter for a strategist: written answers from the survey of one of their accounts, ranked by whether
// they are about the project (the team's work) rather than BluePixel's commercial/administrative process, whether they name the person
// and whether they point to something to improve.
import type { NpsSurvey } from "./externalScores";
import type { Strategist } from "./strategists";

export type CommentTone = "positivo" | "mixto" | "constructivo" | "sin calificar";

export interface ImportantComment {
  key: string;
  account: string;
  surveyDate: string;
  text: string;
  tone: CommentTone;
  /** "proyecto": about the team's work. "empresa": about BluePixel's commercial or administrative process (shown, but ranked after the project ones). */
  section: "proyecto" | "empresa";
  /** The score that came with it, as "3/5", when there was one. */
  scoreLabel: string | null;
  /** Strategists the comment names (unambiguous first or full name). Empty when it is about the whole account team. */
  mentionedIds: string[];
  /** Owners of the account the survey belongs to. */
  ownerIds: string[];
  rank: number;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Name fragments that identify a strategist without confusing them with someone else or with a common word:
 * the full name; the first name when no one else on the roster shares it; and the last name only when the first name is
 * shared ("Daniel" alone is ambiguous, "Gamboa" is not). Last names that are also everyday words ("buen", "mora") never count alone.
 */
function nameVariants(s: Strategist, roster: readonly Strategist[]): string[] {
  const parts = normalize(s.name).split(/\s+/).filter(Boolean);
  const first = parts[0];
  const variants = [parts.join(" ")];
  const firstIsUnique = roster.filter((x) => normalize(x.name).split(/\s+/)[0] === first).length === 1;
  if (firstIsUnique && first.length >= 4) variants.push(first);
  if (!firstIsUnique && parts.length > 1) {
    variants.push(`${first} ${parts[1]}`);
    const last = parts[parts.length - 1];
    if (last.length >= 5) variants.push(last);
  }
  return [...new Set(variants)];
}

export function mentionedStrategists(text: string, roster: readonly Strategist[]): string[] {
  const t = normalize(text);
  return roster
    .filter((s) => nameVariants(s, roster).some((v) => new RegExp(`(^|[^a-z])${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(t)))
    .map((s) => s.id);
}

export function commentTone(score: number | null, scale: 5 | 10 | null): CommentTone {
  if (score === null || scale === null) return "sin calificar";
  if (scale === 10) return score >= 9 ? "positivo" : score >= 7 ? "mixto" : "constructivo";
  return score >= 4 ? "positivo" : score >= 3 ? "mixto" : "constructivo";
}

/**
 * Important comments for the surveys sent in `months`, for accounts owned by any of `shownIds`.
 * Most relevant first: those that name the strategist, then the ones that ask for improvement, then the longest.
 */
export function importantComments(surveys: NpsSurvey[], roster: readonly Strategist[], months: ReadonlySet<string>, shownIds: ReadonlySet<string>, limit = 8): ImportantComment[] {
  const out: ImportantComment[] = [];
  for (const survey of surveys) {
    if (!months.has(survey.surveyDate.slice(0, 7)) || !survey.strategistIds.some((id) => shownIds.has(id))) continue;
    survey.comments.forEach((c, i) => {
      const tone = commentTone(c.score, c.scale);
      if (c.text.length < 40 && tone !== "constructivo" && tone !== "mixto") return;
      const mentionedIds = mentionedStrategists(c.text, roster);
      const rank = (c.section === "proyecto" ? 10 : 0) + (mentionedIds.length > 0 ? 3 : 0) + (tone === "constructivo" ? 2 : tone === "mixto" ? 1.5 : 0) + (c.text.length >= 120 ? 1 : 0);
      const scoreLabel = c.score !== null && c.scale !== null ? `${c.score}/${c.scale}` : null;
      out.push({ key: `${survey.ref}:${i}`, account: survey.accountName, surveyDate: survey.surveyDate, text: c.text, tone, section: c.section, scoreLabel, mentionedIds, ownerIds: survey.strategistIds, rank });
    });
  }
  return out.sort((a, b) => b.rank - a.rank || b.surveyDate.localeCompare(a.surveyDate)).slice(0, limit);
}
