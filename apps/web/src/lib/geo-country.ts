import type { MarketCountry } from "./crawlers/types";

/** Kenya-first launch. Other markets stay off the board. */
export function countryFromVercelHeader(_raw?: string | null): MarketCountry {
  return "ke";
}
