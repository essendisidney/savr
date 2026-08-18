import { SAVR_BOT_UA } from "./types";

export const CRAWL_TIMEOUT_MS = 8000;

export function decodeHtml(s: string): string {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function stripTags(s: string): string {
  return decodeHtml(s.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function parseAmountCents(text: string): number | null {
  const m = String(text || "")
    .replace(/,/g, "")
    .match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0 || n > 50_000_000) return null;
  return Math.round(n * 100);
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

async function fetchOnce(
  url: string,
  opts: { acceptLang: string; timeoutMs: number; noStore?: boolean },
): Promise<{ ok: true; html: string } | { ok: false; status: number; blocked: boolean; error: string }> {
  const referer = originOf(url);
  const res = await fetch(url, {
    headers: {
      "User-Agent": SAVR_BOT_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": opts.acceptLang,
      ...(referer ? { Referer: `${referer}/` } : {}),
    },
    redirect: "follow",
    signal: AbortSignal.timeout(opts.timeoutMs),
    cache: opts.noStore ? "no-store" : undefined,
    next: { revalidate: opts.noStore ? 0 : 900 },
  } as RequestInit & { next?: { revalidate: number } });
  const html = await res.text();
  const challenge =
    /cloudflare|just a moment|security verification|captcha|access denied|bot detection/i.test(
      html.slice(0, 4000),
    );
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      blocked: res.status === 403 || res.status === 429 || challenge,
      error: `HTTP ${res.status}`,
    };
  }
  if (html.length < 800 || challenge) {
    return {
      ok: false,
      status: res.status,
      blocked: true,
      error: challenge ? "Shop blocked the crawler" : "Empty or blocked page",
    };
  }
  return { ok: true, html };
}

export async function fetchHtml(
  url: string,
  opts?: { acceptLang?: string; timeoutMs?: number; noStore?: boolean },
): Promise<{ ok: true; html: string } | { ok: false; status: number; blocked: boolean; error: string }> {
  const timeoutMs = opts?.timeoutMs ?? CRAWL_TIMEOUT_MS;
  const acceptLang = opts?.acceptLang ?? "en-KE,en;q=0.9";
  try {
    const first = await fetchOnce(url, { acceptLang, timeoutMs, noStore: opts?.noStore });
    if (first.ok || first.status === 403 || first.status === 404) return first;
    return await fetchOnce(url, { acceptLang, timeoutMs, noStore: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fetch failed";
    try {
      return await fetchOnce(url, { acceptLang, timeoutMs, noStore: true });
    } catch (e2) {
      const msg2 = e2 instanceof Error ? e2.message : msg;
      return { ok: false, status: 0, blocked: /timeout|aborted/i.test(msg2), error: msg2 };
    }
  }
}
