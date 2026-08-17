import { NextResponse } from "next/server";
import { runDailyMarketBoard } from "@/lib/market-search";

export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret =
    (process.env.CRON_SECRET ?? "").trim() ||
    (process.env.OPS_ACCESS_KEY ?? "").trim() ||
    (process.env.INVITE_COOKIE_SECRET ?? "").trim();
  const auth = req.headers.get("authorization") ?? "";
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!secret) {
    return process.env.VERCEL_ENV !== "production" && process.env.NODE_ENV !== "production";
  }
  return auth === `Bearer ${secret}` || key === secret;
}

/** 6:00 AM Nairobi (03:00 UTC) daily Jumia/Kilimall board. Carrefour/Naivas fail soft. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDailyMarketBoard();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scrape failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
