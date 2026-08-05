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

async function liveDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ km: number; minutes: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: { distance?: number; duration?: number }[];
    };
    const route = data.routes?.[0];
    if (!route?.distance || !route.duration) return null;
    return {
      km: Math.max(1.2, route.distance / 1000),
      minutes: Math.max(4, Math.round(route.duration / 60)),
    };
  } catch {
    return null;
  }
}

/**
 * Nairobi ride board: live road distance (OSRM) + one transparent fare band.
 * Partner apps still own the live quote — we deep-link, we don't invent Bolt vs Uber spreads.
 */
export async function buildRideQuotes(
  pickup: string,
  destination: string,
  now = new Date(),
): Promise<RideQuoteResult> {
  const from = resolveRidePlace(pickup);
  const to = resolveRidePlace(destination);
  let km = 8;
  let minutes = 18;
  let liveRoad = false;
  if (from && to) {
    const live = await liveDrivingRoute(from, to);
    if (live) {
      km = live.km;
      minutes = live.minutes;
      liveRoad = true;
    } else {
      km = Math.max(1.5, haversineKm(from, to));
      minutes = Math.max(6, Math.round(km * 2.4));
    }
  } else {
    const seed = routeSeed(pickup, destination);
    km = 4 + (seed % 18);
    minutes = Math.max(6, Math.round(km * 2.4));
  }

  const surge = surgeMultiplier(now);
  const fareCents = Math.round((280 + km * 52 + minutes * 6) * surge * 100);
  const destQ = encodeURIComponent(destination.trim() || "Nairobi");
  const pickQ = encodeURIComponent(pickup.trim() || "Westlands");

  const partners: Omit<RideQuote, "netCents" | "isEstimated">[] = [
    {
      partner: "Bolt",
      priceCents: fareCents,
      etaMin: minutes,
      cashbackCents: 0,
      deepLink: `https://bolt.eu/en-ke/?pickup=${pickQ}&destination=${destQ}`,
    },
    {
      partner: "Little",
      priceCents: fareCents,
      etaMin: minutes,
      cashbackCents: 0,
      deepLink: `https://little.africa/?from=${pickQ}&to=${destQ}`,
    },
    {
      partner: "Uber",
      priceCents: fareCents,
      etaMin: minutes,
      cashbackCents: 0,
      deepLink: `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${destQ}`,
    },
  ];

  const quotes = partners
    .map((p) => ({
      ...p,
      netCents: p.priceCents,
      isEstimated: true as const,
    }))
    .sort((a, b) => a.priceCents - b.priceCents);

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
    label: liveRoad
      ? `Live road ${Math.round(km * 10) / 10} km · ~${minutes} min · open an app for the live fare`
      : `Approx ${Math.round(km * 10) / 10} km · open an app for the live fare`,
  };
}

export async function compareRidesForRoute(pickup: string, destination: string): Promise<RideQuote[]> {
  return (await buildRideQuotes(pickup, destination)).quotes;
}
