import { NextRequest, NextResponse } from "next/server";
import { fetchJiraDeadlines, type StrategistBoard } from "@/lib/jira";
import { STRATEGISTS } from "@/lib/strategists";

/** Splits a "APAC, MKT,OPS" style field into ["APAC","MKT","OPS"], dropping blanks. */
function parseProjectKeys(raw: string): string[] {
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { boards?: Record<string, string> };
  const overrides = body.boards ?? {};
  const globalDefault = process.env.JIRA_PROJECT_KEY ?? "";

  const boards: StrategistBoard[] = STRATEGISTS.map((s) => {
    const override = parseProjectKeys(overrides[s.id] ?? "");
    const projectKeys = override.length > 0 ? override : globalDefault ? [globalDefault] : [];
    return { email: s.email, projectKeys };
  });

  const result = await fetchJiraDeadlines(boards);
  return NextResponse.json(result);
}

// Kept for convenience (e.g. manual checks) — behaves like a POST with no per-strategist overrides.
export async function GET() {
  const globalDefault = process.env.JIRA_PROJECT_KEY ?? "";
  const boards: StrategistBoard[] = STRATEGISTS.map((s) => ({
    email: s.email,
    projectKeys: globalDefault ? [globalDefault] : [],
  }));
  const result = await fetchJiraDeadlines(boards);
  return NextResponse.json(result);
}
