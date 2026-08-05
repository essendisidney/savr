import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  INVITE_COOKIE,
  canSignInviteCookie,
  inviteGateEnabled,
  signInviteCookie,
} from "@/lib/invite-cookie";

export async function POST(req: Request) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "Enter an invite code" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("redeem_invite_code", { p_code: code });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const result = data as { ok?: boolean; error?: string; code?: string } | null;
    if (!result?.ok) {
      return NextResponse.json({ error: result?.error ?? "Invalid invite code" }, { status: 400 });
    }

    // Gate is open: code is valid even if we cannot mint a cookie yet.
    if (!canSignInviteCookie()) {
      if (!inviteGateEnabled()) {
        return NextResponse.json({ ok: true, cookie: false });
      }
      return NextResponse.json(
        { error: "Invite wall is on but INVITE_COOKIE_SECRET is not set." },
        { status: 503 },
      );
    }

    const signed = await signInviteCookie(result.code ?? code);
    const res = NextResponse.json({ ok: true, cookie: true });
    res.cookies.set(INVITE_COOKIE, signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invite redeem failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
