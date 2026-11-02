import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { EMPTY_EXTERNAL_SCORES } from "@/lib/externalScores";
import { readScores } from "@/lib/externalScoresStore";

const NO_STORE = { "Cache-Control": "no-store" };

/** QA, NPS and CSAT scores already rolled up per strategist and month. `configured: false` means there is no database. */
export async function GET() {
  const pool = getPool();
  if (!pool) return NextResponse.json({ ...EMPTY_EXTERNAL_SCORES, fetchedAt: new Date().toISOString() }, { headers: NO_STORE });
  try {
    return NextResponse.json(await readScores(pool), { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json(
      { ...EMPTY_EXTERNAL_SCORES, configured: true, fetchedAt: new Date().toISOString(), error: err instanceof Error ? err.message : "Error desconocido al leer la base de datos." },
      { headers: NO_STORE },
    );
  }
}
