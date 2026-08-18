import type { CrawlerResult, MarketListing } from "./types";
import { fetchHtml, parseAmountCents, stripTags } from "./http";
import { extractListingsFromHtml, mergeListedOffers } from "./omni";

const LIMIT = 24;

function hop(data: unknown[], v: unknown): unknown {
  if (typeof v === "number" && v >= 0 && v < data.length) return data[v];
  return v;
}

function listingsFromNuxt(html: string, shopId: string, shop: string): MarketListing[] {
  const block = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!block) return [];
  let data: unknown[];
  try {
    data = JSON.parse(block[1] || "");
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const now = new Date().toISOString();
  const out: MarketListing[] = [];
  const seen = new Set<string>();

  function push(rec: Record<string, unknown>) {
    const listingId = hop(data, rec.listingId);
    const title = hop(data, rec.title);
    const price = hop(data, rec.price);
    const name = typeof title === "string" ? stripTags(title) : "";
    const priceCents = parseAmountCents(String(price ?? ""));
    const id = listingId != null ? String(listingId) : "";
    if (!name || !priceCents || !id) return;
    const listingUrl = `https://www.kilimall.co.ke/listing/${id}`;
    if (seen.has(listingUrl)) return;
    seen.add(listingUrl);
    out.push({
      id: `${shopId}:${id}`,
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

  for (const node of data) {
    if (!node || typeof node !== "object" || Array.isArray(node)) continue;
    const rec = node as Record<string, unknown>;
    if ("result" in rec && "total" in rec) {
      const result = hop(data, rec.result);
      if (Array.isArray(result)) {
        for (const idx of result) {
          const item = hop(data, idx);
          if (item && typeof item === "object" && !Array.isArray(item)) {
            push(item as Record<string, unknown>);
          }
        }
      }
    }
    if ("listingId" in rec && "title" in rec && "price" in rec) push(rec);
    if (out.length >= LIMIT) break;
  }
  return out;
}

function listingsFromHtmlCards(html: string, shopId: string, shop: string): MarketListing[] {
  const listings: MarketListing[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const re =
    /href="(\/listing\/[^"]+)"[\s\S]{0,5000}?class="product-title"[^>]*>([\s\S]*?)<\/p>[\s\S]{0,1500}?class="product-price"[^>]*>([\s\S]*?)<\/div>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) && listings.length < LIMIT) {
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
      observedAt: now,
    });
  }
  return listings;
}

export async function searchKilimall(query: string): Promise<CrawlerResult> {
  const shopId = "kilimall-ke";
  const shop = "Kilimall";
  const url = `https://www.kilimall.co.ke/search?q=${encodeURIComponent(query)}`;
  const fetched = await fetchHtml(url, { acceptLang: "en-KE,en;q=0.9", timeoutMs: 10_000 });
  if (!fetched.ok) {
    return { shopId, shop, status: "blocked", listings: [], error: fetched.error };
  }

  const listings = mergeListedOffers(
    [
      listingsFromHtmlCards(fetched.html, shopId, shop),
      listingsFromNuxt(fetched.html, shopId, shop),
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
    status: listings.length ? "ok" : "empty",
    listings,
  };
}
