"use client";

import { useMemo, useState } from "react";
import { compareRides, formatKes } from "@/lib/compare";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";

export default function RidesPage() {
  const [destination, setDestination] = useState("Airport");
  const quotes = useMemo(() => compareRides(destination), [destination]);
  const best = quotes[0];
  const worst = quotes[quotes.length - 1];
  const saved = worst && best ? worst.priceCents - best.priceCents : 0;
  const maxPrice = Math.max(...quotes.map((q) => q.priceCents), 1);

  return (
    <PageFrame>
      <PageHero
        theme="rides"
        title="Who gets you there for less?"
        subtitle="Bolt, Uber, Little — ranked before you request."
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            <label className="animate-rise block max-w-md space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                Destination
              </span>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
              />
            </label>

            {best && (
              <SavingsMoment
                amountLabel={`Take ${best.partner}`}
                amountCents={saved}
                detail={`Save on this trip · plus ${formatKes(best.cashbackCents)} cashback`}
              />
            )}

            <ol className="space-y-4">
              {quotes.map((q, i) => (
                <li
                  key={q.partner}
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
                          <p className="font-display text-2xl font-bold tracking-tightish">{q.partner}</p>
                          <p className={`text-sm ${i === 0 ? "text-white/65" : "text-savr-mute"}`}>
                            ETA {q.etaMin} min · Cashback {formatKes(q.cashbackCents)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-bold tabular-nums">
                          {formatKes(q.priceCents)}
                        </p>
                        <a
                          href={q.deepLink}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-sm font-semibold ${
                            i === 0 ? "text-savr-signal" : "text-savr-forest"
                          } hover:underline`}
                        >
                          Open app →
                        </a>
                      </div>
                    </div>
                    <div className={`mt-4 h-2 overflow-hidden ${i === 0 ? "bg-white/15" : "bg-savr-fog"}`}>
                      <div
                        className={`rank-bar h-full animate-barGrow ${
                          i === 0 ? "bg-savr-signal" : "bg-savr-forest/70"
                        }`}
                        style={{
                          width: `${(q.priceCents / maxPrice) * 100}%`,
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
