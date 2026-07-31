"use client";

import { formatKes, nearbyFuel } from "@/lib/compare";

export default function FuelPage() {
  const stations = nearbyFuel();
  const best = stations[0];
  const worst = stations[stations.length - 1];
  const savedPerLitre =
    worst && best ? worst.priceCentsPerLitre - best.priceCentsPerLitre : 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-savr-clay">Fuel · Nearby</p>
        <h1 className="mt-2 font-display text-4xl">Fill smart</h1>
        <p className="mt-2 text-savr-ink/70">Petrol prices per litre around you (seed data).</p>
      </div>

      <div className="space-y-3">
        {stations.map((s, i) => (
          <div
            key={s.name}
            className={`border px-4 py-4 ${
              i === 0 ? "border-savr-leaf bg-savr-mint/50" : "border-savr-ink/10 bg-white/40"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl">{s.brand}</p>
                <p className="text-sm text-savr-ink/60">
                  {s.name} · {s.distanceKm} km
                  {i === 0 ? " · Recommended" : ""}
                </p>
              </div>
              <p className="font-semibold">{formatKes(s.priceCentsPerLitre)}/L</p>
            </div>
            <p className="mt-2 text-sm text-savr-ink/70">
              Cashback {formatKes(s.cashbackCents)} on fill-up (partner rule demo)
            </p>
          </div>
        ))}
      </div>

      {best && (
        <p className="text-sm">
          Recommendation: <strong>{best.brand}</strong> — save {formatKes(savedPerLitre)}/L vs
          highest nearby.
        </p>
      )}
    </div>
  );
}
