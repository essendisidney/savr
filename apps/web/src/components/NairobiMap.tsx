"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: string;
  kind: "grocery" | "fuel";
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  mapsUrl: string | null;
};

type Props = {
  points: MapPoint[];
  onSelect: (p: MapPoint) => void;
};

export function NairobiMap({ points, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");

      // Fix default marker icons under bundlers
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

      const groceryIcon = L.divIcon({
        className: "",
        html: `<span style="display:block;width:12px;height:12px;border-radius:999px;background:#145C45;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const fuelIcon = L.divIcon({
        className: "",
        html: `<span style="display:block;width:12px;height:12px;border-radius:999px;background:#b45309;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const bounds = L.latLngBounds([]);
      for (const p of points) {
        const m = L.marker([p.lat, p.lng], {
          icon: p.kind === "fuel" ? fuelIcon : groceryIcon,
        })
          .addTo(map)
          .bindTooltip(p.name);
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
      className="h-[min(70vh,520px)] w-full border border-savr-ink/[0.08] bg-savr-fog z-0"
    />
  );
}
