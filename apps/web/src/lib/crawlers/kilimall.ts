import type { CrawlerResult, MarketListing } from "./types";
import { fetchHtml, parseAmountCents, stripTags } from "./http";

export async function searchKilimall(query: string): Promise<CrawlerResult> {
  const shopId = "kilimall-ke";
  const shop = "Kilimall";
  const url = `https://www.kilimall.co.ke/search?q=${encodeURIComponent(query)}`;
  const fetched = await fetchHtml(url, { acceptLang: "en-KE,en;q=0.9" });
  if (!fetched.ok) {
    return { shopId, shop, status: "blocked", listings: [], error: fetched.error };
  }

  const re =
    /href="(\/listing\/[^"]+)"[\s\S]{0,2800}?class="product-title"[^>]*>([\s\S]*?)<\/p>[\s\S]{0,900}?class="product-price"[^>]*>([^<]+)/g;
  const listings: MarketListing[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = re.exec(fetched.html)) && listings.length < 12) {
    const href = match[1];
    const name = stripTags(match[2] || "");
    const priceCents = parseAmountCents(match[3] || "");
    if (!href || !name || !priceCents) continue;
    const listingUrl = `https://www.kilimall.co.ke${href.split("?")[0]}`;
    if (seen.has(listingUrl)) continue;
    seen.add(listingUrl);
    listings.push({
      id: `${shopId}:${listingUrl}`,
      shop,
      shopId,
      country: "ke",
      name,
      brand: null,
      priceCents,
      currency: "KES",
      url: listingUrl,
      observedAt: new Date().toISOString(),
    });
  }

  return {
    shopId,
    shop,
    status: listings.length ? "ok" : "empty",
    listings,
  };
}
