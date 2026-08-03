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
  /** Branch this catalog row represents (one merchant row per active location). */
  locationId?: string | null;
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
  locationId?: string | null;
  productId: string;
  priceCents: number;
  observedAt?: string | null;
  source?: string | null;
  prevPriceCents?: number | null;
  prevObservedAt?: string | null;
  /** Shopper tip submissions for this shelf price. */
  tipCount?: number | null;
};

export type CashbackRule = {
  merchantId: string;
  flatCents: number;
  minBasketCents: number;
};

export type Promotion = {
  id: string;
  merchantId: string;
  title: string;
  discountPercent: number | null;
  flatCents: number | null;
  productId: string | null;
  category: string | null;
  endsAt: string | null;
};

export type Catalog = {
  merchants: Merchant[];
  products: Product[];
  prices: MerchantPrice[];
  cashbackRules: CashbackRule[];
  promotions: Promotion[];
  source: "supabase" | "fallback";
};

export type ListItem = {
  productId: string;
  freeText: string;
  quantity: number;
};

export type BasketResult = {
  merchantId: string;
  locationId: string | null;
  merchantName: string;
  branchName: string | null;
  /** Physical aisle vs marketplace / delivery catalog. */
  channel: "store" | "online";
  totalCents: number;
  cashbackCents: number;
  promoCents: number;
  promoLabel: string | null;
  coverage: number;
  netCents: number;
  isRecommended: boolean;
  mapsUrl: string;
  distanceKm: number | null;
  /** Sum of (current − prev) × qty when enough lines have history; null otherwise. */
  weekDeltaCents?: number | null;
  confidenceScore?: number | null;
  confidenceLevel?: "high" | "medium" | "low" | null;
  confidenceLabel?: string | null;
};

export type MissedSavingsResult = {
  paidMerchantId: string;
  paidMerchantName: string;
  paidTotalCents: number;
  paidCashbackCents: number;
  paidNetCents: number;
  paidCoverage: number;
  bestMerchantId: string;
  bestMerchantName: string;
  bestTotalCents: number;
  bestCashbackCents: number;
  bestNetCents: number;
  missedCents: number;
  alreadyOptimal: boolean;
};

export type LineItemPrice = {
  productId: string;
  name: string;
  quantity: number;
  unitCents: number | null;
  lineCents: number | null;
  promoCents?: number;
  observedAt?: string | null;
  source?: string | null;
  prevPriceCents?: number | null;
  prevObservedAt?: string | null;
  tipCount?: number | null;
  confidenceScore?: number | null;
  confidenceLevel?: "high" | "medium" | "low" | null;
  confidenceLabel?: string | null;
};

export type RideQuote = {
  partner: string;
  priceCents: number;
  etaMin: number;
  cashbackCents: number;
  deepLink: string;
  netCents: number;
  isEstimated: boolean;
};

export type FuelType = "petrol" | "diesel";

export type FuelStation = {
  id: string;
  name: string;
  brand: string;
  fuelType: FuelType;
  priceCentsPerLitre: number;
  cashbackCents: number;
  distanceKm: number | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  observedAt?: string | null;
  source?: string | null;
};

export type ProductPriceResult = {
  merchantId: string;
  locationId: string | null;
  merchantName: string;
  branchName: string | null;
  address: string | null;
  channel: "store" | "online";
  /** Effective price after promo (used for ranking). */
  priceCents: number;
  /** Shelf / list price before promo. */
  listCents: number;
  promoCents: number;
  promoLabel: string | null;
  deltaCents: number;
  isCheapest: boolean;
  mapsUrl: string;
  distanceKm: number | null;
  observedAt?: string | null;
  source?: string | null;
  prevPriceCents?: number | null;
  prevObservedAt?: string | null;
  tipCount?: number | null;
  confidenceScore?: number | null;
  confidenceLevel?: "high" | "medium" | "low" | null;
  confidenceLabel?: string | null;
};
