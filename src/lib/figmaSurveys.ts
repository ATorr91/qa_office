// Reads the client satisfaction surveys out of the Figma file "Encuesta de Satisfacción de clientes". Each survey
// is one page under a "------ENCUESTAS <año>---------" divider; its answers are plain text layers, so the REST
// API returns them as `characters`. Self-contained on purpose (no imports) so it can be tested on its own.

export interface FigmaNode {
  id?: string;
  name?: string;
  type?: string;
  characters?: string;
  children?: FigmaNode[];
}

export interface SurveyPage {
  id: string;
  name: string;
  year: number;
}

/** A written answer from the survey. `section` says whether the question was about the project (the team) or about BluePixel as a company. */
export interface SurveyComment {
  text: string;
  /** The 1-5 (or 1-10 for the NPS reason) score that came with it, when there was one. */
  score: number | null;
  /** The scale `score` is on: 5 for the 1-5 questions, 10 for the NPS reason. */
  scale: 5 | 10 | null;
  section: "proyecto" | "empresa";
}

export interface ParsedSurvey {
  ref: string;
  project: string;
  surveyDate: string;
  /** 1-10 "how likely are you to recommend us"; null while the page is still the blank template (or only a screenshot). */
  answer: number | null;
  /** The survey's "Calificación ⭐" (average of the 1-5 answers) — written on the page, or computed from the answers when it isn't. */
  rating: number | null;
  ratingDerived: boolean;
  comments: SurveyComment[];
}

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, sept: 9, sep: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

function monthNumber(word: string): number | null {
  return MONTHS[word.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")] ?? null;
}

function toNumber(raw: string): number {
  return Number(raw.replace(",", "."));
}

/** Pages of the surveys for `minYear` onwards, found by the year dividers ("------ENCUESTAS 2026---------"). */
export function surveyPages(pages: { id: string; name: string }[], minYear: number): SurveyPage[] {
  const out: SurveyPage[] = [];
  let year: number | null = null;
  for (const page of pages) {
    const divider = page.name.match(/-{3,}\s*ENCUESTAS\s+(\d{4})/i);
    if (divider) {
      year = Number(divider[1]);
      continue;
    }
    if (year !== null && year >= minYear && /^\W*(?:✅|🔄)?\s*\d+\./u.test(page.name.trim())) out.push({ id: page.id, name: page.name, year });
  }
  return out;
}

/** "✅ 6. FMF Liga MX - 9 de Julio" → "FMF Liga MX". */
export function projectFromPageName(name: string): string {
  const withoutNumber = name.replace(/^[^\p{L}\p{N}]*\d+\.\s*/u, "");
  return withoutNumber.replace(/\s+-\s+\d.*$/, "").replace(/\s+\d{1,2}\.?\s+de\s+\w+.*$/i, "").trim();
}

function collectTexts(node: FigmaNode, out: string[] = []): string[] {
  if (node.type === "TEXT" && typeof node.characters === "string") out.push(node.characters.trim());
  for (const child of node.children ?? []) collectTexts(child, out);
  return out;
}

const NOT_A_COMMENT = /^(?:Encuesta\s|Datos del Proyecto|Nombre del cliente|Equipo asignado|Preguntas Orientadas|Product name|Calificaci[oó]n|Resumen$|NPS:)/i;
const PLACEHOLDER = /^(?:n\/?a|na|texto|si|sí|no|\?)\.?$/i;

/** Written answers in reading order: texts that aren't questions, headers or blank-template placeholders. */
export function extractComments(texts: string[], npsAnswer: number | null): SurveyComment[] {
  const comments: SurveyComment[] = [];
  let section: SurveyComment["section"] = "proyecto";
  let lastQuestion = "";
  for (const raw of texts) {
    const t = raw.trim();
    if (/^Preguntas Orientadas a la Empresa/i.test(t)) section = "empresa";
    if (t.includes("¿")) lastQuestion = t;
    if (t === "" || t.includes("¿") || NOT_A_COMMENT.test(t)) continue;
    // Answers about how they found us or whether they'd give a reference are not feedback on the work.
    if (/te enteraste|referencia/i.test(lastQuestion)) continue;

    let text = t;
    let score: number | null = null;
    let scale: SurveyComment["scale"] = null;
    const withScore = t.match(/^[-–]\s*(\d(?:[.,]\d+)?|N\/?A)\s*\/\s*([\s\S]*)$/i);
    const reason = t.match(/^Argumento:\s*([\s\S]*)$/i);
    if (withScore) {
      score = /^N/i.test(withScore[1]) ? null : toNumber(withScore[1]);
      scale = score === null ? null : 5;
      text = withScore[2].trim();
    } else if (reason) {
      score = npsAnswer;
      scale = npsAnswer === null ? null : 10;
      text = reason[1].trim();
    } else if (t.startsWith("- ")) {
      text = t.slice(2).trim();
    }
    // A short answer still matters when it comes with a low score ("Hasta ahora" with a 3).
    const lowScore = score !== null && (scale === 10 ? score <= 6 : score <= 3);
    if (PLACEHOLDER.test(text) || text.length < (lowScore ? 3 : 25)) continue;
    comments.push({ text: text.slice(0, 1200), score, scale, section });
  }
  return comments;
}

export function parseSurveyPage(page: SurveyPage, document: FigmaNode): ParsedSurvey {
  const texts = collectTexts(document);

  let surveyDate: string | null = null;
  for (const t of texts) {
    const m = t.match(/^Encuesta\s+(\d{1,2})\s+de\s+(\p{L}+)\s+del\s+(\d{4})/iu);
    const month = m ? monthNumber(m[2]) : null;
    if (m && month) {
      surveyDate = `${m[3]}-${pad(month)}-${pad(Number(m[1]))}`;
      break;
    }
  }
  if (!surveyDate) {
    const m = page.name.match(/(\d{1,2})\.?\s+de\s+(\p{L}+)/iu);
    const month = m ? monthNumber(m[2]) : null;
    surveyDate = m && month ? `${page.year}-${pad(month)}-${pad(Number(m[1]))}` : `${page.year}-01-01`;
  }

  let answer: number | null = null;
  let rating: number | null = null;
  for (const t of texts) {
    const star = t.match(/^Calificaci[oó]n:\s*(\d(?:[.,]\d+)?)\s*⭐/u);
    if (star) {
      rating = toNumber(star[1]);
      continue;
    }
    const nps = t.match(/^Calificaci[oó]n:\s*(\d{1,2}(?:[.,]\d+)?)\s*$/u);
    if (nps && answer === null) answer = toNumber(nps[1]);
  }

  let ratingDerived = false;
  if (rating === null) {
    // "- 4 / comment" lines hold the 1-5 answers; "NA" ones are skipped.
    const answers = texts.map((t) => t.match(/^[-–]\s*(\d(?:[.,]\d+)?)\s*\//)).filter((m): m is RegExpMatchArray => m !== null).map((m) => toNumber(m[1]));
    if (answers.length >= 3) {
      rating = Math.round((answers.reduce((a, b) => a + b, 0) / answers.length) * 10) / 10;
      ratingDerived = true;
    }
  }

  return {
    ref: `figma:${page.id}`,
    project: projectFromPageName(page.name),
    surveyDate,
    answer,
    rating,
    ratingDerived,
    comments: extractComments(texts, answer),
  };
}
