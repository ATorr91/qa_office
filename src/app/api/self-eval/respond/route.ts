import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { SelfEvalError, submitResponse, surveyByToken } from "@/lib/selfEval";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

/** The survey behind a personal link (what the strategist sees). The 48-character token is the only credential. */
export async function GET(request: NextRequest) {
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "El servidor no tiene base de datos." }, { status: 503, headers: NO_STORE });
  const survey = await surveyByToken(pool, request.nextUrl.searchParams.get("token") ?? "").catch(() => null);
  if (!survey) return NextResponse.json({ error: "Este enlace no es válido." }, { status: 404, headers: NO_STORE });
  return NextResponse.json(survey, { headers: NO_STORE });
}

/** Body: `{ token, answers }`. Can be sent again to correct answers until the survey closes. */
export async function POST(request: NextRequest) {
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "El servidor no tiene base de datos." }, { status: 503, headers: NO_STORE });
  const body = (await request.json().catch(() => null)) as { token?: string; answers?: unknown } | null;
  if (!body?.token) return NextResponse.json({ error: "Solicitud no válida." }, { status: 400, headers: NO_STORE });
  try {
    await submitResponse(pool, body.token, body.answers);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    if (err instanceof SelfEvalError) return NextResponse.json({ error: err.message }, { status: err.status, headers: NO_STORE });
    return NextResponse.json({ error: "No se pudo guardar tu respuesta." }, { status: 500, headers: NO_STORE });
  }
}
