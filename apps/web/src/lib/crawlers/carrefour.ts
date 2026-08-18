import type { CrawlerResult, MarketListing } from "./types";
import { SAVR_BOT_UA } from "./types";
import { parseAmountCents } from "./http";

function kesToCents(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function pickPrice(product: Record<string, unknown>): number | null {
  const priceObj = product.price as { price?: unknown } | undefined;
  const offers = product.offers as { price?: unknown }[] | undefined;
  const candidates = [priceObj?.price, offers?.[0]?.price, product.price, product.originalPrice];
  for (const c of candidates) {
    if (c == null) continue;
    if (typeof c === "object" && c && "price" in c) {
      const cents = kesToCents((c as { price?: unknown }).price);
      if (cents) return cents;
    }
    const cents = kesToCents(c);
    if (cents) return cents;
  }
  return null;
}

/** Public Carrefour Kenya search. Often bot-challenged — fail soft. */
export async function searchCarrefour(query: string): Promise<CrawlerResult> {
  const shopId = "carrefour-ke";
  const shop = "Carrefour";
  const url =
    `https://www.carrefour.ke/api/v8/search?keyword=${encodeURIComponent(query)}` +
    `&currentPage=0&pageSize=24&lang=en&latitude=-1.286389&longitude=36.817223` +
    `&requireSponsProducts=false&displayOffers=false&vertical=grocery&storeId=mafken`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": SAVR_BOT_UA,
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.carrefour.ke/mafken/en/",
        "Accept-Language": "en-KE,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    if (!res.ok) {
      return { shopId, shop, status: "blocked", listings: [], error: `HTTP ${res.status}` };
    }
    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
      return {
        shopId,
        shop,
        status: "blocked",
        listings: [],
        error: "Carrefour served a bot challenge",
      };
    }
    const data = JSON.parse(text) as Record<string, unknown>;
    const products = (data.products ?? data.hits ?? (data.data as { products?: unknown } | undefined)?.products) as
      | unknown
      | undefined;
    const list = Array.isArray(products) ? products : [];
    const listings: MarketListing[] = [];
    const seen = new Set<string>();
    const now = new Date().toISOString();
    for (const raw of list) {
      if (listings.length >= 24) break;
      const p = raw as Record<string, unknown>;
      const brandObj = p.brand as { name?: string } | string | undefined;
      const name = String(p.name || p.title || p.productNameEn || "").trim();
      const brand =
        typeof brandObj === "string" ? brandObj : brandObj?.name ? String(brandObj.name) : "";
      const priceCents = pickPrice(p) ?? parseAmountCents(String(p.price ?? ""));
      const path = String(p.url || "");
      const listingUrl = path.startsWith("http")
        ? path
        : path
          ? `https://www.carrefour.ke${path}`
          : `https://www.carrefour.ke/mafken/en/search?keyword=${encodeURIComponent(query)}`;
      if (!name || !priceCents || seen.has(listingUrl) || listingUrl.includes("search?")) continue;
      seen.add(listingUrl);
      listings.push({
        id: `${shopId}:${String(p.id || p.sku || listingUrl)}`,
        shop,
        shopId,
        country: "ke",
        name,
        brand: brand || null,
        priceCents,
        currency: "KES",
        url: listingUrl,
        observedAt: now,
      });
    }
    return { shopId, shop, status: listings.length ? "ok" : "empty", listings };
  } catch (e) {
    return {
      shopId,
      shop,
      status: "blocked",
      listings: [],
      error: e instanceof Error ? e.message : "Carrefour failed",
    };
  }
}
