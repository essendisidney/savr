import { formatKes } from "./types";

const STALE_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export function formatPriceFreshness(
  observedAt: string | null | undefined,
  _source?: string | null,
): { label: string; stale: boolean } {
  if (!observedAt) {
    return { label: "", stale: false };
  }
  const then = new Date(observedAt).getTime();
  if (!Number.isFinite(then)) {
    return { label: "", stale: false };
  }
  const age = Date.now() - then;
  const stale = age > STALE_MS;
  let when: string;
  if (age < 60_000) when = "just now";
  else if (age < 3_600_000) when = `${Math.max(1, Math.round(age / 60_000))}m ago`;
  else if (age < 86_400_000) when = `${Math.max(1, Math.round(age / 3_600_000))}h ago`;
  else when = `${Math.max(1, Math.round(age / 86_400_000))}d ago`;

  return {
    label: stale ? `Updated ${when} · may be stale` : `Updated ${when}`,
    stale,
  };
}

export function freshnessClassName(stale: boolean, tone: "dark" | "light" = "light"): string {
  if (stale) return tone === "dark" ? "text-amber-300" : "text-amber-700";
  return tone === "dark" ? "text-white/55" : "text-savr-mute";
}

export type PriceTrend = {
  label: string;
  direction: "down" | "up" | "flat" | null;
};

/** Compare current shelf price to the stored previous observation. */
export function formatPriceTrend(
  currentCents: number,
  prevCents: number | null | undefined,
  prevObservedAt: string | null | undefined,
): PriceTrend {
  if (prevCents == null || !Number.isFinite(prevCents) || prevCents <= 0) {
    return { label: "", direction: null };
  }
  const delta = currentCents - prevCents;
  const abs = Math.abs(delta);

  let vs = "vs prior";
  if (prevObservedAt) {
    const then = new Date(prevObservedAt).getTime();
    if (Number.isFinite(then)) {
      const days = Math.max(1, Math.round((Date.now() - then) / DAY_MS));
      if (days >= 5 && days <= 16) vs = "vs last week";
      else if (days < 5) vs = `vs ${days}d ago`;
      else vs = `vs ${days}d ago`;
    }
  }

  if (abs < 100) {
    return { label: `Flat ${vs}`, direction: "flat" };
  }
  if (delta < 0) {
    return { label: `↓ ${formatKes(abs)} ${vs}`, direction: "down" };
  }
  return { label: `↑ ${formatKes(abs)} ${vs}`, direction: "up" };
}

export function trendClassName(
  direction: PriceTrend["direction"],
  tone: "dark" | "light" = "light",
): string {
  if (direction === "down") {
    return tone === "dark" ? "text-emerald-300" : "text-savr-forest";
  }
  if (direction === "up") {
    return tone === "dark" ? "text-amber-300" : "text-amber-800";
  }
  return tone === "dark" ? "text-white/55" : "text-savr-mute";
}

/** Basket rollup: net change vs prior prices when enough lines have history. */
export function formatBasketTrend(
  weekDeltaCents: number | null | undefined,
): PriceTrend {
  if (weekDeltaCents == null || !Number.isFinite(weekDeltaCents)) {
    return { label: "", direction: null };
  }
  const abs = Math.abs(weekDeltaCents);
  if (abs < 100) {
    return { label: "Basket flat vs last week", direction: "flat" };
  }
  if (weekDeltaCents < 0) {
    return {
      label: `Basket ↓ ${formatKes(abs)} vs last week`,
      direction: "down",
    };
  }
  return {
    label: `Basket ↑ ${formatKes(abs)} vs last week`,
    direction: "up",
  };
}
