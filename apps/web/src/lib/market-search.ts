import { searchJiji } from "./crawlers/jiji";
import { searchJumia } from "./crawlers/jumia";
import { searchKilimall } from "./crawlers/kilimall";
import type { CrawlerResult, MarketCountry, MarketSearchResult, MarketSourceNote } from "./crawlers/types";
import { isMarketCountry } from "./crawlers/types";

export type { MarketCountry, MarketSearchResult } from "./crawlers/types";
export { isMarketCountry };

export function sanitizeMarketQuery(raw: string): string {
  return raw.trim().slice(0, 80);
}

export async function searchLiveMarket(
  query: string,
  country: MarketCountry = "ke",
): Promise<MarketSearchResult> {
  const queried = sanitizeMarketQuery(query);
  if (!queried) {
    return { queried: "", country, listings: [], sources: [] };
  }

  const jobs: Promise<CrawlerResult>[] = [searchJumia(queried, country)];
  if (country === "ke") {
    jobs.push(searchKilimall(queried), searchJiji(queried));
  }

  const settled = await Promise.allSettled(jobs);
  const sources: MarketSourceNote[] = [];
  const listings: MarketSearchResult["listings"] = [];
  const seen = new Set<string>();

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
      if (seen.has(key)) continue;
      seen.add(key);
      listings.push(row);
    }
  }

  listings.sort((a, b) => a.priceCents - b.priceCents);
  return { queried, country, listings: listings.slice(0, 40), sources };
}
