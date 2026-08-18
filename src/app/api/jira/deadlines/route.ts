import { NextResponse } from "next/server";
import { fetchJiraDeadlines } from "@/lib/jira";
import { STRATEGISTS } from "@/lib/strategists";

export async function GET() {
  const result = await fetchJiraDeadlines(STRATEGISTS.map((s) => s.email));
  return NextResponse.json(result);
}
