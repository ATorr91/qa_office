import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getPool } from "@/lib/db";
import { hasAutomationSecret } from "@/lib/externalScoresStore";
import { appBaseUrl, tick } from "@/lib/selfEval";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

async function run(request: NextRequest) {
  if (!hasAutomationSecret(request) && !isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE });
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "DATABASE_URL no está configurada en el servidor." }, { status: 503, headers: NO_STORE });
  try {
    return NextResponse.json({ ok: true, ...(await tick(pool, appBaseUrl(request.nextUrl.origin))) }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido." }, { status: 500, headers: NO_STORE });
  }
}

/** Sends what is scheduled, reminds whoever is pending, closes what is due. Vercel cron calls GET; the Apps Script worker calls POST every few minutes. */
export const GET = run;
export const POST = run;
