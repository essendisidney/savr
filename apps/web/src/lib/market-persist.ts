import type { MarketCountry, MarketListing } from "./crawlers/types";
import { createAdminClient } from "./supabase-admin";

export async function persistMarketListings(
  listings: MarketListing[],
  querySeed?: string,
): Promise<{ written: number; error?: string }> {
  if (!listings.length) return { written: 0 };
  try {
    const admin = createAdminClient();
    const rows = listings.map((l) => {
      const row: Record<string, unknown> = {
        shop_id: l.shopId,
        shop: l.shop,
        country: l.country,
        name: l.name.slice(0, 240),
        brand: l.brand,
        url: l.url,
        price_cents: l.priceCents,
        currency: l.currency,
        observed_at: l.observedAt,
      };
      if (querySeed) row.query_seed = querySeed.slice(0, 80);
      return row;
    });

    let written = 0;
    for (const row of rows) {
      const { data: existing } = await admin
        .from("market_listings")
        .select("price_cents")
        .eq("url", String(row.url))
        .maybeSingle();

      const payload: Record<string, unknown> = { ...row };
      if (existing && existing.price_cents !== row.price_cents) {
        payload.prev_price_cents = existing.price_cents;
      }

      const { error } = await admin.from("market_listings").upsert(payload, { onConflict: "url" });
      if (!error) written += 1;
    }
    return { written };
  } catch (e) {
    return { written: 0, error: e instanceof Error ? e.message : "persist failed" };
  }
}

export async function loadStoredMarketListings(
  query: string,
  country: MarketCountry,
): Promise<MarketListing[]> {
  try {
    const admin = createAdminClient();
    const tokens = query
      .toLowerCase()
      .split(/[^a-z0-9+]+/)
      .filter((t) => t.length > 1)
      .slice(0, 5);
    if (!tokens.length) return [];

    const { data, error } = await admin
      .from("market_listings")
      .select("id, shop_id, shop, country, name, brand, url, price_cents, currency, observed_at")
      .eq("country", country)
      .ilike("name", `%${tokens[0]}%`)
      .order("price_cents", { ascending: true })
      .limit(40);
    if (error || !data?.length) return [];

    return data
      .filter((row) => {
        const hay = String(row.name ?? "").toLowerCase();
        return tokens.every((t) => hay.includes(t));
      })
      .map((row) => ({
        id: `stored:${row.id}`,
        shop: String(row.shop),
        shopId: String(row.shop_id),
        country: row.country as MarketCountry,
        name: String(row.name),
        brand: row.brand ? String(row.brand) : null,
        priceCents: Number(row.price_cents),
        currency: (row.currency as MarketListing["currency"]) ?? "KES",
        url: String(row.url),
        observedAt: String(row.observed_at),
      }));
  } catch {
    return [];
  }
}

export async function listStoredQuerySeeds(): Promise<{ seed: string; lastObservedAt: string }[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("market_listings")
      .select("query_seed, observed_at")
      .not("query_seed", "is", null)
      .limit(2000);
    if (error || !data?.length) return [];
    const latest = new Map<string, string>();
    for (const row of data) {
      const seed = String(row.query_seed ?? "").trim();
      if (!seed) continue;
      const at = String(row.observed_at ?? "");
      const prev = latest.get(seed);
      if (!prev || at > prev) latest.set(seed, at);
    }
    return [...latest.entries()].map(([seed, lastObservedAt]) => ({ seed, lastObservedAt }));
  } catch {
    return [];
  }
}

export async function listCatalogProductsForCrawl(): Promise<
  { id: string; name: string; brand: string }[]
> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("products")
      .select("id, name, brand")
      .order("name")
      .limit(500);
    if (error || !data?.length) return [];
    return data.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? "").trim(),
      brand: String(row.brand ?? "").trim(),
    })).filter((p) => p.id && p.name);
  } catch {
    return [];
  }
}

export async function loadStaleStoredListings(limit = 20): Promise<MarketListing[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("market_listings")
      .select("id, shop_id, shop, country, name, brand, url, price_cents, currency, observed_at")
      .order("observed_at", { ascending: true })
      .limit(Math.max(1, Math.min(limit, 80)));
    if (error || !data?.length) return [];
    return data.map((row) => ({
      id: String(row.id),
      shop: String(row.shop),
      shopId: String(row.shop_id),
      country: (row.country as MarketCountry) || "ke",
      name: String(row.name),
      brand: row.brand ? String(row.brand) : null,
      priceCents: Number(row.price_cents),
      currency: (row.currency as MarketListing["currency"]) ?? "KES",
      url: String(row.url),
      observedAt: String(row.observed_at),
    }));
  } catch {
    return [];
  }
}

export async function countStoredListings(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("market_listings")
      .select("id", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
