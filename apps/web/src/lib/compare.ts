export type MoneyCents = number;

export function formatKes(cents: MoneyCents): string {
  return `KES ${Math.round(cents / 100).toLocaleString("en-KE")}`;
}

export type Merchant = {
  id: string;
  name: string;
  slug: string;
  category: "grocery" | "fuel" | "ride_partner";
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
};

export type MerchantPrice = {
  merchantId: string;
  productId: string;
  priceCents: number;
};

export type ListItem = {
  productId: string;
  freeText: string;
  quantity: number;
};

export type BasketResult = {
  merchantId: string;
  merchantName: string;
  totalCents: number;
  cashbackCents: number;
  coverage: number;
  netCents: number;
  isRecommended: boolean;
};

export const merchants: Merchant[] = [
  { id: "m-naivas", name: "Naivas", slug: "naivas", category: "grocery" },
  { id: "m-quickmart", name: "Quickmart", slug: "quickmart", category: "grocery" },
  { id: "m-carrefour", name: "Carrefour", slug: "carrefour", category: "grocery" },
];

export const products: Product[] = [
  { id: "p-milk", name: "Fresh Milk 500ml", brand: "Brookside", category: "dairy", unit: "piece" },
  { id: "p-bread", name: "White Bread 400g", brand: "Super Loaf", category: "bakery", unit: "piece" },
  { id: "p-rice", name: "Basmati Rice 2kg", brand: "Pishori", category: "staples", unit: "piece" },
  { id: "p-sugar", name: "Sugar 1kg", brand: "Mumias", category: "staples", unit: "piece" },
  { id: "p-soap", name: "Bar Soap 800g", brand: "Geisha", category: "household", unit: "piece" },
  { id: "p-oil", name: "Cooking Oil 2L", brand: "Rina", category: "staples", unit: "piece" },
];

/** Seed prices aligned with docs vision (≈ Naivas 4280 / Quickmart 4050 / Carrefour 3960). */
export const prices: MerchantPrice[] = [
  { merchantId: "m-naivas", productId: "p-milk", priceCents: 7500 },
  { merchantId: "m-naivas", productId: "p-bread", priceCents: 7000 },
  { merchantId: "m-naivas", productId: "p-rice", priceCents: 145000 },
  { merchantId: "m-naivas", productId: "p-sugar", priceCents: 18000 },
  { merchantId: "m-naivas", productId: "p-soap", priceCents: 22000 },
  { merchantId: "m-naivas", productId: "p-oil", priceCents: 159000 },

  { merchantId: "m-quickmart", productId: "p-milk", priceCents: 7200 },
  { merchantId: "m-quickmart", productId: "p-bread", priceCents: 6800 },
  { merchantId: "m-quickmart", productId: "p-rice", priceCents: 138000 },
  { merchantId: "m-quickmart", productId: "p-sugar", priceCents: 17500 },
  { merchantId: "m-quickmart", productId: "p-soap", priceCents: 21000 },
  { merchantId: "m-quickmart", productId: "p-oil", priceCents: 148500 },

  { merchantId: "m-carrefour", productId: "p-milk", priceCents: 7000 },
  { merchantId: "m-carrefour", productId: "p-bread", priceCents: 6500 },
  { merchantId: "m-carrefour", productId: "p-rice", priceCents: 135000 },
  { merchantId: "m-carrefour", productId: "p-sugar", priceCents: 17000 },
  { merchantId: "m-carrefour", productId: "p-soap", priceCents: 20500 },
  { merchantId: "m-carrefour", productId: "p-oil", priceCents: 144000 },
];

export const cashbackByMerchant: Record<string, number> = {
  "m-naivas": 2000,
  "m-quickmart": 3000,
  "m-carrefour": 4500,
};

export const defaultList: ListItem[] = products.map((p) => ({
  productId: p.id,
  freeText: p.name,
  quantity: 1,
}));

export function compareBasket(items: ListItem[]): BasketResult[] {
  const grocery = merchants.filter((m) => m.category === "grocery");
  const results = grocery.map((merchant) => {
    let total = 0;
    let matched = 0;
    for (const item of items) {
      const price = prices.find(
        (p) => p.merchantId === merchant.id && p.productId === item.productId,
      );
      if (price) {
        total += price.priceCents * item.quantity;
        matched += 1;
      }
    }
    const cashback = cashbackByMerchant[merchant.id] ?? 0;
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

  const bestNet = Math.min(...results.map((r) => r.netCents));
  return results
    .map((r) => ({ ...r, isRecommended: r.netCents === bestNet }))
    .sort((a, b) => a.netCents - b.netCents);
}

export type RideQuote = {
  partner: string;
  priceCents: number;
  etaMin: number;
  cashbackCents: number;
  deepLink: string;
};

export function compareRides(destination: string): RideQuote[] {
  void destination;
  const quotes: RideQuote[] = [
    { partner: "Bolt", priceCents: 74000, etaMin: 4, cashbackCents: 2000, deepLink: "https://bolt.eu" },
    { partner: "Little", priceCents: 81000, etaMin: 6, cashbackCents: 1500, deepLink: "https://little.africa" },
    { partner: "Uber", priceCents: 89000, etaMin: 5, cashbackCents: 1000, deepLink: "https://uber.com" },
  ];
  return quotes.sort((a, b) => a.priceCents - a.cashbackCents - (b.priceCents - b.cashbackCents));
}

export type FuelStation = {
  name: string;
  brand: string;
  priceCentsPerLitre: number;
  cashbackCents: number;
  distanceKm: number;
};

export function nearbyFuel(): FuelStation[] {
  return [
    { name: "Total Kilimani", brand: "TotalEnergies", priceCentsPerLitre: 17900, cashbackCents: 1500, distanceKm: 1.2 },
    { name: "Rubis Westlands", brand: "Rubis", priceCentsPerLitre: 18000, cashbackCents: 1000, distanceKm: 0.8 },
    { name: "Shell Junction", brand: "Shell", priceCentsPerLitre: 18300, cashbackCents: 1200, distanceKm: 2.1 },
  ].sort((a, b) => a.priceCentsPerLitre - b.priceCentsPerLitre);
}
