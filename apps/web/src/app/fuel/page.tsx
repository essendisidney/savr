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
  const maxPrice = Math.max(...stations.map((s) => s.priceCentsPerLitre), 1);

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-40 bg-savr-fog" />
          <div className="h-12 w-64 bg-savr-fog" />
          <div className="h-28 w-full bg-savr-fog" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-8">
        <header className="animate-rise">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-savr-forest">
            Fuel · Nearby
          </p>
          <h1 className="mt-2 font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-tightish md:text-5xl">
            Fill up smarter
          </h1>
          <p className="mt-3 text-[15px] text-savr-mute">Petrol prices · {source}</p>
        </header>

        {best && (
          <div className="animate-rise-delay surface border border-savr-leaf/40 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
              Go to {best.brand}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-tightish tabular-nums">
              Save {formatKes(savedPerLitre)}/L
            </p>
          </div>
        )}

        <ol className="animate-rise-delay-2 space-y-3">
          {stations.map((s, i) => (
            <li
              key={s.name}
              className={`surface border px-4 py-4 ${
                i === 0 ? "border-savr-leaf ring-1 ring-savr-leaf/30" : "border-savr-ink/[0.07]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 items-center justify-center font-display text-sm font-bold ${
                      i === 0 ? "bg-savr-forest text-white" : "bg-savr-fog text-savr-mute"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold tracking-tightish">{s.brand}</p>
                    <p className="text-sm text-savr-mute">
                      {s.name}
                      {s.distanceKm != null ? ` · ${s.distanceKm} km` : ""}
                    </p>
                  </div>
                </div>
                <p className="font-display text-xl font-bold tabular-nums">
                  {formatKes(s.priceCentsPerLitre)}
                  <span className="text-sm font-semibold text-savr-mute">/L</span>
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden bg-savr-fog">
                <div
                  className={`rank-bar h-full animate-barGrow ${i === 0 ? "bg-savr-forest" : "bg-savr-ink/20"}`}
                  style={{
                    width: `${(s.priceCentsPerLitre / maxPrice) * 100}%`,
                    animationDelay: `${0.1 + i * 0.08}s`,
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </PageShell>
  );
}
