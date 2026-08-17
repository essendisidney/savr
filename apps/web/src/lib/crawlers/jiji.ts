import type { CrawlerResult, MarketListing } from "./types";
import { fetchHtml, parseAmountCents, stripTags } from "./http";

/** Jiji is often Cloudflare-gated. Fail soft — never invent classified prices. */
export async function searchJiji(query: string): Promise<CrawlerResult> {
  const shopId = "jiji-ke";
  const shop = "Jiji";
  const url = `https://jiji.co.ke/search?query=${encodeURIComponent(query)}`;
  const fetched = await fetchHtml(url, { acceptLang: "en-KE,en;q=0.9" });
  if (!fetched.ok) {
    return { shopId, shop, status: "blocked", listings: [], error: fetched.error };
  }

  const listings: MarketListing[] = [];
  const seen = new Set<string>();
  const cards = [
    ...fetched.html.matchAll(
      /href="(https:\/\/jiji\.co\.ke\/[^"]+)"[\s\S]{0,2000}?KSh\s*([\d,]+)/gi,
    ),
  ];
  for (const m of cards) {
    if (listings.length >= 12) break;
    const listingUrl = (m[1] || "").split("?")[0];
    if (!listingUrl || /\/search/.test(listingUrl) || seen.has(listingUrl)) continue;
    const priceCents = parseAmountCents(m[2] || "");
    if (!priceCents) continue;
    const around = fetched.html.slice(Math.max(0, (m.index ?? 0) - 400), (m.index ?? 0) + 200);
    const title = stripTags((around.match(/<(?:h[1-3]|span|a)[^>]*>([^<]{12,140})<\/(?:h[1-3]|span|a)>/) || [])[1] || "");
    if (!title) continue;
    seen.add(listingUrl);
    listings.push({
      id: `${shopId}:${listingUrl}`,
      shop,
      shopId,
      country: "ke",
      name: title,
      brand: null,
      priceCents,
      currency: "KES",
      url: listingUrl,
    });
  }

  return {
    shopId,
    shop,
    status: listings.length ? "ok" : fetched.html.length > 8000 ? "empty" : "blocked",
    listings,
    error: listings.length ? undefined : "No priced classifieds in HTML (often JS-only)",
  };
}
