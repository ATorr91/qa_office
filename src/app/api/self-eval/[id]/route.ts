import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getPool } from "@/lib/db";
import { appBaseUrl, getSurveyDetail, runAction, SelfEvalError } from "@/lib/selfEval";
import type { SurveyAction } from "@/lib/selfEvalTypes";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };
const ACTIONS: SurveyAction[] = ["close", "extend", "remind", "resend", "cancel", "send-now"];

function guard(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Sesión de admin no válida o vencida." }, { status: 401, headers: NO_STORE });
  if (!getPool()) return NextResponse.json({ error: "DATABASE_URL no está configurada en el servidor." }, { status: 503, headers: NO_STORE });
  return null;
}

function fail(err: unknown) {
  if (err instanceof SelfEvalError) return NextResponse.json({ error: err.message }, { status: err.status, headers: NO_STORE });
  return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido." }, { status: 500, headers: NO_STORE });
}

/** One survey with its recipients, answers and event history. Admin only. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await getSurveyDetail(getPool()!, (await params).id), { headers: NO_STORE });
  } catch (err) {
    return fail(err);
  }
}

/** Body: `{ action, strategistId? }`. Admin only. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = guard(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { action?: SurveyAction; strategistId?: string } | null;
  if (!body?.action || !ACTIONS.includes(body.action)) return NextResponse.json({ error: "Acción no válida." }, { status: 400, headers: NO_STORE });
  try {
    await runAction(getPool()!, (await params).id, body.action, body.strategistId ?? null, appBaseUrl(request.nextUrl.origin));
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    return fail(err);
  }
}
