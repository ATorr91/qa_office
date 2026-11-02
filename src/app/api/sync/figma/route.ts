import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getPool } from "@/lib/db";
import { hasAutomationSecret, IngestError, parseIngest, upsertScores } from "@/lib/externalScoresStore";
import { parseSurveyPage, surveyPages, type FigmaNode } from "@/lib/figmaSurveys";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };
const FILE_KEY = process.env.FIGMA_FILE_KEY || "mRho5FbediwfbXutd2elxQ";
/** Surveys from before the dashboard started tracking aren't pulled. */
const MIN_YEAR = 2026;

async function figma<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://api.figma.com/v1${path}`, { headers: { "X-Figma-Token": token }, cache: "no-store" });
  if (!res.ok) throw new Error(res.status === 403 || res.status === 401 ? "Figma rechazó el token (FIGMA_TOKEN)." : `Figma respondió ${res.status}.`);
  return (await res.json()) as T;
}

/**
 * Re-reads every NPS survey page of the Figma file and saves the answers. Called daily by Vercel cron
 * (Authorization: Bearer CRON_SECRET), by hand with INGEST_SECRET, or from an admin session.
 */
export async function GET(request: NextRequest) {
  if (!hasAutomationSecret(request) && !isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE });
  const token = process.env.FIGMA_TOKEN;
  if (!token) return NextResponse.json({ error: "FIGMA_TOKEN no está configurada en el servidor." }, { status: 503, headers: NO_STORE });
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "DATABASE_URL no está configurada en el servidor." }, { status: 503, headers: NO_STORE });

  try {
    const file = await figma<{ document: { children: { id: string; name: string }[] } }>(`/files/${FILE_KEY}?depth=1`, token);
    const pages = surveyPages(file.document.children, MIN_YEAR);
    if (pages.length === 0) return NextResponse.json({ ok: true, surveys: [], saved: 0 }, { headers: NO_STORE });

    const nodes = await figma<{ nodes: Record<string, { document: FigmaNode } | null> }>(`/files/${FILE_KEY}/nodes?ids=${pages.map((p) => encodeURIComponent(p.id)).join(",")}`, token);
    const surveys = pages.flatMap((page) => {
      const document = nodes.nodes[page.id]?.document;
      return document ? [parseSurveyPage(page, document)] : [];
    });
    const saved = await upsertScores(pool, parseIngest("nps", { rows: surveys }), "sync");
    return NextResponse.json({ ok: true, saved, surveys: surveys.map((s) => ({ project: s.project, surveyDate: s.surveyDate, answer: s.answer, rating: s.rating })) }, { headers: NO_STORE });
  } catch (err) {
    const status = err instanceof IngestError ? 400 : 502;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido al leer Figma." }, { status, headers: NO_STORE });
  }
}
