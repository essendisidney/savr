import type {
  BasketResult,
  Catalog,
  LineItemPrice,
  ListItem,
  ProductPriceResult,
  RideQuote,
} from "./types";

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

export function compareProduct(catalog: Catalog, productId: string): ProductPriceResult[] {
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
        priceCents: price.priceCents,
      };
    })
    .filter((row): row is { merchantId: string; merchantName: string; priceCents: number } =>
      row !== null,
    )
    .sort((a, b) => a.priceCents - b.priceCents);

  if (!priced.length) return [];
  const best = priced[0].priceCents;

  return priced.map((row) => ({
    ...row,
    deltaCents: row.priceCents - best,
    isCheapest: row.priceCents === best,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${row.merchantName} supermarket Nairobi`,
    )}`,
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

export function compareBasket(catalog: Catalog, items: ListItem[]): BasketResult[] {
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
      totalCents: total,
      cashbackCents: cashback,
      coverage: items.length ? matched / items.length : 0,
      netCents: total - cashback,
      isRecommended: false,
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

export { formatKes } from "./types";
export type {
  ListItem,
  BasketResult,
  RideQuote,
  FuelStation,
  Catalog,
  LineItemPrice,
  ProductPriceResult,
} from "./types";
