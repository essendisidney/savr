import { NextResponse } from "next/server";
import { runKenyaPriceCrawl } from "@/lib/market-crawl";

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

/** Stale-first crawl of all catalog SKUs + stored listing URLs. Multiple morning slices. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runKenyaPriceCrawl();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scrape failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
