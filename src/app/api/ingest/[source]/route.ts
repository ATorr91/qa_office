import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { hasAutomationSecret, IngestError, parseIngest, upsertScores } from "@/lib/externalScoresStore";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Receives scores from the automations that live in Google (Apps Script reading Gmail for QA and the CSAT sheet).
 * Body: `{ rows: [...] }`, header `Authorization: Bearer <INGEST_SECRET>`. Sending the same rows again is harmless.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  if (!process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "INGEST_SECRET no está configurada en el servidor." }, { status: 503, headers: NO_STORE });
  }
  if (!hasAutomationSecret(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE });

  const { source } = await params;
  if (source !== "qa" && source !== "csat" && source !== "nps") return NextResponse.json({ error: "Fuente desconocida." }, { status: 404, headers: NO_STORE });
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "DATABASE_URL no está configurada en el servidor." }, { status: 503, headers: NO_STORE });

  try {
    const rows = parseIngest(source, await request.json().catch(() => null));
    const saved = await upsertScores(pool, rows, request.headers.get("x-origin") === "manual" ? "manual" : "sync");
    return NextResponse.json({ ok: true, saved }, { headers: NO_STORE });
  } catch (err) {
    if (err instanceof IngestError) return NextResponse.json({ error: err.message }, { status: 400, headers: NO_STORE });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido al guardar." }, { status: 500, headers: NO_STORE });
  }
}
