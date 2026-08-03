import type {
  BasketResult,
  Catalog,
  LineItemPrice,
  ListItem,
  Merchant,
  MissedSavingsResult,
  Product,
  ProductPriceResult,
  Promotion,
  RideQuote,
} from "./types";
import { haversineKm, type GeoPoint } from "./geo";
import { aggregateConfidence, priceConfidence } from "./freshness";
import { compareRidesForRoute } from "./rides";

export { compareRidesForRoute } from "./rides";

function priceForBranch(
  catalog: Catalog,
  merchantId: string,
  locationId: string | null | undefined,
  productId: string,
) {
  if (locationId) {
    const exact = catalog.prices.find(
      (p) =>
        p.merchantId === merchantId &&
        p.productId === productId &&
        p.locationId === locationId,
    );
    if (exact) return exact;
  }
  return catalog.prices.find(
    (p) => p.merchantId === merchantId && p.productId === productId,
  );
}

/** Classic Nairobi weekly shop — match by name so catalog order never breaks the wedge demo. */
const WEEKLY_STAPLE_MATCHERS: { label: string; match: RegExp }[] = [
  { label: "Fresh Milk 500ml", match: /^fresh milk 500ml$/i },
  { label: "White Bread 400g", match: /^white bread 400g$/i },
  { label: "Basmati Rice 2kg", match: /^(basmati|pishori) rice 2kg$/i },
  { label: "Sugar 1kg", match: /^sugar 1kg$/i },
  { label: "Bar Soap 800g", match: /bar soap/i },
  { label: "Cooking Oil 2L", match: /cooking oil 2l/i },
  { label: "Eggs Tray 30", match: /eggs tray/i },
  { label: "Maize Flour 2kg", match: /maize flour 2kg/i },
  { label: "Sukuma Wiki", match: /sukuma wiki/i },
  { label: "Tomatoes 1kg", match: /^tomatoes 1kg$/i },
];

/** One-tap adds beyond the default weekly set — short labels for the chip row. */
const QUICK_ADD_MATCHERS: { chip: string; match: RegExp }[] = [
  { chip: "Eggs", match: /eggs tray/i },
  { chip: "Tea", match: /tea leaves/i },
  { chip: "Ugali flour", match: /maize flour 2kg/i },
  { chip: "Sukuma", match: /sukuma wiki/i },
  { chip: "Tomatoes", match: /^tomatoes 1kg$/i },
  { chip: "Onions", match: /^onions 1kg$/i },
  { chip: "Bananas", match: /^bananas 1kg$/i },
  { chip: "Chicken", match: /chicken (pieces|broiler)/i },
  { chip: "Yoghurt", match: /yoghurt/i },
  { chip: "Detergent", match: /laundry detergent/i },
  { chip: "Tissue", match: /tissue (paper|rolls)/i },
  { chip: "Noodles", match: /instant noodles|spaghetti 500g/i },
];

export function defaultListFromCatalog(catalog: Catalog): ListItem[] {
  const picked: ListItem[] = [];
  const used = new Set<string>();

  for (const staple of WEEKLY_STAPLE_MATCHERS) {
    const product = catalog.products.find(
      (p) => !used.has(p.id) && staple.match.test(p.name),
    );
    if (!product) continue;
    used.add(product.id);
    picked.push({ productId: product.id, freeText: product.name, quantity: 1 });
    if (picked.length >= 10) break;
  }

  if (picked.length >= 4) return picked;

  // Fallback if seed names drift — keep a usable demo basket.
  return catalog.products.slice(0, 8).map((p) => ({
    productId: p.id,
    freeText: p.name,
    quantity: 1,
  }));
}

export function quickAddChips(
  catalog: Catalog,
  excludeIds: string[] = [],
  limit = 8,
): { productId: string; name: string; chip: string }[] {
  const excluded = new Set(excludeIds);
  const chips: { productId: string; name: string; chip: string }[] = [];

  for (const entry of QUICK_ADD_MATCHERS) {
    const product = catalog.products.find(
      (p) => !excluded.has(p.id) && entry.match.test(p.name),
    );
    if (!product) continue;
    excluded.add(product.id);
    chips.push({ productId: product.id, name: product.name, chip: entry.chip });
    if (chips.length >= limit) break;
  }

  return chips;
}

export function searchProducts(
  catalog: Catalog,
  query: string,
  excludeIds: string[] = [],
  limit = 8,
) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/[^a-z0-9+]+/).filter((t) => t.length > 2);
  return catalog.products
    .filter((p) => !excludeIds.includes(p.id))
    .map((p) => {
      const hay = `${p.name} ${p.brand ?? ""} ${p.category}`.toLowerCase();
      let score = 0;
      if (hay.includes(q)) score += 100;
      for (const t of tokens) {
        if (hay.includes(t)) score += 10;
      }
      return { p, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.p);
}

/** Best single product for an Ask free-text query. */
export function bestAskProductMatch(catalog: Catalog, raw: string) {
  const hits = searchProducts(catalog, raw, [], 1);
  return hits[0] ?? null;
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

function activePromosForMerchant(catalog: Catalog, merchantId: string): Promotion[] {
  const now = Date.now();
  return (catalog.promotions ?? []).filter((p) => {
    if (p.merchantId !== merchantId) return false;
    if (!p.endsAt) return true;
    const ends = new Date(p.endsAt).getTime();
    return Number.isFinite(ends) ? ends > now : true;
  });
}

function discountFromPromo(promo: Promotion, amountCents: number): number {
  if (amountCents <= 0) return 0;
  let discount = 0;
  if (promo.discountPercent != null && promo.discountPercent > 0) {
    discount = Math.round((amountCents * promo.discountPercent) / 100);
  }
  if (promo.flatCents != null && promo.flatCents > 0) {
    discount = Math.max(discount, promo.flatCents);
  }
  return Math.min(amountCents, Math.max(0, discount));
}

/** Best product- or category-scoped promo for one line. */
function linePromoDiscount(
  promos: Promotion[],
  product: Product | undefined,
  lineCents: number,
): { cents: number; title: string | null } {
  if (!product || lineCents <= 0) return { cents: 0, title: null };

  const productPromos = promos.filter((p) => p.productId === product.id);
  const categoryPromos = promos.filter(
    (p) =>
      !p.productId &&
      p.category &&
      p.category.toLowerCase() === product.category.toLowerCase(),
  );
  const candidates = productPromos.length ? productPromos : categoryPromos;

  let best = 0;
  let title: string | null = null;
  for (const promo of candidates) {
    const d = discountFromPromo(promo, lineCents);
    if (d > best) {
      best = d;
      title = promo.title;
    }
  }
  return { cents: best, title };
}

function storeWidePromoDiscount(
  promos: Promotion[],
  basketCents: number,
): { cents: number; title: string | null } {
  const wide = promos.filter((p) => !p.productId && !p.category);
  let best = 0;
  let title: string | null = null;
  for (const promo of wide) {
    const d = discountFromPromo(promo, basketCents);
    if (d > best) {
      best = d;
      title = promo.title;
    }
  }
  return { cents: best, title };
}

function productPromoForUnit(
  catalog: Catalog,
  merchantId: string,
  productId: string,
  unitCents: number,
): { cents: number; title: string | null } {
  const product = catalog.products.find((p) => p.id === productId);
  const promos = activePromosForMerchant(catalog, merchantId);
  return linePromoDiscount(promos, product, unitCents);
}

export function compareProduct(
  catalog: Catalog,
  productId: string,
  origin?: GeoPoint | null,
): ProductPriceResult[] {
  const grocery = catalog.merchants.filter((m) => m.category === "grocery");
  const priced = grocery
    .map((merchant) => {
      const price = priceForBranch(
        catalog,
        merchant.id,
        merchant.locationId ?? merchant.location?.id,
        productId,
      );
      if (!price) return null;
      const promo = productPromoForUnit(catalog, merchant.id, productId, price.priceCents);
      const effective = Math.max(0, price.priceCents - promo.cents);
      const conf = priceConfidence(price.observedAt, price.source, price.tipCount);
      return {
        merchantId: merchant.id,
        locationId: merchant.locationId ?? merchant.location?.id ?? null,
        merchantName: merchant.name,
        branchName: merchant.location?.name ?? null,
        address: merchant.location?.address ?? null,
        priceCents: effective,
        listCents: price.priceCents,
        promoCents: promo.cents,
        promoLabel: promo.title,
        mapsUrl: mapsUrlForMerchant(merchant, origin),
        distanceKm: distanceForMerchant(merchant, origin),
        observedAt: price.observedAt ?? null,
        source: price.source ?? null,
        prevPriceCents: price.prevPriceCents ?? null,
        prevObservedAt: price.prevObservedAt ?? null,
        tipCount: price.tipCount ?? null,
        confidenceScore: conf.score,
        confidenceLevel: conf.level,
        confidenceLabel: conf.label,
      };
    })
    .filter(
      (
        row,
      ): row is {
        merchantId: string;
        locationId: string | null;
        merchantName: string;
        branchName: string | null;
        address: string | null;
        priceCents: number;
        listCents: number;
        promoCents: number;
        promoLabel: string | null;
        mapsUrl: string;
        distanceKm: number | null;
        observedAt: string | null;
        source: string | null;
        prevPriceCents: number | null;
        prevObservedAt: string | null;
        tipCount: number | null;
        confidenceScore: number;
        confidenceLevel: "high" | "medium" | "low";
        confidenceLabel: string;
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
  locationId?: string | null,
): LineItemPrice[] {
  const promos = activePromosForMerchant(catalog, merchantId);
  return items.map((item) => {
    const price = priceForBranch(catalog, merchantId, locationId, item.productId);
    const product = catalog.products.find((p) => p.id === item.productId);
    const lineCents = price ? price.priceCents * item.quantity : null;
    const promo =
      lineCents != null ? linePromoDiscount(promos, product, lineCents) : { cents: 0, title: null };
    const conf = price
      ? priceConfidence(price.observedAt, price.source, price.tipCount)
      : null;
    return {
      productId: item.productId,
      name: item.freeText,
      quantity: item.quantity,
      unitCents: price?.priceCents ?? null,
      lineCents,
      promoCents: promo.cents,
      observedAt: price?.observedAt ?? null,
      source: price?.source ?? null,
      prevPriceCents: price?.prevPriceCents ?? null,
      prevObservedAt: price?.prevObservedAt ?? null,
      tipCount: price?.tipCount ?? null,
      confidenceScore: conf?.score ?? null,
      confidenceLevel: conf?.level ?? null,
      confidenceLabel: conf?.shortLabel ?? null,
    };
  });
}

export function compareBasket(
  catalog: Catalog,
  items: ListItem[],
  origin?: GeoPoint | null,
  merchantIds?: string[] | null,
): BasketResult[] {
  if (!items.length) return [];

  let grocery = catalog.merchants.filter((m) => m.category === "grocery");
  if (merchantIds?.length) {
    const allow = new Set(merchantIds);
    grocery = grocery.filter((m) => allow.has(m.id));
  }
  const results = grocery.map((merchant) => {
    const locId = merchant.locationId ?? merchant.location?.id ?? null;
    const promos = activePromosForMerchant(catalog, merchant.id);
    let total = 0;
    let matched = 0;
    let linePromoTotal = 0;
    let weekDelta = 0;
    let weekN = 0;
    const labels = new Set<string>();
    const confLines: { observedAt?: string | null; source?: string | null; tipCount?: number | null }[] = [];

    for (const item of items) {
      const price = priceForBranch(catalog, merchant.id, locId, item.productId);
      if (!price) continue;
      const line = price.priceCents * item.quantity;
      total += line;
      matched += 1;
      confLines.push({
        observedAt: price.observedAt,
        source: price.source,
        tipCount: price.tipCount,
      });
      if (price.prevPriceCents != null && Number.isFinite(price.prevPriceCents)) {
        weekDelta += (price.priceCents - price.prevPriceCents) * item.quantity;
        weekN += 1;
      }
      const product = catalog.products.find((p) => p.id === item.productId);
      const linePromo = linePromoDiscount(promos, product, line);
      linePromoTotal += linePromo.cents;
      if (linePromo.title) labels.add(linePromo.title);
    }

    const afterLinePromos = Math.max(0, total - linePromoTotal);
    const storeWide = storeWidePromoDiscount(promos, afterLinePromos);
    if (storeWide.title && storeWide.cents > 0) labels.add(storeWide.title);
    const promoCents = linePromoTotal + storeWide.cents;
    const cashback = cashbackForBasket(catalog, merchant.id, total);
    const promoLabel =
      labels.size === 0
        ? null
        : labels.size === 1
          ? Array.from(labels)[0]
          : `${labels.size} promos`;
    const weekDeltaCents =
      matched > 0 && weekN >= Math.max(1, Math.ceil(matched * 0.5)) ? weekDelta : null;
    const conf = aggregateConfidence(confLines);

    return {
      merchantId: merchant.id,
      locationId: locId,
      merchantName: merchant.name,
      branchName: merchant.location?.name ?? null,
      totalCents: total,
      cashbackCents: cashback,
      promoCents,
      promoLabel,
      coverage: items.length ? matched / items.length : 0,
      netCents: Math.max(0, total - promoCents - cashback),
      isRecommended: false,
      mapsUrl: mapsUrlForMerchant(merchant, origin),
      distanceKm: distanceForMerchant(merchant, origin),
      weekDeltaCents,
      confidenceScore: conf?.score ?? null,
      confidenceLevel: conf?.level ?? null,
      confidenceLabel: conf?.label ?? null,
    };
  });

  if (!results.length) return [];
  const sorted = results
    .slice()
    .sort((a, b) => {
      if (a.netCents !== b.netCents) return a.netCents - b.netCents;
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
  const bestNet = sorted[0]?.netCents;
  return sorted.map((r, i) => ({
    ...r,
    isRecommended: i === 0 && r.coverage > 0 && r.netCents === bestNet,
  }));
}

export function compareRides(destination: string): RideQuote[] {
  return compareRidesForRoute("Westlands", destination);
}

/** What you paid at one store/branch vs the best basket total elsewhere. */
export function computeMissedSavings(
  catalog: Catalog,
  items: ListItem[],
  paidMerchantId: string,
  paidLocationId?: string | null,
): MissedSavingsResult | null {
  if (!items.length || !paidMerchantId) return null;

  const ranks = compareBasket(catalog, items);
  const paid =
    (paidLocationId
      ? ranks.find(
          (r) => r.merchantId === paidMerchantId && r.locationId === paidLocationId,
        )
      : null) ?? ranks.find((r) => r.merchantId === paidMerchantId);
  const best = ranks.find((r) => r.isRecommended) ?? ranks[0];
  if (!paid || !best || paid.coverage === 0) return null;

  const missedCents = Math.max(0, paid.netCents - best.netCents);
  const sameBranch =
    paid.merchantId === best.merchantId &&
    (paid.locationId ?? null) === (best.locationId ?? null);
  const alreadyOptimal = sameBranch || missedCents === 0;

  return {
    paidMerchantId: paid.merchantId,
    paidMerchantName: paid.branchName
      ? `${paid.merchantName} · ${paid.branchName}`
      : paid.merchantName,
    paidTotalCents: paid.totalCents,
    paidCashbackCents: paid.cashbackCents,
    paidNetCents: paid.netCents,
    paidCoverage: paid.coverage,
    bestMerchantId: best.merchantId,
    bestMerchantName: best.branchName
      ? `${best.merchantName} · ${best.branchName}`
      : best.merchantName,
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
