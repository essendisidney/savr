import { NextResponse } from "next/server";
import { searchLiveMarket } from "@/lib/market-search";

export const maxDuration = 60;
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const result = await searchLiveMarket(q, "ke");
  return NextResponse.json(result, {
    headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=1800" },
  });
}
