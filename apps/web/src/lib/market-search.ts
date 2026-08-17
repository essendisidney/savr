import { searchCarrefour } from "./crawlers/carrefour";
import { searchJiji } from "./crawlers/jiji";
import { searchJumia } from "./crawlers/jumia";
import { searchKilimall } from "./crawlers/kilimall";
import { searchNaivas } from "./crawlers/naivas";
import type { CrawlerResult, MarketCountry, MarketSearchResult, MarketSourceNote } from "./crawlers/types";
import { isMarketCountry } from "./crawlers/types";
import { loadStoredMarketListings, persistMarketListings } from "./market-persist";

export type { MarketCountry, MarketSearchResult } from "./crawlers/types";
export { isMarketCountry };

export function sanitizeMarketQuery(raw: string): string {
  return raw.trim().slice(0, 80);
}

function mergeListings(
  live: MarketSearchResult["listings"],
  stored: MarketSearchResult["listings"],
): MarketSearchResult["listings"] {
  const byUrl = new Map<string, (typeof live)[0]>();
  for (const row of [...stored, ...live]) {
    const key = row.url.replace(/\/+$/, "").toLowerCase();
    const prev = byUrl.get(key);
    if (!prev) {
      byUrl.set(key, row);
      continue;
    }
    const newer = new Date(row.observedAt).getTime() >= new Date(prev.observedAt).getTime();
    byUrl.set(key, newer ? row : prev);
  }
  return [...byUrl.values()].sort((a, b) => a.priceCents - b.priceCents).slice(0, 40);
}

function spreadFor(listings: MarketSearchResult["listings"]) {
  if (listings.length < 2) return null;
  const cheapest = listings[0];
  const priciest = listings[listings.length - 1];
  const saveCents = priciest.priceCents - cheapest.priceCents;
  if (saveCents <= 0) return null;
  return {
    saveCents,
    cheapestShop: cheapest.shop,
    priciestShop: priciest.shop,
  };
}

export async function searchLiveMarket(
  query: string,
  country: MarketCountry = "ke",
): Promise<MarketSearchResult> {
  const queried = sanitizeMarketQuery(query);
  if (!queried) {
    return { queried: "", country, listings: [], sources: [], spread: null, board: "live" };
  }

  const jobs: Promise<CrawlerResult>[] = [searchJumia(queried, country)];
  if (country === "ke") {
    jobs.push(searchKilimall(queried), searchCarrefour(queried), searchNaivas(queried), searchJiji(queried));
  }

  const [settled, stored] = await Promise.all([
    Promise.allSettled(jobs),
    country === "ke" ? loadStoredMarketListings(queried, country) : Promise.resolve([]),
  ]);

  const sources: MarketSourceNote[] = [];
  const live: MarketSearchResult["listings"] = [];
  const seenLive = new Set<string>();

  for (const item of settled) {
    if (item.status === "rejected") {
      sources.push({
        shopId: "unknown",
        shop: "Unknown",
        status: "blocked",
        error: item.reason instanceof Error ? item.reason.message : "Failed",
      });
      continue;
    }
    const r = item.value;
    sources.push({
      shopId: r.shopId,
      shop: r.shop,
      status: r.status,
      error: r.error,
    });
    for (const row of r.listings) {
      const key = row.url.replace(/\/+$/, "").toLowerCase();
      if (seenLive.has(key)) continue;
      seenLive.add(key);
      live.push(row);
    }
  }

  if (live.length) {
    await persistMarketListings(live, queried);
  }

  const listings = mergeListings(live, stored);
  const board = live.length && stored.length ? "mixed" : live.length ? "live" : stored.length ? "stored" : "live";
  if (stored.length) {
    sources.push({
      shopId: "stored",
      shop: "Morning board",
      status: stored.length ? "ok" : "empty",
    });
  }

  return {
    queried,
    country,
    listings,
    sources,
    spread: spreadFor(listings),
    board,
  };
}

export const DAILY_SEEDS = [
  "unga",
  "maize flour",
  "sugar",
  "cooking oil",
  "fresh milk",
  "iphone 13",
];
