"use client";

import { useCallback, useEffect, useState } from "react";

export type GeoPoint = { lat: number; lng: number };

export type OriginSource = "default" | "device" | "estate";

export type NairobiEstate = {
  label: string;
  lat: number;
  lng: number;
};

/** Default origin: Westlands, Nairobi — used until the shopper picks an estate or GPS. */
export const NAIROBI_DEFAULT_ORIGIN: GeoPoint = {
  lat: -1.2674,
  lng: 36.811,
};

/** Quick-picks for shopper distance (aligned with rides places). */
export const NAIROBI_ESTATES: NairobiEstate[] = [
  { label: "Westlands", lat: -1.2674, lng: 36.811 },
  { label: "CBD", lat: -1.2864, lng: 36.8172 },
  { label: "Kilimani", lat: -1.2921, lng: 36.787 },
  { label: "Karen", lat: -1.3195, lng: 36.715 },
  { label: "Lavington", lat: -1.277, lng: 36.768 },
  { label: "Eastleigh", lat: -1.274, lng: 36.848 },
];

const STORAGE_KEY = "savr_shopper_origin_v1";

type StoredOrigin = {
  lat: number;
  lng: number;
  source: OriginSource;
  label: string;
};

function loadStoredOrigin(): StoredOrigin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOrigin;
    if (
      !parsed ||
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      Number.isNaN(parsed.lat) ||
      Number.isNaN(parsed.lng)
    ) {
      return null;
    }
    const source: OriginSource =
      parsed.source === "device" || parsed.source === "estate" ? parsed.source : "default";
    const label =
      typeof parsed.label === "string" && parsed.label.trim()
        ? parsed.label.trim().slice(0, 40)
        : source === "device"
          ? "Your location"
          : "Westlands";
    return { lat: parsed.lat, lng: parsed.lng, source, label };
  } catch {
    return null;
  }
}

function saveStoredOrigin(next: StoredOrigin): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistanceKm(km: number | null | undefined): string | null {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 0.1) return "<0.1 km";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function originHint(source: OriginSource, label: string): string {
  if (source === "device") return "Distances from your location";
  return `Distances from ${label}`;
}

export function useShopperOrigin() {
  const [origin, setOrigin] = useState<GeoPoint>(NAIROBI_DEFAULT_ORIGIN);
  const [source, setSource] = useState<OriginSource>("default");
  const [label, setLabel] = useState("Westlands");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadStoredOrigin();
    if (!stored) return;
    setOrigin({ lat: stored.lat, lng: stored.lng });
    setSource(stored.source);
    setLabel(stored.label);
  }, []);

  const persist = useCallback((next: StoredOrigin) => {
    setOrigin({ lat: next.lat, lng: next.lng });
    setSource(next.source);
    setLabel(next.label);
    saveStoredOrigin(next);
  }, []);

  const useMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location isn’t available on this device.");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        persist({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "device",
          label: "Your location",
        });
        setBusy(false);
      },
      () => {
        setError(`Couldn’t get location — still using ${label}.`);
        setBusy(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 },
    );
  }, [label, persist]);

  const setEstate = useCallback(
    (estate: NairobiEstate) => {
      setError(null);
      persist({
        lat: estate.lat,
        lng: estate.lng,
        source: "estate",
        label: estate.label,
      });
    },
    [persist],
  );

  return {
    origin,
    source,
    label,
    busy,
    error,
    useMyLocation,
    setEstate,
  };
}
