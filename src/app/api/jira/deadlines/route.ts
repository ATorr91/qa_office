import { NextRequest, NextResponse } from "next/server";
import { fetchJiraDeadlines, type StrategistBoard } from "@/lib/jira";
import { STRATEGISTS } from "@/lib/strategists";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { boards?: Record<string, string> };
  const overrides = body.boards ?? {};
  const globalDefault = process.env.JIRA_PROJECT_KEY ?? "";

  const boards: StrategistBoard[] = STRATEGISTS.map((s) => ({
    email: s.email,
    projectKey: (overrides[s.id] ?? "").trim() || globalDefault,
  }));

  const result = await fetchJiraDeadlines(boards);
  return NextResponse.json(result);
}

// Kept for convenience (e.g. manual checks) — behaves like a POST with no per-strategist overrides.
export async function GET() {
  const globalDefault = process.env.JIRA_PROJECT_KEY ?? "";
  const boards: StrategistBoard[] = STRATEGISTS.map((s) => ({ email: s.email, projectKey: globalDefault }));
  const result = await fetchJiraDeadlines(boards);
  return NextResponse.json(result);
}
