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
  return compareRidesForRoute("Westlands", destination);
}

const NAIROBI_PLACES: Record<string, { lat: number; lng: number; baseFare: number }> = {
  westlands: { lat: -1.2674, lng: 36.811, baseFare: 350 },
  cbd: { lat: -1.2864, lng: 36.8172, baseFare: 320 },
  airport: { lat: -1.3192, lng: 36.9275, baseFare: 900 },
  jkia: { lat: -1.3192, lng: 36.9275, baseFare: 900 },
  karen: { lat: -1.3195, lng: 36.715, baseFare: 700 },
  kilimani: { lat: -1.2921, lng: 36.787, baseFare: 400 },
  lavington: { lat: -1.277, lng: 36.768, baseFare: 450 },
  eastleigh: { lat: -1.274, lng: 36.848, baseFare: 500 },
  thika: { lat: -1.038, lng: 37.083, baseFare: 1200 },
};

function placeKey(label: string): string {
  return label.trim().toLowerCase();
}

function resolvePlace(label: string): { lat: number; lng: number; baseFare: number } | null {
  const key = placeKey(label);
  if (NAIROBI_PLACES[key]) return NAIROBI_PLACES[key];
  const hit = Object.entries(NAIROBI_PLACES).find(([k]) => key.includes(k) || k.includes(key));
  return hit ? hit[1] : null;
}

function routeSeed(pickup: string, destination: string): number {
  const s = `${placeKey(pickup)}→${placeKey(destination)}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Estimated Nairobi quotes — clearly labeled until partner APIs are live. */
export function compareRidesForRoute(pickup: string, destination: string): RideQuote[] {
  const from = resolvePlace(pickup);
  const to = resolvePlace(destination);
  let km = 8;
  if (from && to) {
    km = Math.max(1.5, haversineKm(from, to));
  } else {
    const seed = routeSeed(pickup, destination);
    km = 4 + (seed % 18);
  }

  const perKm = 55;
  const base = Math.round((320 + km * perKm) * 100); // cents
  const seed = routeSeed(pickup, destination || "nairobi");
  const destQ = encodeURIComponent(destination.trim() || "Nairobi");
  const pickQ = encodeURIComponent(pickup.trim() || "Westlands");

  const partners: Omit<RideQuote, "netCents" | "isEstimated">[] = [
    {
      partner: "Bolt",
      priceCents: Math.round(base * (0.92 + ((seed % 5) * 0.01))),
      etaMin: Math.max(3, Math.round(4 + km * 0.35)),
      cashbackCents: 2000,
      deepLink: `https://bolt.eu/en-ke/?pickup=${pickQ}&destination=${destQ}`,
    },
    {
      partner: "Little",
      priceCents: Math.round(base * (0.98 + ((seed % 7) * 0.012))),
      etaMin: Math.max(4, Math.round(5 + km * 0.4)),
      cashbackCents: 1500,
      deepLink: `https://little.africa/?from=${pickQ}&to=${destQ}`,
    },
    {
      partner: "Uber",
      priceCents: Math.round(base * (1.05 + ((seed % 4) * 0.015))),
      etaMin: Math.max(3, Math.round(4 + km * 0.38)),
      cashbackCents: 1000,
      deepLink: `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${destQ}`,
    },
  ];

  return partners
    .map((p) => ({
      ...p,
      netCents: p.priceCents - p.cashbackCents,
      isEstimated: true,
    }))
    .sort((a, b) => a.netCents - b.netCents);
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
