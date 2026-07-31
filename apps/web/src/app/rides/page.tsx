"use client";

import { useMemo, useState } from "react";
import { compareRides, formatKes } from "@/lib/compare";
import { PageShell } from "@/components/PageShell";

export default function RidesPage() {
  const [destination, setDestination] = useState("Airport");
  const quotes = useMemo(() => compareRides(destination), [destination]);
  const best = quotes[0];
  const worst = quotes[quotes.length - 1];
  const saved = worst && best ? worst.priceCents - best.priceCents : 0;

  return (
    <PageShell>
      <div className="space-y-8">
        <div className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-savr-forest">Transport</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Who gets you there for less?
          </h1>
          <p className="mt-3 text-savr-ink/65">Demo quotes today — partner APIs next.</p>
        </div>

        <label className="animate-rise-delay block max-w-md space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-savr-ink/45">
            Destination
          </span>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border border-savr-ink/10 bg-white/70 px-4 py-3 outline-none transition focus:border-savr-forest"
          />
        </label>

        {best && (
          <div className="animate-countPop save-strip px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wide">Take {best.partner}</p>
            <p className="font-display text-3xl font-extrabold">Save {formatKes(saved)}</p>
            <p className="text-sm">plus {formatKes(best.cashbackCents)} cashback</p>
          </div>
        )}

        <div className="animate-rise-delay-2 space-y-3">
          {quotes.map((q, i) => (
            <div
              key={q.partner}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-4 ${
                i === 0 ? "result-win" : "border border-savr-ink/10 bg-white/40"
              }`}
            >
              <div>
                <p className="font-display text-2xl font-bold">{q.partner}</p>
                <p className="text-sm text-savr-ink/55">
                  ETA {q.etaMin} min · Cashback {formatKes(q.cashbackCents)}
                  {i === 0 ? " · Best value" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-bold">{formatKes(q.priceCents)}</p>
                <a
                  href={q.deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-savr-forest underline-offset-2 hover:underline"
                >
                  Open app →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
