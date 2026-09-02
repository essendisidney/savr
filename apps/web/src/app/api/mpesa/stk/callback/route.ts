import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Daraja STK callback — acknowledge only; escrow already marked on initiate in dry-run MVP. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.info("[mpesa:stk-callback]", JSON.stringify(body).slice(0, 2000));
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
