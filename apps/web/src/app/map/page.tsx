"use client";

import { useEffect, useState } from "react";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { loadCatalog, loadFuelStations } from "@/lib/catalog";
import { formatKes } from "@/lib/compare";
import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/NairobiMap";

const NairobiMap = dynamic(() => import("@/components/NairobiMap").then((m) => m.NairobiMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(70vh,520px)] items-center justify-center border border-savr-ink/[0.08] bg-savr-fog text-sm text-savr-mute">
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [selected, setSelected] = useState<MapPoint | null>(null);

  useEffect(() => {
    void (async () => {
      const [catalog, fuel] = await Promise.all([loadCatalog(), loadFuelStations("petrol")]);
      const grocery: MapPoint[] = catalog.merchants
        .filter((m) => m.location?.lat != null && m.location?.lng != null)
        .map((m) => ({
          id: `m-${m.id}`,
          kind: "grocery" as const,
          name: m.name,
          subtitle: m.location?.name ?? m.location?.address ?? "Grocery",
          lat: m.location!.lat!,
          lng: m.location!.lng!,
          mapsUrl:
            m.location!.lat != null && m.location!.lng != null
              ? `https://www.google.com/maps/dir/?api=1&destination=${m.location!.lat},${m.location!.lng}`
              : null,
        }));
      const stations: MapPoint[] = fuel.stations
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => ({
          id: `f-${s.id}`,
          kind: "fuel" as const,
          name: s.name,
          subtitle: `${s.brand} · petrol ${formatKes(s.priceCentsPerLitre)}/L`,
          lat: s.lat!,
          lng: s.lng!,
          mapsUrl: s.mapsUrl,
        }));
      setPoints([...grocery, ...stations]);
    })();
  }, []);

  return (
    <PageFrame>
      <PageHero
        theme="fuel"
        title="Nairobi on the map"
        subtitle="Groceries and fuel stations — tap a pin, then open directions."
      />
      <div className="page-band">
        <PageShell>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-savr-mute">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-savr-forest" /> Grocery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> Fuel
              </span>
              <span>{points.length} places</span>
            </div>
            <NairobiMap points={points} onSelect={setSelected} />
            {selected && (
              <div className="border border-savr-ink/[0.08] bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                  {selected.kind === "fuel" ? "Fuel" : "Grocery"}
                </p>
                <p className="mt-1 font-display text-xl font-bold">{selected.name}</p>
                <p className="text-sm text-savr-mute">{selected.subtitle}</p>
                {selected.mapsUrl && (
                  <a
                    href={selected.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-savr-forest hover:underline"
                  >
                    Directions →
                  </a>
                )}
              </div>
            )}
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
