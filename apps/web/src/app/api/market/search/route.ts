import { NextResponse } from "next/server";
import { countryFromVercelHeader } from "@/lib/geo-country";
import { isMarketCountry, searchLiveMarket } from "@/lib/market-search";

export const maxDuration = 60;
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const param = (url.searchParams.get("country") ?? "").toLowerCase();
  const country = isMarketCountry(param)
    ? param
    : countryFromVercelHeader(req.headers.get("x-vercel-ip-country"));

  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const result = await searchLiveMarket(q, country);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=1800" },
  });
}
