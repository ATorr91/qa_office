import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/adminAuth";
import { ensureSchema, getPool } from "@/lib/db";
import { todayInMexico } from "@/lib/projectHours";
import { STRATEGISTS } from "@/lib/strategists";
import type { TeamAnalysis } from "@/lib/teamAnalysis";
import { aiConfigured, generateAnalysis } from "@/lib/teamAnalysisServer";

export const maxDuration = 300;

const NO_STORE = { "Cache-Control": "no-store" };
const text = (max: number) => z.string().max(max);
const pct = z.number().min(0).max(100).nullable();
const Snapshot = z.object({
  periodLabel: text(60),
  generatedOn: text(40),
  coveragePct: z.number(),
  teamAverage: pct,
  atRisk: z.array(text(80)).max(20),
  portfolio: z.object({ active: z.number(), red: z.number(), yellow: z.number(), overdueReports: z.number(), unassigned: z.array(text(200)).max(40), pendingScopeChanges: z.number() }),
  attention: z.array(text(400)).max(20),
  groups: z.array(z.object({ group: text(30), people: z.number(), performance: pct, checklist: pct, firstTime: pct, onTime: pct })).max(4),
  people: z
    .array(
      z.object({
        id: text(60),
        name: text(80),
        employment: text(30),
        performance: pct,
        peerReview: pct,
        okr: pct,
        deadlines: pct,
        bitacoras: pct,
        qa: pct,
        csat: pct,
        checklistPct: pct,
        firstTimePct: pct,
        onTimePct: pct,
        activeProjects: z.array(text(120)).max(30),
        strengths: z.array(text(240)).max(8),
        weaknesses: z.array(text(240)).max(8),
      }),
    )
    .max(30),
});

const unauthorized = () => NextResponse.json({ error: "Sesión de admin no válida o vencida." }, { status: 401, headers: NO_STORE });

/** The stored analyses, newest month first. Admin only: they talk about people. */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const pool = getPool();
  if (!pool) return NextResponse.json({ configured: false, aiConfigured: aiConfigured(), analyses: [] }, { headers: NO_STORE });
  try {
    await ensureSchema(pool);
    const rows = await pool.query<{ data: TeamAnalysis }>("select data from team_analysis order by month desc limit 12");
    return NextResponse.json({ configured: true, aiConfigured: aiConfigured(), analyses: rows.rows.map((r) => r.data) }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo leer el historial." }, { status: 500, headers: NO_STORE });
  }
}

/** Generates (or regenerates) this month's analysis from the snapshot the dashboard sends. Admin only: it spends API credit. */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!aiConfigured()) return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY en el servidor." }, { status: 503, headers: NO_STORE });

  const body = (await request.json().catch(() => null)) as { snapshot?: unknown } | null;
  const parsed = Snapshot.safeParse(body?.snapshot);
  if (!parsed.success) return NextResponse.json({ error: "El resumen enviado no es válido." }, { status: 400, headers: NO_STORE });
  const known = new Set(STRATEGISTS.map((s) => s.id));
  const snapshot = { ...parsed.data, people: parsed.data.people.filter((p) => known.has(p.id)) };

  const month = todayInMexico().slice(0, 7);
  const pool = getPool();
  try {
    let previous: TeamAnalysis | null = null;
    if (pool) {
      await ensureSchema(pool);
      const prev = await pool.query<{ data: TeamAnalysis }>("select data from team_analysis where month < $1 order by month desc limit 1", [month]);
      previous = prev.rows[0]?.data ?? null;
    }
    const analysis = await generateAnalysis(snapshot, month, previous);
    if (pool) {
      await pool.query(
        `insert into team_analysis (month, data) values ($1, $2)
         on conflict (month) do update set data = excluded.data, created_at = now()`,
        [month, JSON.stringify(analysis)],
      );
    }
    return NextResponse.json({ analysis, stored: Boolean(pool) }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo generar el análisis." }, { status: 502, headers: NO_STORE });
  }
}
