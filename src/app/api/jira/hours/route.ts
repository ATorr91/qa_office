import { NextRequest, NextResponse } from "next/server";
import { fetchJiraHours } from "@/lib/jiraHours";

export const dynamic = "force-dynamic";

/** Hours logged in Jira by week, project and person. `?refresh=1` skips the 5-minute server cache. */
export async function GET(request: NextRequest) {
  const result = await fetchJiraHours(request.nextUrl.searchParams.get("refresh") === "1");
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
