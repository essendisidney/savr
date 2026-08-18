import type { CrawlerResult, MarketCountry, MarketCurrency, MarketListing } from "./types";
import { decodeHtml, fetchHtml, parseAmountCents } from "./http";
import { withJumiaPartnerTag } from "./affiliate";
import { extractListingsFromHtml, mergeListedOffers } from "./omni";

const HOSTS: Record<MarketCountry, { host: string; currency: MarketCurrency; lang: string }> = {
  ke: { host: "www.jumia.co.ke", currency: "KES", lang: "en-KE,en;q=0.9" },
  ng: { host: "www.jumia.com.ng", currency: "NGN", lang: "en-NG,en;q=0.9" },
  ug: { host: "www.jumia.ug", currency: "UGX", lang: "en-UG,en;q=0.9" },
  tz: { host: "www.jumia.co.tz", currency: "TZS", lang: "en-TZ,en;q=0.9" },
  gh: { host: "www.jumia.com.gh", currency: "GHS", lang: "en-GH,en;q=0.9" },
};

const LIMIT = 24;

export function jumiaSearchUrl(country: MarketCountry, query: string): string {
  return `https://${HOSTS[country].host}/catalog/?q=${encodeURIComponent(query)}`;
}

function parseJumiaCards(html: string, country: MarketCountry, shop: string, shopId: string): MarketListing[] {
  const meta = HOSTS[country];
  const articles = [...html.matchAll(/<article[^>]*class="prd[\s\S]*?<\/article>/g)];
  const listings: MarketListing[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();

  for (const m of articles) {
    const a = m[0];
    const name = decodeHtml((a.match(/data-ga4-item_name="([^"]+)"/) || [])[1] || "");
    const brand = decodeHtml((a.match(/data-ga4-item_brand="([^"]+)"/) || [])[1] || "");
    const sku = (a.match(/data-sku="([^"]+)"/) || [])[1];
    const prc = (a.match(/class="prc[^"]*"[^>]*>([^<]+)/) || [])[1];
    const href = (a.match(/href="(\/[^"]+\.html)"/) || [])[1];
    const priceCents = parseAmountCents(prc || "");
    if (!name || !priceCents || !href) continue;
    const listingUrl = `https://${meta.host}${href}`;
    if (seen.has(listingUrl)) continue;
    seen.add(listingUrl);
    listings.push({
      id: `${shopId}:${sku || listingUrl}`,
      shop,
      shopId,
      country,
      name: name.trim(),
      brand: brand.trim() || null,
      priceCents,
      currency: meta.currency,
      url: listingUrl,
      observedAt: now,
    });
    if (listings.length >= LIMIT) break;
  }
  return listings;
}

export async function searchJumia(query: string, country: MarketCountry = "ke"): Promise<CrawlerResult> {
  const meta = HOSTS[country];
  const shop = country === "ke" ? "Jumia Kenya" : `Jumia ${country.toUpperCase()}`;
  const shopId = `jumia-${country}`;
  const url = jumiaSearchUrl(country, query);
  const fetched = await fetchHtml(url, { acceptLang: meta.lang, timeoutMs: 10_000 });
  if (!fetched.ok) {
    return { shopId, shop, status: "blocked", listings: [], error: fetched.error };
  }

  const fromLd = extractListingsFromHtml(fetched.html, {
    shopId,
    shop,
    country,
    currency: meta.currency,
    pageUrl: url,
    limit: LIMIT,
  });
  const fromCards = parseJumiaCards(fetched.html, country, shop, shopId);
  const listings = mergeListedOffers([fromLd, fromCards], LIMIT).map((row) => ({
    ...row,
    url: withJumiaPartnerTag(row.url),
  }));

  return {
    shopId,
    shop,
    status: listings.length ? "ok" : "empty",
    listings,
  };
}
