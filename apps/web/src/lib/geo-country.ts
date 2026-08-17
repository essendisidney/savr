import { isMarketCountry, type MarketCountry } from "./crawlers/types";

const HEADER_MAP: Record<string, MarketCountry> = {
  KE: "ke",
  NG: "ng",
  UG: "ug",
  TZ: "tz",
  GH: "gh",
};

/** Vercel `x-vercel-ip-country` → Jumia board we actually crawl. Unsupported (ZA, EG) stay Kenya. */
export function countryFromVercelHeader(raw: string | null | undefined): MarketCountry {
  const code = (raw ?? "").trim().toUpperCase();
  const mapped = HEADER_MAP[code];
  if (mapped) return mapped;
  const lower = code.toLowerCase();
  if (isMarketCountry(lower)) return lower;
  return "ke";
}
