import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-admin";
import { initiateB2C, mpesaIsDryRun } from "@/lib/mpesa";

/** Process the signed-in user's pending redeem immediately (dry-run or live B2C). */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authHeader = req.headers.get("authorization");
  if (!url || !anon || !authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let requestId: string | null = null;
  try {
    const body = (await req.json()) as { requestId?: string };
    requestId = typeof body.requestId === "string" ? body.requestId : null;
  } catch {
    /* empty body ok */
  }

  const admin = createAdminClient();
  let query = admin
    .from("redeem_requests")
    .select("id, amount_cents, phone, profile_id, status, mpesa_conversation_id")
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .is("mpesa_conversation_id", null);
  if (requestId) query = query.eq("id", requestId);

  const { data: row, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ ok: true, processed: false, dryRun: mpesaIsDryRun() });
  }
  if (!row.phone) {
    await admin
      .from("redeem_requests")
      .update({ failure_reason: "Missing phone for B2C" })
      .eq("id", row.id);
    return NextResponse.json({ error: "Add a phone number to redeem." }, { status: 400 });
  }

  try {
    const originator = `SAVR-${row.id.slice(0, 8)}-${Date.now()}`;
    const b2c = await initiateB2C({
      amountKes: Math.round(row.amount_cents / 100),
      phone: row.phone,
      occasion: "Savr cashback",
      remarks: "Savr wallet redeem",
      originatorConversationId: originator,
    });

    await admin
      .from("redeem_requests")
      .update({
        mpesa_conversation_id: b2c.dryRun ? `dry-run-${row.id.slice(0, 8)}` : b2c.conversationId,
        mpesa_originator_conversation_id: b2c.originatorConversationId,
        failure_reason: b2c.dryRun ? "dry_run_no_mpesa" : null,
        ...(b2c.dryRun ? { status: "paid", updated_at: new Date().toISOString() } : {}),
      })
      .eq("id", row.id);

    if (b2c.dryRun) {
      await admin
        .from("wallet_ledger")
        .update({ note: "Dry-run — no M-Pesa money moved" })
        .eq("reference_id", row.id)
        .eq("reference_type", "redeem_request");
    }

    return NextResponse.json({
      ok: true,
      processed: true,
      dryRun: b2c.dryRun,
      requestId: row.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "B2C failed";
    await admin.from("redeem_requests").update({ failure_reason: msg }).eq("id", row.id);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
