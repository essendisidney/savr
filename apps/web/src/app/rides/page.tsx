"use client";

import { useMemo, useState } from "react";
import { compareRides, formatKes } from "@/lib/compare";

export default function RidesPage() {
  const [destination, setDestination] = useState("Airport");
  const quotes = useMemo(() => compareRides(destination), [destination]);
  const best = quotes[0];
  const worst = quotes[quotes.length - 1];
  const saved = worst && best ? worst.priceCents - best.priceCents : 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-savr-clay">Transport</p>
        <h1 className="mt-2 font-display text-4xl">Ride compare</h1>
        <p className="mt-2 text-savr-ink/70">Demo quotes — live partner APIs plug in later.</p>
      </div>

      <label className="block max-w-md space-y-2">
        <span className="text-sm font-medium">Destination</span>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full border border-savr-ink/15 bg-white/70 px-3 py-2 outline-none focus:border-savr-forest"
        />
      </label>

      <div className="space-y-3">
        {quotes.map((q, i) => (
          <div
            key={q.partner}
            className={`flex flex-wrap items-center justify-between gap-3 border px-4 py-4 ${
              i === 0 ? "border-savr-leaf bg-savr-mint/50" : "border-savr-ink/10 bg-white/40"
            }`}
          >
            <div>
              <p className="font-display text-2xl">{q.partner}</p>
              <p className="text-sm text-savr-ink/60">
                ETA {q.etaMin} min · Cashback {formatKes(q.cashbackCents)}
                {i === 0 ? " · Recommended" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatKes(q.priceCents)}</p>
              <a
                href={q.deepLink}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-savr-forest underline-offset-2 hover:underline"
              >
                Open app
              </a>
            </div>
          </div>
        ))}
      </div>

      {best && (
        <p className="text-sm text-savr-ink/80">
          Recommendation: <strong>{best.partner}</strong> — save {formatKes(saved)}, earn{" "}
          {formatKes(best.cashbackCents)} cashback.
        </p>
      )}
    </div>
  );
}
