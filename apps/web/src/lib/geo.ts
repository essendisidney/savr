"use client";

import { useCallback, useState } from "react";

export type GeoPoint = { lat: number; lng: number };

/** Default origin: Westlands, Nairobi — used until the shopper shares location. */
export const NAIROBI_DEFAULT_ORIGIN: GeoPoint = {
  lat: -1.2674,
  lng: 36.811,
};

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

export function useShopperOrigin() {
  const [origin, setOrigin] = useState<GeoPoint>(NAIROBI_DEFAULT_ORIGIN);
  const [source, setSource] = useState<"default" | "device">("default");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location isn’t available on this device.");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSource("device");
        setBusy(false);
      },
      () => {
        setError("Couldn’t get location — still using Westlands.");
        setBusy(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 },
    );
  }, []);

  return { origin, source, busy, error, useMyLocation };
}
