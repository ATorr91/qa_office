// What the dashboard's own numbers say about a person's strengths and weaknesses, so the profile is not only opinion. Nothing is
// invented: a line appears only when a metric clears a threshold or someone wrote a comment, and each line names its source.
// Thresholds match the colors the dashboard already uses (green from 85, red below 70).
import type { EffectiveRecord } from "./strategistRecords";
import { performanceComponents } from "./strategistRecords";

export const STRONG_FROM = 85;
export const WEAK_BELOW = 70;

export interface Insight {
  text: string;
  /** Where the line comes from: a metric, a peer review or the self-assessment. */
  source: string;
}

const MAX_PER_SIDE = 4;

export function deriveInsights(r: EffectiveRecord): { strengths: Insight[]; weaknesses: Insight[] } {
  const strengths: Insight[] = [];
  const weaknesses: Insight[] = [];

  const scored = performanceComponents(r).filter((c): c is typeof c & { value: number } => c.value !== null);
  for (const c of [...scored].sort((a, b) => b.value - a.value)) if (c.value >= STRONG_FROM) strengths.push({ text: `${c.label}: ${c.value}%`, source: "Evaluación de desempeño" });
  for (const c of [...scored].sort((a, b) => a.value - b.value)) if (c.value < WEAK_BELOW) weaknesses.push({ text: `${c.label}: ${c.value}%`, source: "Evaluación de desempeño" });

  if (r.csatScore !== null && r.csatResponses > 0) {
    if (r.csatScore >= STRONG_FROM) strengths.push({ text: `Satisfacción del cliente (CSAT): ${r.csatScore}%`, source: "Percepción del cliente" });
    else if (r.csatScore < WEAK_BELOW) weaknesses.push({ text: `Satisfacción del cliente (CSAT): ${r.csatScore}%`, source: "Percepción del cliente" });
  }

  for (const c of r.peerComments) {
    const line = { text: c.comment, source: `Peer review de ${c.from}` };
    if (c.sentiment === "positivo") strengths.push(line);
    else weaknesses.push(line);
  }

  const last = r.selfAssessments[r.selfAssessments.length - 1];
  if (last?.biggestWin) strengths.push({ text: last.biggestWin, source: "Autoevaluación: mayor victoria" });
  if (last?.skillToDevelop) weaknesses.push({ text: last.skillToDevelop, source: "Autoevaluación: habilidad a desarrollar" });

  const unique = (items: Insight[]) => items.filter((x, i) => items.findIndex((y) => y.text === x.text) === i).slice(0, MAX_PER_SIDE);
  return { strengths: unique(strengths), weaknesses: unique(weaknesses) };
}
