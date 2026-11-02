import { NextRequest, NextResponse } from "next/server";
import { fetchSprintProgress } from "@/lib/jiraSprints";

// Always live: the dashboard polls this, so nothing may be cached by the framework or the browser.
export const dynamic = "force-dynamic";

/** Progress of the current sprint on every active project's Jira board. `?refresh=1` skips the 30-second server cache. */
export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("refresh") === "1";
  const result = await fetchSprintProgress(force);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
