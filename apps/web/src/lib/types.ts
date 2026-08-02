export type MoneyCents = number;

export function formatKes(cents: MoneyCents): string {
  return `KES ${Math.round(cents / 100).toLocaleString("en-KE")}`;
}

export type MerchantLocation = {
  id: string;
  merchantId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  city: string;
};

export type Merchant = {
  id: string;
  name: string;
  slug: string;
  category: string;
  location?: MerchantLocation | null;
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
  branchName: string | null;
  totalCents: number;
  cashbackCents: number;
  coverage: number;
  netCents: number;
  isRecommended: boolean;
  mapsUrl: string;
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

export type ProductPriceResult = {
  merchantId: string;
  merchantName: string;
  branchName: string | null;
  address: string | null;
  priceCents: number;
  deltaCents: number;
  isCheapest: boolean;
  mapsUrl: string;
};
