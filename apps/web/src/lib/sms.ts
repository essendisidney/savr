import { normalizePhone254 } from "./phone";

export const TAIFA_SMS_URL = "https://api.taifamobile.co.ke/v2/sms/sendsms";

/**
 * Send SMS via Taifa Mobile API v2 (same provider as CREDA).
 * API expects mobile as 2547XXXXXXXX (no +).
 */
export async function sendSMS(phone: string, message: string): Promise<void> {
  const apiKey = (process.env.TAIFA_API_KEY ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
  const senderName =
    (process.env.TAIFA_SENDER_ID ?? "").trim().replace(/^["']|["']$/g, "") || "SIDNET";

  if (!apiKey) {
    throw new Error("TAIFA_API_KEY is not configured");
  }

  const mobile = normalizePhone254(phone);
  if (!/^254[17]\d{8}$/.test(mobile)) {
    throw new Error(`Invalid Kenya mobile: ${phone}`);
  }

  let text: string;
  try {
    const res = await fetch(TAIFA_SMS_URL, {
      method: "POST",
      headers: {
        h_api_key: apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        mobile,
        sender_name: senderName,
        message,
        response_type: "json",
      }),
    });
    text = await res.text();
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e);
    throw new Error(`Taifa unreachable: ${why}`);
  }

  const err = taifaRejection(text);
  if (err) throw new Error(err);
}

/** Taifa v2 always returns HTTP 200; status_code "1000" = sent. Returns an error message or null. */
export function taifaRejection(text: string): string | null {
  let row: { status_code?: string | number; status_desc?: string } | undefined;
  try {
    const parsed = JSON.parse(text) as unknown;
    row = (Array.isArray(parsed) ? parsed[0] : parsed) as typeof row;
  } catch {
    return `Bad response from Taifa: ${text.slice(0, 120)}`;
  }
  const code = String(row?.status_code ?? "");
  if (code === "1000") return null;
  return `Taifa ${code || "?"}: ${row?.status_desc ?? text.slice(0, 120)}`;
}
