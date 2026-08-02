"use client";

import { useEffect, useMemo, useState } from "react";
import { loadFuelStations } from "@/lib/catalog";
import { formatKes } from "@/lib/compare";
import { formatDistanceKm, haversineKm, useShopperOrigin } from "@/lib/geo";
import type { FuelStation } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";

type SortMode = "price" | "distance" | "value";

export default function FuelPage() {
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [source, setSource] = useState("…");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("value");
  const { origin, source: geoSource, busy: geoBusy, error: geoError, useMyLocation } =
    useShopperOrigin();

  useEffect(() => {
    loadFuelStations().then((r) => {
      setStations(r.stations);
      setSource(r.source);
      setLoading(false);
    });
  }, []);

  const ranked = useMemo(() => {
    const withDist = stations.map((s) => {
      let distanceKm = s.distanceKm;
      let mapsUrl = s.mapsUrl;
      if (s.lat != null && s.lng != null) {
        distanceKm = Math.round(haversineKm(origin, { lat: s.lat, lng: s.lng }) * 10) / 10;
        mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${s.lat},${s.lng}`;
      }
      return { ...s, distanceKm, mapsUrl };
    });

    return [...withDist].sort((a, b) => {
      if (sort === "distance") {
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      }
      if (sort === "value") {
        const va = a.priceCentsPerLitre - a.cashbackCents;
        const vb = b.priceCentsPerLitre - b.cashbackCents;
        if (va !== vb) return va - vb;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      }
      return a.priceCentsPerLitre - b.priceCentsPerLitre;
    });
  }, [stations, origin, sort]);

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const savedPerLitre =
    worst && best ? worst.priceCentsPerLitre - best.priceCentsPerLitre : 0;
  const maxPrice = Math.max(...ranked.map((s) => s.priceCentsPerLitre), 1);

  if (loading) {
    return (
      <PageFrame>
        <div className="h-52 animate-pulse bg-savr-night/80" />
        <PageShell>
          <div className="h-28 animate-pulse bg-savr-fog" />
        </PageShell>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="fuel"
        title="Fill up smarter"
        subtitle={`Nearby petrol prices · ${source}. Rank by price, distance, or total value.`}
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            {best && (
              <SavingsMoment
                amountLabel={`Go to ${best.brand}`}
                amountCents={savedPerLitre}
                detail={`Saved per litre vs the highest station · ${formatDistanceKm(best.distanceKm) ?? "nearby"}`}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["value", "Best value"],
                    ["price", "Cheapest /L"],
                    ["distance", "Nearest"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSort(id)}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                      sort === id
                        ? "bg-savr-night text-white"
                        : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoBusy}
                className="text-sm font-semibold text-savr-forest hover:underline disabled:opacity-60"
              >
                {geoBusy
                  ? "Locating…"
                  : geoSource === "device"
                    ? "Using your location"
                    : "Use my location"}
              </button>
            </div>
            <p className="text-xs text-savr-mute">
              {geoSource === "device"
                ? "Distances from your location"
                : "Distances from Westlands · share location for your trip"}
            </p>
            {geoError && <p className="text-xs font-medium text-red-700">{geoError}</p>}

            <ol className="space-y-4">
              {ranked.map((s, i) => {
                const dist = formatDistanceKm(s.distanceKm);
                return (
                  <li
                    key={s.name}
                    className={`animate-rise relative overflow-hidden border ${
                      i === 0
                        ? "border-transparent bg-savr-night text-white shadow-[0_18px_40px_-24px_rgba(4,36,25,0.65)]"
                        : "border-savr-ink/[0.08] bg-white"
                    }`}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    {i === 0 && <div className="absolute inset-y-0 left-0 w-1.5 bg-savr-signal" />}
                    <div className="px-4 py-5 sm:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <span
                            className={`mt-0.5 flex h-8 w-8 items-center justify-center font-display text-sm font-bold ${
                              i === 0 ? "bg-savr-signal text-savr-ink" : "bg-savr-fog text-savr-mute"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-display text-2xl font-bold tracking-tightish">
                              {s.brand}
                            </p>
                            <p className={`text-sm ${i === 0 ? "text-white/65" : "text-savr-mute"}`}>
                              {s.name}
                              {dist ? ` · ${dist}` : ""}
                            </p>
                            <p
                              className={`mt-0.5 text-xs font-semibold ${
                                i === 0 ? "text-savr-signal" : "text-savr-mute"
                              }`}
                            >
                              Cashback {formatKes(s.cashbackCents)} · Net{" "}
                              {formatKes(s.priceCentsPerLitre - s.cashbackCents)}/L
                            </p>
                          </div>
                        </div>
                        <p className="font-display text-2xl font-bold tabular-nums">
                          {formatKes(s.priceCentsPerLitre)}
                          <span
                            className={`text-sm font-semibold ${
                              i === 0 ? "text-white/60" : "text-savr-mute"
                            }`}
                          >
                            /L
                          </span>
                        </p>
                      </div>
                      <div
                        className={`mt-4 h-2 overflow-hidden ${i === 0 ? "bg-white/15" : "bg-savr-fog"}`}
                      >
                        <div
                          className={`rank-bar h-full animate-barGrow ${
                            i === 0 ? "bg-savr-signal" : "bg-savr-forest/70"
                          }`}
                          style={{
                            width: `${(s.priceCentsPerLitre / maxPrice) * 100}%`,
                            animationDelay: `${0.1 + i * 0.08}s`,
                          }}
                        />
                      </div>
                      {s.mapsUrl && (
                        <a
                          href={s.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-4 inline-block text-sm font-semibold ${
                            i === 0 ? "text-savr-signal" : "text-savr-forest"
                          }`}
                        >
                          Directions →
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
