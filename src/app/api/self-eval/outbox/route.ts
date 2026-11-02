import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { hasAutomationSecret } from "@/lib/externalScoresStore";
import { ackMail, queuedMail } from "@/lib/selfEval";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

function guard(request: NextRequest) {
  if (!hasAutomationSecret(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE });
  if (!getPool()) return NextResponse.json({ error: "DATABASE_URL no está configurada en el servidor." }, { status: 503, headers: NO_STORE });
  return null;
}

/** Emails waiting to go out, for the Google Apps Script worker (it sends them from the team's own Google account). */
export async function GET(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json({ mail: await queuedMail(getPool()!) }, { headers: NO_STORE });
}

/** Body: `{ id, ok, error? }` — tells the server whether the worker managed to send that email. */
export async function POST(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { id?: string; ok?: boolean; error?: string } | null;
  if (!body?.id || typeof body.ok !== "boolean") return NextResponse.json({ error: "Solicitud no válida." }, { status: 400, headers: NO_STORE });
  await ackMail(getPool()!, String(body.id), body.ok, body.error);
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
