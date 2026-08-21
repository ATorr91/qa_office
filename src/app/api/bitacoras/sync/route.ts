import { NextRequest, NextResponse } from "next/server";
import { fetchBitacorasSync } from "@/lib/googleSheets";
import { CURRENT_YEAR, STRATEGISTS } from "@/lib/strategists";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year")) || CURRENT_YEAR;
  const result = await fetchBitacorasSync(STRATEGISTS, year);
  return NextResponse.json(result);
}
