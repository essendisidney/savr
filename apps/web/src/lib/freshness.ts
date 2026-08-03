import { formatKes } from "./types";

const STALE_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export function formatPriceFreshness(
  observedAt: string | null | undefined,
  source?: string | null,
): { label: string; stale: boolean } {
  const src = (source ?? "").toLowerCase().trim();
  // Seed / offline demo clocks are not shelf walks — never say “just now”.
  if (src === "seed" || src === "ops" || src === "catalog") {
    return { label: "Catalog seed · confirm on shelf", stale: true };
  }
  if (src === "scrape") {
    return { label: "Online scrape · confirm on shelf", stale: true };
  }
  if (src === "fallback") {
    return { label: "Demo price · not a live shelf", stale: true };
  }
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

export type ConfidenceLevel = "high" | "medium" | "low";

export type PriceConfidence = {
  level: ConfidenceLevel;
  /** 0–100 composite of source trust × freshness. */
  score: number;
  label: string;
  shortLabel: string;
};

function sourceTrust(source: string | null | undefined): {
  points: number;
  label: string;
} {
  const s = (source ?? "").toLowerCase().trim();
  if (s === "merchant" || s === "partner" || s === "verified") {
    return { points: 42, label: "merchant" };
  }
  if (s === "crowdsource" || s === "tip" || s === "user") {
    return { points: 30, label: "shopper tip" };
  }
  if (s === "seed" || s === "ops" || s === "catalog") {
    return { points: 18, label: "catalog seed" };
  }
  if (s === "scrape") {
    return { points: 16, label: "online scrape" };
  }
  if (!s) return { points: 12, label: "unknown source" };
  return { points: 16, label: s };
}

function freshnessPoints(observedAt: string | null | undefined): number {
  if (!observedAt) return 8;
  const then = new Date(observedAt).getTime();
  if (!Number.isFinite(then)) return 8;
  const age = Date.now() - then;
  if (age < DAY_MS) return 55;
  if (age < 3 * DAY_MS) return 42;
  if (age < 7 * DAY_MS) return 30;
  if (age < 14 * DAY_MS) return 16;
  return 6;
}

function tipCountBoost(tipCount: number | null | undefined): number {
  const n = Math.max(0, Math.round(Number(tipCount) || 0));
  if (n <= 0) return 0;
  if (n === 1) return 4;
  if (n === 2) return 8;
  if (n <= 4) return 12;
  return 16;
}

export function tipCountLabel(tipCount: number | null | undefined): string | null {
  const n = Math.max(0, Math.round(Number(tipCount) || 0));
  if (n <= 0) return null;
  return n === 1 ? "1 shopper" : `${n} shoppers`;
}

/** Honest confidence: freshness × source (+ tip agreement). Never claims certainty. */
export function priceConfidence(
  observedAt: string | null | undefined,
  source?: string | null,
  tipCount?: number | null,
): PriceConfidence {
  const src = sourceTrust(source);
  const fresh = freshnessPoints(observedAt);
  const tips = tipCountBoost(tipCount);
  const score = Math.max(0, Math.min(100, src.points + fresh + tips));
  // High only when source is merchant/tip — catalog seed never claims certainty.
  const level: ConfidenceLevel =
    score >= 70 && src.points >= 30 ? "high" : score >= 40 ? "medium" : "low";
  const shortLabel =
    level === "high" ? "High confidence" : level === "medium" ? "Medium confidence" : "Low confidence";
  const age = formatPriceFreshness(observedAt, source);
  const when = age.label.replace(/^Updated /, "") || "age unknown";
  const shoppers = tipCountLabel(tipCount);
  return {
    level,
    score,
    shortLabel,
    label: shoppers
      ? `${shortLabel} · ${shoppers} · ${when}`
      : `${shortLabel} · ${src.label} · ${when}`,
  };
}

export function confidenceClassName(
  level: ConfidenceLevel,
  tone: "dark" | "light" = "light",
): string {
  if (level === "high") {
    return tone === "dark" ? "text-emerald-300" : "text-savr-forest";
  }
  if (level === "medium") {
    return tone === "dark" ? "text-white/70" : "text-savr-mute";
  }
  return tone === "dark" ? "text-amber-300" : "text-amber-800";
}

/** Average line confidence for a basket rank; conservative when empty. */
export function aggregateConfidence(
  lines: { observedAt?: string | null; source?: string | null; tipCount?: number | null }[],
): PriceConfidence | null {
  if (!lines.length) return null;
  const parts = lines.map((l) => priceConfidence(l.observedAt, l.source, l.tipCount));
  const score = Math.round(parts.reduce((s, p) => s + p.score, 0) / parts.length);
  const anyHighEligible = parts.some((p) => p.level === "high");
  const level: ConfidenceLevel =
    score >= 70 && anyHighEligible ? "high" : score >= 40 ? "medium" : "low";
  const shortLabel =
    level === "high" ? "High confidence" : level === "medium" ? "Medium confidence" : "Low confidence";
  const sources = new Set(
    parts.map((p) => {
      const bits = p.label.split(" · ");
      return bits[1] ?? "";
    }),
  );
  const sourceNote =
    sources.size <= 1 ? Array.from(sources)[0] || "mixed sources" : "mixed sources";
  return {
    level,
    score,
    shortLabel,
    label: `${shortLabel} · ${sourceNote} · ${parts.length} priced items`,
  };
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
