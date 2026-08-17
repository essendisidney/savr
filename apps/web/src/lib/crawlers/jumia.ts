import type { CrawlerResult, MarketCountry, MarketCurrency, MarketListing } from "./types";
import { decodeHtml, fetchHtml, parseAmountCents } from "./http";
import { withJumiaPartnerTag } from "./affiliate";
import { withHtmlOmniFallback } from "./omni";

const HOSTS: Record<
  MarketCountry,
  { host: string; currency: MarketCurrency; lang: string }
> = {
  ke: { host: "www.jumia.co.ke", currency: "KES", lang: "en-KE,en;q=0.9" },
  ng: { host: "www.jumia.com.ng", currency: "NGN", lang: "en-NG,en;q=0.9" },
  ug: { host: "www.jumia.ug", currency: "UGX", lang: "en-UG,en;q=0.9" },
  tz: { host: "www.jumia.co.tz", currency: "TZS", lang: "en-TZ,en;q=0.9" },
  gh: { host: "www.jumia.com.gh", currency: "GHS", lang: "en-GH,en;q=0.9" },
};

export function jumiaSearchUrl(country: MarketCountry, query: string): string {
  return `https://${HOSTS[country].host}/catalog/?q=${encodeURIComponent(query)}`;
}

export async function searchJumia(query: string, country: MarketCountry): Promise<CrawlerResult> {
  const meta = HOSTS[country];
  const shop = `Jumia ${country.toUpperCase()}`;
  const shopId = `jumia-${country}`;
  const url = jumiaSearchUrl(country, query);
  const fetched = await fetchHtml(url, { acceptLang: meta.lang });
  if (!fetched.ok) {
    return {
      shopId,
      shop,
      status: "blocked",
      listings: [],
      error: fetched.error,
    };
  }

  const articles = [...fetched.html.matchAll(/<article[^>]*class="prd[\s\S]*?<\/article>/g)];
  const listings: MarketListing[] = [];
  const seen = new Set<string>();

  for (const m of articles) {
    const a = m[0];
    const name = decodeHtml((a.match(/data-ga4-item_name="([^"]+)"/) || [])[1] || "");
    const brand = decodeHtml((a.match(/data-ga4-item_brand="([^"]+)"/) || [])[1] || "");
    const sku = (a.match(/data-sku="([^"]+)"/) || [])[1];
    const prc = (a.match(/class="prc[^"]*"[^>]*>([^<]+)/) || [])[1];
    const gaPrice = (a.match(/data-ga4-item_price="([^"]+)"/) || [])[1];
    const href = (a.match(/href="(\/[^"]+\.html)"/) || [])[1];
    const priceCents = parseAmountCents(prc) ?? parseAmountCents(gaPrice || "");
    if (!name || !priceCents) continue;
    const listingUrl = withJumiaPartnerTag(href ? `https://${meta.host}${href}` : url);
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
      observedAt: new Date().toISOString(),
    });
    if (listings.length >= 12) break;
  }

  const resolved = withHtmlOmniFallback(listings, fetched.html, {
    shopId,
    shop,
    country,
    currency: meta.currency,
    pageUrl: url,
    limit: 12,
  }).map((row) => ({ ...row, url: withJumiaPartnerTag(row.url) }));

  return {
    shopId,
    shop,
    status: resolved.length ? "ok" : "empty",
    listings: resolved,
  };
}
