import type {
  BasketResult,
  Catalog,
  LineItemPrice,
  ListItem,
  Merchant,
  MissedSavingsResult,
  ProductPriceResult,
  RideQuote,
} from "./types";
import { haversineKm, type GeoPoint } from "./geo";

export function defaultListFromCatalog(catalog: Catalog): ListItem[] {
  const staples = catalog.products.slice(0, 6);
  return staples.map((p) => ({
    productId: p.id,
    freeText: p.name,
    quantity: 1,
  }));
}

export function searchProducts(
  catalog: Catalog,
  query: string,
  excludeIds: string[] = [],
  limit = 8,
) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return catalog.products
    .filter((p) => !excludeIds.includes(p.id))
    .filter((p) => {
      const hay = `${p.name} ${p.brand ?? ""} ${p.category}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);
}

function distanceForMerchant(merchant: Merchant, origin?: GeoPoint | null): number | null {
  const lat = merchant.location?.lat;
  const lng = merchant.location?.lng;
  if (origin == null || lat == null || lng == null) return null;
  return Math.round(haversineKm(origin, { lat, lng }) * 10) / 10;
}

function mapsUrlForMerchant(merchant: Merchant, origin?: GeoPoint | null): string {
  const loc = merchant.location;
  if (loc?.lat != null && loc?.lng != null) {
    const dest = `${loc.lat},${loc.lng}`;
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  }
  const query = [loc?.name, loc?.address, merchant.name, loc?.city ?? "Nairobi"]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function compareProduct(
  catalog: Catalog,
  productId: string,
  origin?: GeoPoint | null,
): ProductPriceResult[] {
  const grocery = catalog.merchants.filter((m) => m.category === "grocery");
  const priced = grocery
    .map((merchant) => {
      const price = catalog.prices.find(
        (p) => p.merchantId === merchant.id && p.productId === productId,
      );
      if (!price) return null;
      return {
        merchantId: merchant.id,
        merchantName: merchant.name,
        branchName: merchant.location?.name ?? null,
        address: merchant.location?.address ?? null,
        priceCents: price.priceCents,
        mapsUrl: mapsUrlForMerchant(merchant, origin),
        distanceKm: distanceForMerchant(merchant, origin),
      };
    })
    .filter(
      (
        row,
      ): row is {
        merchantId: string;
        merchantName: string;
        branchName: string | null;
        address: string | null;
        priceCents: number;
        mapsUrl: string;
        distanceKm: number | null;
      } => row !== null,
    )
    .sort((a, b) => a.priceCents - b.priceCents);

  if (!priced.length) return [];
  const best = priced[0].priceCents;

  return priced.map((row) => ({
    ...row,
    deltaCents: row.priceCents - best,
    isCheapest: row.priceCents === best,
  }));
}

function cashbackForBasket(catalog: Catalog, merchantId: string, totalCents: number): number {
  const rule = catalog.cashbackRules.find((r) => r.merchantId === merchantId);
  if (!rule) return 0;
  if (totalCents < rule.minBasketCents) return 0;
  return rule.flatCents;
}

export function lineItemsForMerchant(
  catalog: Catalog,
  items: ListItem[],
  merchantId: string,
): LineItemPrice[] {
  return items.map((item) => {
    const price = catalog.prices.find(
      (p) => p.merchantId === merchantId && p.productId === item.productId,
    );
    return {
      productId: item.productId,
      name: item.freeText,
      quantity: item.quantity,
      unitCents: price?.priceCents ?? null,
      lineCents: price ? price.priceCents * item.quantity : null,
    };
  });
}

export function compareBasket(
  catalog: Catalog,
  items: ListItem[],
  origin?: GeoPoint | null,
): BasketResult[] {
  if (!items.length) return [];

  const grocery = catalog.merchants.filter((m) => m.category === "grocery");
  const results = grocery.map((merchant) => {
    let total = 0;
    let matched = 0;
    for (const item of items) {
      const price = catalog.prices.find(
        (p) => p.merchantId === merchant.id && p.productId === item.productId,
      );
      if (price) {
        total += price.priceCents * item.quantity;
        matched += 1;
      }
    }
    const cashback = cashbackForBasket(catalog, merchant.id, total);
    return {
      merchantId: merchant.id,
      merchantName: merchant.name,
      branchName: merchant.location?.name ?? null,
      totalCents: total,
      cashbackCents: cashback,
      coverage: items.length ? matched / items.length : 0,
      netCents: total - cashback,
      isRecommended: false,
      mapsUrl: mapsUrlForMerchant(merchant, origin),
      distanceKm: distanceForMerchant(merchant, origin),
    };
  });

  if (!results.length) return [];
  const bestNet = Math.min(...results.map((r) => r.netCents));
  return results
    .map((r) => ({ ...r, isRecommended: r.netCents === bestNet && r.coverage > 0 }))
    .sort((a, b) => a.netCents - b.netCents);
}

export function compareRides(destination: string): RideQuote[] {
  void destination;
  return [
    { partner: "Bolt", priceCents: 74000, etaMin: 4, cashbackCents: 2000, deepLink: "https://bolt.eu" },
    { partner: "Little", priceCents: 81000, etaMin: 6, cashbackCents: 1500, deepLink: "https://little.africa" },
    { partner: "Uber", priceCents: 89000, etaMin: 5, cashbackCents: 1000, deepLink: "https://uber.com" },
  ].sort((a, b) => a.priceCents - a.cashbackCents - (b.priceCents - b.cashbackCents));
}

/** What you paid at one store vs the best basket total elsewhere. */
export function computeMissedSavings(
  catalog: Catalog,
  items: ListItem[],
  paidMerchantId: string,
): MissedSavingsResult | null {
  if (!items.length || !paidMerchantId) return null;

  const ranks = compareBasket(catalog, items);
  const paid = ranks.find((r) => r.merchantId === paidMerchantId);
  const best = ranks.find((r) => r.isRecommended) ?? ranks[0];
  if (!paid || !best || paid.coverage === 0) return null;

  const missedCents = Math.max(0, paid.netCents - best.netCents);
  const alreadyOptimal = best.merchantId === paid.merchantId || missedCents === 0;

  return {
    paidMerchantId: paid.merchantId,
    paidMerchantName: paid.merchantName,
    paidTotalCents: paid.totalCents,
    paidCashbackCents: paid.cashbackCents,
    paidNetCents: paid.netCents,
    paidCoverage: paid.coverage,
    bestMerchantId: best.merchantId,
    bestMerchantName: best.merchantName,
    bestTotalCents: best.totalCents,
    bestCashbackCents: best.cashbackCents,
    bestNetCents: best.netCents,
    missedCents: alreadyOptimal ? 0 : missedCents,
    alreadyOptimal,
  };
}

export { formatKes } from "./types";
export type {
  ListItem,
  BasketResult,
  RideQuote,
  FuelStation,
  Catalog,
  LineItemPrice,
  ProductPriceResult,
  MissedSavingsResult,
} from "./types";
