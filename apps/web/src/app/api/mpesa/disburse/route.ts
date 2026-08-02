import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { initiateB2C, mpesaIsDryRun } from "@/lib/mpesa";

/** Process pending redeem_requests via B2C (cron / ops). Auth: Bearer MPESA_DISBURSE_SECRET or service role. */
export async function POST(req: Request) {
  const secret = process.env.MPESA_DISBURSE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let limit = 10;
  try {
    const body = await req.json();
    if (typeof body?.limit === "number") limit = Math.min(50, Math.max(1, body.limit));
  } catch {
    // empty body ok
  }

  const admin = createAdminClient();
  const { data: pending, error } = await admin
    .from("redeem_requests")
    .select("id, amount_cents, phone, profile_id")
    .eq("status", "pending")
    .is("mpesa_conversation_id", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; ok: boolean; dryRun?: boolean; error?: string }[] = [];

  for (const row of pending ?? []) {
    if (!row.phone) {
      await admin
        .from("redeem_requests")
        .update({ failure_reason: "Missing phone for B2C" })
        .eq("id", row.id);
      results.push({ id: row.id, ok: false, error: "Missing phone" });
      continue;
    }

    const originator = `SAVR-${row.id.slice(0, 8)}-${Date.now()}`;
    try {
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
          mpesa_conversation_id: b2c.conversationId,
          mpesa_originator_conversation_id: b2c.originatorConversationId,
          failure_reason: null,
          // Dry-run: mark paid immediately so ops can verify pipeline without webhooks
          ...(b2c.dryRun ? { status: "paid", updated_at: new Date().toISOString() } : {}),
        })
        .eq("id", row.id);

      if (b2c.dryRun) {
        // Update ledger note for visibility
        await admin
          .from("wallet_ledger")
          .update({ note: "Redeem dry-run paid · no M-Pesa money moved" })
          .eq("reference_id", row.id)
          .eq("reference_type", "redeem_request");
      }

      results.push({ id: row.id, ok: true, dryRun: b2c.dryRun });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "B2C failed";
      await admin.from("redeem_requests").update({ failure_reason: msg }).eq("id", row.id);
      results.push({ id: row.id, ok: false, error: msg });
    }
  }

  return NextResponse.json({
    dryRun: mpesaIsDryRun(),
    processed: results.length,
    results,
  });
}
