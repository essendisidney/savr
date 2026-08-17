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
  observedAt: string;
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

/** Honest crawl clock in Nairobi — never invent freshness. */
export function formatObservedKenya(iso: string | null | undefined): string {
  if (!iso) return "time unknown";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "time unknown";
  return d.toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative age of a crawl — “6 min ago”, never “verified”. */
export function formatObservedAge(iso: string | null | undefined): string {
  if (!iso) return "time unknown";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "time unknown";
  const age = Date.now() - then;
  if (age < 45_000) return "just now";
  if (age < 3_600_000) return `${Math.max(1, Math.round(age / 60_000))} min ago`;
  if (age < 86_400_000) return `${Math.max(1, Math.round(age / 3_600_000))}h ago`;
  return `${Math.max(1, Math.round(age / 86_400_000))}d ago`;
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
  /** Spread inside this result set only — not a guaranteed checkout save. */
  spread: {
    saveCents: number;
    cheapestShop: string;
    priciestShop: string;
  } | null;
  board: "live" | "stored" | "mixed";
};

export const SAVR_BOT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SavrPriceBot/0.2 (+https://savr-teal.vercel.app; live price compare)";
