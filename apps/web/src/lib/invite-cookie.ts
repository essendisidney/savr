export const INVITE_COOKIE = "savr_invite";

function isProdRuntime() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function secret(): string | null {
  const dedicated = (process.env.INVITE_COOKIE_SECRET ?? "").trim();
  if (dedicated) return dedicated;
  // Never fall back to service role or a fixed string in production.
  if (isProdRuntime()) return null;
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "savr-dev-invite";
}

/** Soft launch is open by default. Set INVITE_GATE_ENABLED=true to require a code. */
export function inviteGateEnabled(): boolean {
  return process.env.INVITE_GATE_ENABLED === "true";
}

export function canSignInviteCookie(): boolean {
  return Boolean(secret());
}

async function hmacHex(payload: string): Promise<string> {
  const keyMaterial = secret();
  if (!keyMaterial) {
    throw new Error("INVITE_COOKIE_SECRET is required in production");
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyMaterial),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/** Signed cookie value: code.timestamp.sig */
export async function signInviteCookie(code: string): Promise<string> {
  const ts = Math.floor(Date.now() / 1000).toString();
  const payload = `${code.toUpperCase()}.${ts}`;
  const sig = await hmacHex(payload);
  return `${payload}.${sig}`;
}

export async function verifyInviteCookie(raw: string | undefined | null): Promise<boolean> {
  if (!raw) return false;
  if (!secret()) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [code, ts, sig] = parts;
  if (!code || !ts || !sig) return false;
  const payload = `${code}.${ts}`;
  let expected: string;
  try {
    expected = await hmacHex(payload);
  } catch {
    return false;
  }
  if (expected.length !== sig.length) return false;
  let ok = true;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== sig[i]) ok = false;
  }
  return ok;
}
