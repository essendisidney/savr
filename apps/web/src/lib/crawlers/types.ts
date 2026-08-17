export type MarketCountry = "ke" | "ng" | "ug" | "tz" | "gh";

export type MarketCurrency = "KES" | "NGN" | "UGX" | "TZS" | "GHS";

export type SourceStatus = "ok" | "blocked" | "empty";

export type MarketListing = {
  id: string;
  shop: string;
  shopId: string;
  country: MarketCountry;
  name: string;
  brand: string | null;
  priceCents: number;
  currency: MarketCurrency;
  url: string;
};

export type CrawlerResult = {
  shopId: string;
  shop: string;
  status: SourceStatus;
  listings: MarketListing[];
  error?: string;
};

export const MARKET_COUNTRIES: { id: MarketCountry; label: string; currency: MarketCurrency }[] = [
  { id: "ke", label: "Kenya", currency: "KES" },
  { id: "ng", label: "Nigeria", currency: "NGN" },
  { id: "ug", label: "Uganda", currency: "UGX" },
  { id: "tz", label: "Tanzania", currency: "TZS" },
  { id: "gh", label: "Ghana", currency: "GHS" },
];

export function isMarketCountry(raw: string | null | undefined): raw is MarketCountry {
  return MARKET_COUNTRIES.some((c) => c.id === raw);
}

export function formatMarketMoney(cents: number, currency: MarketCurrency): string {
  const n = Math.round(cents / 100);
  return `${currency} ${n.toLocaleString("en-KE")}`;
}

export type MarketSourceNote = {
  shopId: string;
  shop: string;
  status: SourceStatus;
  error?: string;
};

export type MarketSearchResult = {
  queried: string;
  country: MarketCountry;
  listings: MarketListing[];
  sources: MarketSourceNote[];
};

export const SAVR_BOT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SavrPriceBot/0.2 (+https://savr-teal.vercel.app; live price compare)";
