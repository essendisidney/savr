import { WEEKLY_30 } from "./weekly-30";
import { searchLiveMarket, sanitizeMarketQuery, DAILY_SEEDS } from "./market-search";
import {
  countStoredListings,
  listCatalogProductsForCrawl,
  listStoredQuerySeeds,
  loadStaleStoredListings,
  persistMarketListings,
} from "./market-persist";
import { refreshStoredListing } from "./crawlers/refresh-listing";
import { applyOnlineScrapesToCatalog } from "./catalog-scrape";
import type { MarketListing } from "./crawlers/types";

const BUDGET_MS = 50_000;
const SEED_BATCH = 8;
const STORED_BATCH = 16;
const STORED_CONCURRENCY = 4;

/** Extra Kenya buy queries that are not grocery SKUs. */
const EXTRA_SEEDS = [
  "unga",
  "jogoo 2kg",
  "kabras sugar",
  "rina cooking oil",
  "brookside milk",
  "exe flour",
  "blue band",
  "omo 1kg",
  "geisha soap",
  "always pads",
  "sukuma wiki",
  "ndengu",
  "pampers",
  "chapati flour",
  "kericho gold",
  "royco",
  "kimbo",
  "panadol",
  "pampers",
  "infinix hot",
  "iphone 13",
  "samsung a15",
  "tecno spark",
  "infinix hot",
];

function uniqueSeeds(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const seed = sanitizeMarketQuery(item);
    const key = seed.toLowerCase();
    if (!seed || seen.has(key)) continue;
    seen.add(key);
    out.push(seed);
  }
  return out;
}

function collectSeedUniverse(products: { name: string; brand: string }[], storedSeeds: string[]): string[] {
  const raw: string[] = [
    ...WEEKLY_30.map((s) => s.name),
    ...WEEKLY_30.map((s) => `${s.brand} ${s.name}`),
    ...products.map((p) => p.name),
    ...products.map((p) => (p.brand && p.brand.toLowerCase() !== "local" ? `${p.brand} ${p.name}` : p.name)),
    ...DAILY_SEEDS,
    ...EXTRA_SEEDS,
    ...storedSeeds,
  ];
  return uniqueSeeds(raw);
}

function pickStaleSeeds(
  universe: string[],
  freshness: Map<string, number>,
  limit: number,
): string[] {
  return [...universe]
    .sort((a, b) => (freshness.get(a.toLowerCase()) ?? 0) - (freshness.get(b.toLowerCase()) ?? 0))
    .slice(0, limit);
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i;
      i += 1;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  return out;
}

/** Stale-first crawl of every catalog SKU + stored listing URL. One Vercel cron slice. */
export async function runKenyaPriceCrawl(opts?: { budgetMs?: number }): Promise<{
  seedUniverse: number;
  seedsRun: string[];
  storedCount: number;
  storedTried: number;
  storedRefreshed: number;
  listings: number;
  catalogPricesWritten: number;
  catalogPricesSkipped: number;
  catalogMatched: number;
  sources: Record<string, string>;
  budgetMs: number;
}> {
  const budgetMs = opts?.budgetMs ?? BUDGET_MS;
  const deadline = Date.now() + budgetMs;
  const products = await listCatalogProductsForCrawl();
  const storedSeedRows = await listStoredQuerySeeds();
  const universe = collectSeedUniverse(
    products,
    storedSeedRows.map((s) => s.seed).filter((s) => s !== "daily-board" && s !== "stored-refresh"),
  );
  const freshness = new Map<string, number>();
  for (const row of storedSeedRows) {
    freshness.set(row.seed.toLowerCase(), new Date(row.lastObservedAt).getTime() || 0);
  }

  const seeds = pickStaleSeeds(universe, freshness, SEED_BATCH);
  const sources: Record<string, string> = {};
  const live: MarketListing[] = [];
  const seedsRun: string[] = [];

  for (const seed of seeds) {
    if (Date.now() > deadline - 14_000) break;
    const result = await searchLiveMarket(seed, "ke");
    seedsRun.push(seed);
    live.push(...result.listings.filter((l) => !l.id.startsWith("stored:")));
    for (const s of result.sources) {
      sources[s.shop] = s.status + (s.error ? `:${s.error}` : "");
    }
  }

  const staleRows = await loadStaleStoredListings(STORED_BATCH);
  let storedRefreshed = 0;
  const refreshed: MarketListing[] = [];
  const toRefresh = staleRows.filter(() => Date.now() < deadline - 6_000);
  const results = await mapPool(toRefresh, STORED_CONCURRENCY, async (row) => {
    if (Date.now() > deadline - 5_000) return null;
    return refreshStoredListing(row);
  });
  for (const next of results) {
    if (!next) continue;
    refreshed.push(next);
    storedRefreshed += 1;
  }
  if (refreshed.length) {
    await persistMarketListings(refreshed);
  }

  const catalog = await applyOnlineScrapesToCatalog([...live, ...refreshed], products);

  return {
    seedUniverse: universe.length,
    seedsRun,
    storedCount: await countStoredListings(),
    storedTried: toRefresh.length,
    storedRefreshed,
    listings: live.length + refreshed.length,
    catalogPricesWritten: catalog.written,
    catalogPricesSkipped: catalog.skipped,
    catalogMatched: catalog.matched,
    sources,
    budgetMs,
  };
}
