export type MoneyCents = number;

export function formatKes(cents: MoneyCents): string {
  return `KES ${Math.round(cents / 100).toLocaleString("en-KE")}`;
}

export type Merchant = {
  id: string;
  name: string;
  slug: string;
  category: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  unit: string;
};

export type MerchantPrice = {
  merchantId: string;
  productId: string;
  priceCents: number;
};

export type CashbackRule = {
  merchantId: string;
  flatCents: number;
  minBasketCents: number;
};

export type Catalog = {
  merchants: Merchant[];
  products: Product[];
  prices: MerchantPrice[];
  cashbackRules: CashbackRule[];
  source: "supabase" | "fallback";
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

export type LineItemPrice = {
  productId: string;
  name: string;
  quantity: number;
  unitCents: number | null;
  lineCents: number | null;
};

export type RideQuote = {
  partner: string;
  priceCents: number;
  etaMin: number;
  cashbackCents: number;
  deepLink: string;
};

export type FuelStation = {
  name: string;
  brand: string;
  priceCentsPerLitre: number;
  cashbackCents: number;
  distanceKm: number | null;
};
