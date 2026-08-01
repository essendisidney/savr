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
  const maxPrice = Math.max(...quotes.map((q) => q.priceCents), 1);

  return (
    <PageShell>
      <div className="space-y-8">
        <header className="animate-rise">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-savr-forest">
            Transport
          </p>
          <h1 className="mt-2 font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-tightish md:text-5xl">
            Who gets you there for less?
          </h1>
          <p className="mt-3 text-[15px] text-savr-mute">Demo quotes — live partner APIs next.</p>
        </header>

        <label className="animate-rise-delay block max-w-md space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
            Destination
          </span>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="field"
          />
        </label>

        {best && (
          <div className="animate-rise-delay surface border border-savr-leaf/40 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
              Take {best.partner}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-tightish tabular-nums">
              Save {formatKes(saved)}
            </p>
            <p className="text-sm text-savr-mute">plus {formatKes(best.cashbackCents)} cashback</p>
          </div>
        )}

        <ol className="animate-rise-delay-2 space-y-3">
          {quotes.map((q, i) => (
            <li
              key={q.partner}
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
                    <p className="font-display text-xl font-bold tracking-tightish">{q.partner}</p>
                    <p className="text-sm text-savr-mute">
                      ETA {q.etaMin} min · Cashback {formatKes(q.cashbackCents)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold tabular-nums">{formatKes(q.priceCents)}</p>
                  <a
                    href={q.deepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-savr-forest hover:underline"
                  >
                    Open app →
                  </a>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden bg-savr-fog">
                <div
                  className={`rank-bar h-full animate-barGrow ${i === 0 ? "bg-savr-forest" : "bg-savr-ink/20"}`}
                  style={{
                    width: `${(q.priceCents / maxPrice) * 100}%`,
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
