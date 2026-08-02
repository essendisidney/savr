import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  let body: {
    Result?: {
      ConversationID?: string;
      OriginatorConversationID?: string;
      ResultDesc?: string;
    };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const conversationId = body.Result?.ConversationID;
  const originatorId = body.Result?.OriginatorConversationID;

  try {
    const admin = createAdminClient();
    let query = admin.from("redeem_requests").select("id").limit(1);
    if (conversationId) query = query.eq("mpesa_conversation_id", conversationId);
    else if (originatorId) query = query.eq("mpesa_originator_conversation_id", originatorId);
    else return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

    const { data: rows } = await query;
    const row = rows?.[0];
    if (row) {
      await admin
        .from("redeem_requests")
        .update({
          failure_reason: body.Result?.ResultDesc ?? "B2C timeout",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    }
  } catch (e) {
    console.error("[mpesa:b2c:timeout]", e);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
