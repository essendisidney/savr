import { NextResponse, type NextRequest } from "next/server";
import { isValidKeMobile, normalizePhone254 } from "@/lib/phone";
import { sendSMS } from "@/lib/sms";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * Taifa Mobile SMS + otp_codes — same pattern as CREDA.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { phone?: string };
    const raw = typeof body.phone === "string" ? body.phone : "";

    if (!raw.trim()) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }
    if (!isValidKeMobile(raw)) {
      return NextResponse.json(
        { error: "Enter a valid Kenya mobile (e.g. 0712 345 678)." },
        { status: 400 },
      );
    }

    const normalized = normalizePhone254(raw);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const admin = createAdminClient();
    const { error: insertError } = await admin.from("otp_codes").insert({
      phone: normalized,
      code,
      expires_at: expiresAt,
      used: false,
    });

    if (insertError) {
      console.error("[auth/phone/send] otp insert", insertError);
      return NextResponse.json({ error: "Could not send code" }, { status: 500 });
    }

    if (!(process.env.TAIFA_API_KEY ?? "").trim() && process.env.SMS_BYPASS !== "true") {
      return NextResponse.json(
        { error: "SMS service is not configured. Contact support." },
        { status: 503 },
      );
    }

    if (process.env.SMS_BYPASS === "true") {
      console.log("[SMS BYPASS] OTP for", normalized, "is:", code);
      return NextResponse.json({
        success: true,
        hint: "SMS bypassed — check server logs for code",
        ...(process.env.NODE_ENV === "development" ? { dev_otp: code } : {}),
      });
    }

    // Single line — multi-line + URLs often filtered by carriers.
    await sendSMS(normalized, `Your Savr code is ${code}. Valid 15 min. Do not share.`);

    const payload: { success: true; dev_otp?: string } = { success: true };
    if (process.env.NODE_ENV === "development") payload.dev_otp = code;
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[auth/phone/send]", e);
    return NextResponse.json(
      {
        error: "Failed to send code",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
