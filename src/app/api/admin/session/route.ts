import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE_SECONDS,
  adminConfigured,
  isAdminRequest,
  passwordMatches,
  sessionToken,
} from "@/lib/adminAuth";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  return NextResponse.json({ configured: adminConfigured(), authed: isAdminRequest(request) }, { headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "ADMIN_PASSWORD no está configurada en el servidor." }, { status: 503, headers: NO_STORE });
  }
  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== "string" || !passwordMatches(body.password)) {
    // A short delay makes guessing passwords in a loop slow without needing a rate-limit store.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401, headers: NO_STORE });
  }
  const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
  response.cookies.set(ADMIN_COOKIE, sessionToken()!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
