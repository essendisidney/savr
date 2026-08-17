import type { MarketListing } from "./types";
import { fetchHtml, parseAmountCents } from "./http";

function parseListedPrice(html: string): number | null {
  const jsonBlocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of jsonBlocks) {
    try {
      const data = JSON.parse(block[1] || "") as Record<string, unknown> | unknown[];
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const rec = node as Record<string, unknown>;
        const offers = rec.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
        const offer = Array.isArray(offers) ? offers[0] : offers;
        const price = offer?.price ?? rec.price;
        const cents = parseAmountCents(String(price ?? ""));
        if (cents) return cents;
      }
    } catch {
      /* next block */
    }
  }

  const dataPrice = (html.match(/data-price="([\d.]+)"/) || [])[1];
  const gaPrice = (html.match(/data-ga4-item_price="([^"]+)"/) || [])[1];
  const prc = (html.match(/class="prc[^"]*"[^>]*>([^<]+)/) || [])[1];
  const ksh = (html.match(/KSh\s*([\d,]+(?:\.\d{1,2})?)/i) || [])[1];
  return (
    parseAmountCents(dataPrice || "") ??
    parseAmountCents(gaPrice || "") ??
    parseAmountCents(prc || "") ??
    parseAmountCents(ksh || "")
  );
}

/** Re-read a stored product page. Returns null if blocked or no price — never invents. */
export async function refreshStoredListing(row: MarketListing): Promise<MarketListing | null> {
  const fetched = await fetchHtml(row.url, { acceptLang: "en-KE,en;q=0.9", noStore: true });
  if (!fetched.ok) return null;
  const priceCents = parseListedPrice(fetched.html);
  if (!priceCents) return null;
  return {
    ...row,
    priceCents,
    observedAt: new Date().toISOString(),
  };
}
