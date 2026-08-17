import type { CrawlerResult, MarketListing } from "./types";
import { fetchHtml, parseAmountCents, stripTags } from "./http";

/** Naivas public shop HTML. Magento-style storefronts often JS-render — fail soft. */
export async function searchNaivas(query: string): Promise<CrawlerResult> {
  const shopId = "naivas-ke";
  const shop = "Naivas";
  const url = `https://naivas.online/catalogsearch/result/?q=${encodeURIComponent(query)}`;
  const fetched = await fetchHtml(url, { acceptLang: "en-KE,en;q=0.9" });
  if (!fetched.ok) {
    return { shopId, shop, status: "blocked", listings: [], error: fetched.error };
  }

  const listings: MarketListing[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const cards = [
    ...fetched.html.matchAll(
      /<a[^>]+href="(https?:\/\/naivas\.online\/[^"]+)"[^>]*>[\s\S]{0,1200}?KSh\s*([\d,]+)/gi,
    ),
  ];
  for (const m of cards) {
    if (listings.length >= 12) break;
    const listingUrl = (m[1] || "").split("?")[0];
    if (!listingUrl || /catalogsearch|customer|cart/.test(listingUrl) || seen.has(listingUrl)) continue;
    const priceCents = parseAmountCents(m[2] || "");
    if (!priceCents) continue;
    const around = fetched.html.slice(Math.max(0, (m.index ?? 0) - 200), (m.index ?? 0) + 500);
    const title = stripTags(
      (around.match(/<(?:strong|h2|a|span)[^>]*>([^<]{8,160})<\/(?:strong|h2|a|span)>/) || [])[1] || "",
    );
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
      observedAt: now,
    });
  }

  return {
    shopId,
    shop,
    status: listings.length ? "ok" : "blocked",
    listings,
    error: listings.length ? undefined : "Naivas HTML had no priced cards (often JS-only)",
  };
}
