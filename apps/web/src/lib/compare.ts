import type { BasketResult, Catalog, ListItem, RideQuote } from "./types";

export function defaultListFromCatalog(catalog: Catalog): ListItem[] {
  const staples = catalog.products.slice(0, 6);
  return staples.map((p) => ({
    productId: p.id,
    freeText: p.name,
    quantity: 1,
  }));
}

function cashbackForBasket(catalog: Catalog, merchantId: string, totalCents: number): number {
  const rule = catalog.cashbackRules.find((r) => r.merchantId === merchantId);
  if (!rule) return 0;
  if (totalCents < rule.minBasketCents) return 0;
  return rule.flatCents;
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
export type { ListItem, BasketResult, RideQuote, FuelStation, Catalog } from "./types";
