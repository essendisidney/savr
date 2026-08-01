"use client";

import { useEffect, useState } from "react";
import { loadFuelStations } from "@/lib/catalog";
import { formatKes } from "@/lib/compare";
import type { FuelStation } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";

export default function FuelPage() {
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [source, setSource] = useState("…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFuelStations().then((r) => {
      setStations(r.stations);
      setSource(r.source);
      setLoading(false);
    });
  }, []);

  const best = stations[0];
  const worst = stations[stations.length - 1];
  const savedPerLitre =
    worst && best ? worst.priceCentsPerLitre - best.priceCentsPerLitre : 0;
  const maxPrice = Math.max(...stations.map((s) => s.priceCentsPerLitre), 1);

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
        subtitle={`Nearby petrol prices · ${source}. Cheapest litre wins.`}
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            {best && (
              <SavingsMoment
                amountLabel={`Go to ${best.brand}`}
                amountCents={savedPerLitre}
                detail="Saved per litre vs the highest nearby station"
              />
            )}

            <ol className="space-y-4">
              {stations.map((s, i) => (
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
                          <p className="font-display text-2xl font-bold tracking-tightish">{s.brand}</p>
                          <p className={`text-sm ${i === 0 ? "text-white/65" : "text-savr-mute"}`}>
                            {s.name}
                            {s.distanceKm != null ? ` · ${s.distanceKm} km` : ""}
                          </p>
                        </div>
                      </div>
                      <p className="font-display text-2xl font-bold tabular-nums">
                        {formatKes(s.priceCentsPerLitre)}
                        <span className={`text-sm font-semibold ${i === 0 ? "text-white/60" : "text-savr-mute"}`}>
                          /L
                        </span>
                      </p>
                    </div>
                    <div className={`mt-4 h-2 overflow-hidden ${i === 0 ? "bg-white/15" : "bg-savr-fog"}`}>
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
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
