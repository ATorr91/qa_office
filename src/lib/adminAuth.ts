// Server-only admin authentication for the Dashboard de Estrategas. The password lives in
// ADMIN_PASSWORD (never in the client bundle); a successful login sets an httpOnly cookie holding an
// HMAC of it, which the write endpoints check.
import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "bp-admin";
export const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

function password(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

export function adminConfigured(): boolean {
  return password() !== null;
}

function digest(value: string): Buffer {
  return createHmac("sha256", "bp-dashboard-admin-v1").update(value).digest();
}

export function passwordMatches(input: string): boolean {
  const expected = password();
  if (expected === null) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

/** The cookie value for a logged-in admin. Changing ADMIN_PASSWORD invalidates every open session. */
export function sessionToken(): string | null {
  const expected = password();
  return expected === null ? null : digest(`session:${expected}`).toString("hex");
}

export function isAdminRequest(request: NextRequest): boolean {
  const token = sessionToken();
  const sent = request.cookies.get(ADMIN_COOKIE)?.value;
  if (token === null || !sent || sent.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(sent), Buffer.from(token));
}
