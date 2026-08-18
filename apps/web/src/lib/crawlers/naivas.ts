import type { CrawlerResult, MarketListing } from "./types";
import { fetchHtml, parseAmountCents, stripTags } from "./http";
import { extractListingsFromHtml, mergeListedOffers } from "./omni";

const LIMIT = 24;

function magentoCards(html: string, shopId: string, shop: string): MarketListing[] {
  const listings: MarketListing[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const items = [
    ...html.matchAll(
      /<a[^>]+class="[^"]*product-item-link[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]{0,1800}?data-price-amount="([\d.]+)"/gi,
    ),
  ];
  for (const m of items) {
    if (listings.length >= LIMIT) break;
    const listingUrl = (m[1] || "").split("?")[0];
    const name = stripTags(m[2] || "");
    const priceCents = parseAmountCents(m[3] || "");
    if (!listingUrl || !name || !priceCents || /catalogsearch|customer|cart/.test(listingUrl)) continue;
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
      observedAt: now,
    });
  }
  return listings;
}

function kshCards(html: string, shopId: string, shop: string): MarketListing[] {
  const listings: MarketListing[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const cards = [
    ...html.matchAll(
      /<a[^>]+href="(https?:\/\/naivas\.online\/[^"]+)"[^>]*>[\s\S]{0,1600}?KSh\s*([\d,]+)/gi,
    ),
  ];
  for (const m of cards) {
    if (listings.length >= LIMIT) break;
    const listingUrl = (m[1] || "").split("?")[0];
    if (!listingUrl || /catalogsearch|customer|cart/.test(listingUrl) || seen.has(listingUrl)) continue;
    const priceCents = parseAmountCents(m[2] || "");
    if (!priceCents) continue;
    const around = html.slice(Math.max(0, (m.index ?? 0) - 200), (m.index ?? 0) + 500);
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
  return listings;
}

/** Naivas public Magento shop. Fail soft when the page is JS-only. */
export async function searchNaivas(query: string): Promise<CrawlerResult> {
  const shopId = "naivas-ke";
  const shop = "Naivas";
  const url = `https://naivas.online/catalogsearch/result/?q=${encodeURIComponent(query)}`;
  const fetched = await fetchHtml(url, { acceptLang: "en-KE,en;q=0.9", timeoutMs: 10_000 });
  if (!fetched.ok) {
    return { shopId, shop, status: "blocked", listings: [], error: fetched.error };
  }

  const listings = mergeListedOffers(
    [
      magentoCards(fetched.html, shopId, shop),
      kshCards(fetched.html, shopId, shop),
      extractListingsFromHtml(fetched.html, {
        shopId,
        shop,
        country: "ke",
        currency: "KES",
        pageUrl: url,
        limit: LIMIT,
      }),
    ],
    LIMIT,
  );

  return {
    shopId,
    shop,
    status: listings.length ? "ok" : "blocked",
    listings,
    error: listings.length ? undefined : "Naivas HTML had no priced cards (often JS-only)",
  };
}
