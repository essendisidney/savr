"use client";

import { useEffect, useState } from "react";
import { loadFuelStations } from "@/lib/catalog";
import { formatKes } from "@/lib/compare";
import type { FuelStation } from "@/lib/types";
import { PageShell } from "@/components/PageShell";

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

  if (loading) {
    return (
      <PageShell>
        <p className="animate-pulse text-savr-ink/50">Scanning nearby stations…</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-8">
        <div className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-savr-forest">
            Fuel · Nearby
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Fill up smarter
          </h1>
          <p className="mt-3 text-savr-ink/65">Live litre prices · {source}</p>
        </div>

        {best && (
          <div className="animate-countPop save-strip px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wide">Go to {best.brand}</p>
            <p className="font-display text-3xl font-extrabold">
              Save {formatKes(savedPerLitre)}/L
            </p>
          </div>
        )}

        <div className="animate-rise-delay space-y-3">
          {stations.map((s, i) => (
            <div
              key={s.name}
              className={`px-4 py-4 ${i === 0 ? "result-win" : "border border-savr-ink/10 bg-white/40"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-bold">{s.brand}</p>
                  <p className="text-sm text-savr-ink/55">
                    {s.name}
                    {s.distanceKm != null ? ` · ${s.distanceKm} km` : ""}
                    {i === 0 ? " · Cheapest nearby" : ""}
                  </p>
                </div>
                <p className="font-display text-xl font-bold">{formatKes(s.priceCentsPerLitre)}/L</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
