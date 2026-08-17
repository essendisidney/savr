import { SAVR_BOT_UA } from "./types";

export const CRAWL_TIMEOUT_MS = 5000;

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

export async function fetchHtml(
  url: string,
  opts?: { acceptLang?: string; timeoutMs?: number; noStore?: boolean },
): Promise<{ ok: true; html: string } | { ok: false; status: number; blocked: boolean; error: string }> {
  const timeoutMs = opts?.timeoutMs ?? CRAWL_TIMEOUT_MS;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": SAVR_BOT_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": opts?.acceptLang ?? "en-KE,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      cache: opts?.noStore ? "no-store" : undefined,
      next: { revalidate: opts?.noStore ? 0 : 900 },
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
    if (html.length < 1500 || challenge) {
      return {
        ok: false,
        status: res.status,
        blocked: true,
        error: challenge ? "Shop blocked the crawler" : "Empty or blocked page",
      };
    }
    return { ok: true, html };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fetch failed";
    const blocked = /timeout|aborted/i.test(msg);
    return { ok: false, status: 0, blocked, error: msg };
  }
}
