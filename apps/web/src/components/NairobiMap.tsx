"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type ValueTier = "good" | "mid" | "poor" | "neutral";

export type MapPoint = {
  id: string;
  kind: "grocery" | "fuel";
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  mapsUrl: string | null;
  valueTier?: ValueTier;
  /** Short pin label e.g. "Save KES 420" */
  valueLabel?: string | null;
  /** For sorting / detail */
  metricCents?: number | null;
};

type Props = {
  points: MapPoint[];
  onSelect: (p: MapPoint) => void;
};

const TIER_COLOR: Record<ValueTier, string> = {
  good: "#00C853",
  mid: "#F5C518",
  poor: "#EF4444",
  neutral: "#64748B",
};

function pinIconHtml(tier: ValueTier, kind: "grocery" | "fuel"): string {
  const color = TIER_COLOR[tier];
  const ring = kind === "fuel" ? "2px dashed #fff" : "2px solid #fff";
  return `<span style="display:block;width:14px;height:14px;border-radius:999px;background:${color};border:${ring};box-shadow:0 2px 8px rgba(11,18,32,.35)"></span>`;
}

export function NairobiMap({ points, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [-1.2864, 36.8172],
        zoom: 12,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    }

    void init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !points.length) return;

    let cancelled = false;
    const markers: import("leaflet").Marker[] = [];

    void (async () => {
      const L = await import("leaflet");
      if (cancelled) return;

      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      const bounds = L.latLngBounds([]);
      for (const p of points) {
        const tier = p.valueTier ?? "neutral";
        const icon = L.divIcon({
          className: "",
          html: pinIconHtml(tier, p.kind),
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const tip = p.valueLabel ? `${p.name} · ${p.valueLabel}` : p.name;
        const m = L.marker([p.lat, p.lng], { icon }).addTo(map).bindTooltip(tip);
        m.on("click", () => onSelect(p));
        markers.push(m);
        bounds.extend([p.lat, p.lng]);
      }
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.12));
    })();

    return () => {
      cancelled = true;
      for (const m of markers) m.remove();
    };
  }, [points, onSelect]);

  return (
    <div
      ref={containerRef}
      className="z-0 h-[min(72vh,560px)] w-full rounded-card border border-savr-ink/[0.06] bg-savr-fog shadow-[0_18px_50px_-36px_rgba(11,18,32,0.35)]"
    />
  );
}
