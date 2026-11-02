import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getPool } from "@/lib/db";
import { appBaseUrl, createSurvey, listSurveys, mailStatus, SelfEvalError } from "@/lib/selfEval";
import type { CreateSurveyInput } from "@/lib/selfEvalTypes";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

function guard(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Sesión de admin no válida o vencida." }, { status: 401, headers: NO_STORE });
  if (!getPool()) return NextResponse.json({ error: "DATABASE_URL no está configurada en el servidor." }, { status: 503, headers: NO_STORE });
  return null;
}

/** Every survey (history) plus how emails are being delivered. Admin only. */
export async function GET(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  const pool = getPool()!;
  try {
    const [surveys, mail] = await Promise.all([listSurveys(pool), mailStatus(pool)]);
    return NextResponse.json({ surveys, mail }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido." }, { status: 500, headers: NO_STORE });
  }
}

/** Creates a survey; with no `sendAt` it goes out right away. Admin only. */
export async function POST(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  const input = (await request.json().catch(() => null)) as CreateSurveyInput | null;
  if (!input) return NextResponse.json({ error: "Solicitud no válida." }, { status: 400, headers: NO_STORE });
  try {
    const id = await createSurvey(getPool()!, input, appBaseUrl(request.nextUrl.origin));
    return NextResponse.json({ ok: true, id }, { headers: NO_STORE });
  } catch (err) {
    if (err instanceof SelfEvalError) return NextResponse.json({ error: err.message }, { status: err.status, headers: NO_STORE });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido." }, { status: 500, headers: NO_STORE });
  }
}
