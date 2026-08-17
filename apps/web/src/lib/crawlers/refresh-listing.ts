import type { MarketListing } from "./types";
import { extractListingsFromHtml } from "./omni";
import { fetchHtml, parseAmountCents } from "./http";

function jumiaCardPrice(html: string): number | null {
  const dataPrice = (html.match(/data-price="([\d.]+)"/) || [])[1];
  const gaPrice = (html.match(/data-ga4-item_price="([^"]+)"/) || [])[1];
  const prc = (html.match(/class="prc[^"]*"[^>]*>([^<]+)/) || [])[1];
  const ksh = (html.match(/(?:KSh|KES|Ksh)\s*([\d,]+(?:\.\d{1,2})?)/i) || [])[1];
  return (
    parseAmountCents(dataPrice || "") ??
    parseAmountCents(gaPrice || "") ??
    parseAmountCents(prc || "") ??
    parseAmountCents(ksh || "")
  );
}

/** Re-read a stored product page. Returns null if blocked or no listed price — never invents. */
export async function refreshStoredListing(row: MarketListing): Promise<MarketListing | null> {
  const fetched = await fetchHtml(row.url, { acceptLang: "en-KE,en;q=0.9", noStore: true });
  if (!fetched.ok) return null;
  const omni = extractListingsFromHtml(fetched.html, {
    shopId: row.shopId,
    shop: row.shop,
    country: row.country,
    currency: row.currency,
    pageUrl: row.url,
    limit: 1,
  });
  const priceCents = omni[0]?.priceCents ?? jumiaCardPrice(fetched.html);
  if (!priceCents) return null;
  return {
    ...row,
    priceCents,
    observedAt: new Date().toISOString(),
  };
}
