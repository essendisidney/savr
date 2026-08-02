import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

type B2CResultBody = {
  Result?: {
    ResultCode?: number;
    ResultDesc?: string;
    ConversationID?: string;
    OriginatorConversationID?: string;
    ResultParameters?: {
      ResultParameter?: { Key: string; Value: string | number }[];
    };
  };
};

export async function POST(req: Request) {
  let body: B2CResultBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" });
  }

  const result = body.Result;
  const conversationId = result?.ConversationID;
  const originatorId = result?.OriginatorConversationID;
  const code = result?.ResultCode;

  if (!conversationId && !originatorId) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  try {
    const admin = createAdminClient();
    let query = admin.from("redeem_requests").select("id, status").limit(1);
    if (conversationId) {
      query = query.eq("mpesa_conversation_id", conversationId);
    } else if (originatorId) {
      query = query.eq("mpesa_originator_conversation_id", originatorId);
    }
    const { data: rows } = await query;
    const row = rows?.[0];
    if (!row) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (code === 0) {
      await admin
        .from("redeem_requests")
        .update({
          status: "paid",
          failure_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      await admin
        .from("wallet_ledger")
        .update({ note: "Redeem paid via M-Pesa B2C" })
        .eq("reference_id", row.id)
        .eq("reference_type", "redeem_request");
    } else {
      await admin
        .from("redeem_requests")
        .update({
          failure_reason: result?.ResultDesc ?? `ResultCode ${code}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    }
  } catch (e) {
    console.error("[mpesa:b2c:result]", e);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
