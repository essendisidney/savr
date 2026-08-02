import type { RideQuote } from "./types";

export type RidePlace = { lat: number; lng: number; baseFare: number };

const NAIROBI_PLACES: Record<string, RidePlace> = {
  westlands: { lat: -1.2674, lng: 36.811, baseFare: 350 },
  cbd: { lat: -1.2864, lng: 36.8172, baseFare: 320 },
  airport: { lat: -1.3192, lng: 36.9275, baseFare: 900 },
  jkia: { lat: -1.3192, lng: 36.9275, baseFare: 900 },
  karen: { lat: -1.3195, lng: 36.715, baseFare: 700 },
  kilimani: { lat: -1.2921, lng: 36.787, baseFare: 400 },
  lavington: { lat: -1.277, lng: 36.768, baseFare: 450 },
  eastleigh: { lat: -1.274, lng: 36.848, baseFare: 500 },
  thika: { lat: -1.038, lng: 37.083, baseFare: 1200 },
};

function placeKey(label: string): string {
  return label.trim().toLowerCase();
}

export function resolveRidePlace(label: string): RidePlace | null {
  const key = placeKey(label);
  if (NAIROBI_PLACES[key]) return NAIROBI_PLACES[key];
  const hit = Object.entries(NAIROBI_PLACES).find(([k]) => key.includes(k) || k.includes(key));
  return hit ? hit[1] : null;
}

function routeSeed(pickup: string, destination: string): number {
  const s = `${placeKey(pickup)}→${placeKey(destination)}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Time-of-day surge heuristic for Nairobi (peak commute / weekend evening). */
export function surgeMultiplier(now = new Date()): number {
  const hour = now.getHours();
  const day = now.getDay(); // 0 Sun
  let surge = 1;
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20)) surge += 0.18;
  if (day === 5 && hour >= 16) surge += 0.08;
  if (day === 0 || day === 6) {
    if (hour >= 12 && hour <= 15) surge += 0.05;
    if (hour >= 18 && hour <= 22) surge += 0.1;
  }
  if (hour >= 22 || hour < 5) surge += 0.12;
  return Math.round(surge * 100) / 100;
}

export type RideQuoteResult = {
  quotes: RideQuote[];
  km: number;
  surge: number;
  pickup: string;
  destination: string;
  pickupLat: number | null;
  pickupLng: number | null;
  destLat: number | null;
  destLng: number | null;
  label: string;
};

/**
 * Nairobi ride quotes from distance + time-of-day surge.
 * Deep-link to partner apps for booking.
 */
export function buildRideQuotes(pickup: string, destination: string, now = new Date()): RideQuoteResult {
  const from = resolveRidePlace(pickup);
  const to = resolveRidePlace(destination);
  let km = 8;
  if (from && to) {
    km = Math.max(1.5, haversineKm(from, to));
  } else {
    const seed = routeSeed(pickup, destination);
    km = 4 + (seed % 18);
  }

  const surge = surgeMultiplier(now);
  const perKm = 55;
  const base = Math.round((320 + km * perKm) * 100 * surge);
  const seed = routeSeed(pickup, destination || "nairobi");
  const destQ = encodeURIComponent(destination.trim() || "Nairobi");
  const pickQ = encodeURIComponent(pickup.trim() || "Westlands");

  const partners: Omit<RideQuote, "netCents" | "isEstimated">[] = [
    {
      partner: "Bolt",
      priceCents: Math.round(base * (0.92 + (seed % 5) * 0.01)),
      etaMin: Math.max(3, Math.round(4 + km * 0.35 * Math.min(surge, 1.25))),
      cashbackCents: 2000,
      deepLink: `https://bolt.eu/en-ke/?pickup=${pickQ}&destination=${destQ}`,
    },
    {
      partner: "Little",
      priceCents: Math.round(base * (0.98 + (seed % 7) * 0.012)),
      etaMin: Math.max(4, Math.round(5 + km * 0.4 * Math.min(surge, 1.25))),
      cashbackCents: 1500,
      deepLink: `https://little.africa/?from=${pickQ}&to=${destQ}`,
    },
    {
      partner: "Uber",
      priceCents: Math.round(base * (1.05 + (seed % 4) * 0.015)),
      etaMin: Math.max(3, Math.round(4 + km * 0.38 * Math.min(surge, 1.25))),
      cashbackCents: 1000,
      deepLink: `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${destQ}`,
    },
  ];

  const quotes = partners
    .map((p) => ({
      ...p,
      netCents: p.priceCents - p.cashbackCents,
      isEstimated: true as const,
    }))
    .sort((a, b) => a.netCents - b.netCents);

  return {
    quotes,
    km: Math.round(km * 10) / 10,
    surge,
    pickup: pickup.trim() || "Westlands",
    destination: destination.trim() || "Nairobi",
    pickupLat: from?.lat ?? null,
    pickupLng: from?.lng ?? null,
    destLat: to?.lat ?? null,
    destLng: to?.lng ?? null,
    label: "",
  };
}

export function compareRidesForRoute(pickup: string, destination: string): RideQuote[] {
  return buildRideQuotes(pickup, destination).quotes;
}
