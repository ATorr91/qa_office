import { NextRequest, NextResponse } from "next/server";
import { getFeaturedSignals, searchSignals, type SignalOrigin } from "@/lib/signals";

/**
 * Signals search endpoint. Today this only serves the curated, manually
 * web-searched-and-verified dataset in src/lib/signals.ts — there is no live
 * internet search happening here yet.
 *
 * To go live later: replace the body below with a real call to a search
 * provider (e.g. process.env.SEARCH_API_KEY against Bing/SerpAPI/Google CSE),
 * ideally re-verifying each candidate result before returning it (the mistake
 * that prompted this route's design was an unverified guessed URL). Because
 * the client already talks to this route through src/lib/signalsProvider.ts,
 * no UI code needs to change when that swap happens — only this file.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const originParam = (searchParams.get("origin") ?? "all") as SignalOrigin | "all";
  const mode = searchParams.get("mode") ?? "search";

  const signals = mode === "featured" ? getFeaturedSignals(originParam) : searchSignals(q, originParam);

  return NextResponse.json({ signals });
}
