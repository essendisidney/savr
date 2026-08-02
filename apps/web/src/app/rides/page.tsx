"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatKes } from "@/lib/compare";
import { loadRideRouteDraft, saveRideRouteDraft } from "@/lib/ride-draft";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";
import { buildRideShare } from "@/lib/share";
import { getSupabase } from "@/lib/supabase";
import type { RideQuote } from "@/lib/types";

const PRESETS = [
  "Westlands",
  "CBD",
  "Airport",
  "Kilimani",
  "Karen",
  "Eastleigh",
  "Lavington",
  "Thika",
];

export default function RidesPage() {
  const [pickup, setPickup] = useState("Westlands");
  const [destination, setDestination] = useState("Airport");
  const [ready, setReady] = useState(false);
  const [quotes, setQuotes] = useState<RideQuote[]>([]);
  const [meta, setMeta] = useState<{ km: number; surge: number; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadRideRouteDraft();
    if (draft) {
      setPickup(draft.pickup);
      setDestination(draft.destination);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveRideRouteDraft(pickup, destination);
  }, [ready, pickup, destination]);

  const fetchQuotes = useCallback(async () => {
    if (!destination.trim()) {
      setQuotes([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const supabase = getSupabase();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          headers.Authorization = `Bearer ${data.session.access_token}`;
        }
      }
      const res = await fetch("/api/rides/quote", {
        method: "POST",
        headers,
        body: JSON.stringify({ pickup, destination }),
      });
      const data = (await res.json()) as {
        quotes?: RideQuote[];
        km?: number;
        surge?: number;
        label?: string;
        error?: string;
      };
      if (res.ok && data.quotes?.length) {
        setQuotes(data.quotes);
        setMeta({
          km: data.km ?? 0,
          surge: data.surge ?? 1,
          label: data.label ?? "",
        });
      } else {
        setError(data.error ?? "Couldn’t load quotes — try again.");
      }
    } catch {
      setError("Network issue — check connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [pickup, destination]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      void fetchQuotes();
    }, 200);
    return () => clearTimeout(t);
  }, [ready, fetchQuotes]);

  const best = quotes[0];
  const worst = quotes[quotes.length - 1];
  const saved = worst && best ? worst.netCents - best.netCents : 0;
  const maxPrice = Math.max(...quotes.map((q) => q.priceCents), 1);
  const share = useMemo(() => {
    if (!best || saved <= 0) return undefined;
    return buildRideShare({
      savingsCents: saved,
      partner: best.partner,
      destination: destination.trim() || "Nairobi",
    });
  }, [best, saved, destination]);

  function swapRoute() {
    setPickup(destination);
    setDestination(pickup);
  }

  return (
    <PageFrame>
      <PageHero
        theme="rides"
        title="Who gets you there for less?"
        subtitle="Bolt, Uber, Little — ranked before you request. Your last route stays on this phone."
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            <div className="animate-rise grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <label className="block space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                  Pickup
                </span>
                <input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  list="ride-places"
                  placeholder="Westlands"
                  className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                />
              </label>
              <button
                type="button"
                onClick={swapRoute}
                className="mx-auto flex h-11 w-11 items-center justify-center border border-savr-ink/10 bg-white text-savr-ink transition hover:border-savr-forest/40 hover:text-savr-forest"
                aria-label="Swap pickup and destination"
                title="Swap"
              >
                ⇄
              </button>
              <label className="block space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                  Destination
                </span>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  list="ride-places"
                  placeholder="Airport"
                  className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                />
              </label>
              <datalist id="ride-places">
                {PRESETS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                  From
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.filter((p) => p !== destination).map((p) => (
                    <button
                      key={`from-${p}`}
                      type="button"
                      onClick={() => setPickup(p)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        pickup === p
                          ? "bg-savr-forest text-white"
                          : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                  To
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.filter((p) => p !== pickup).map((p) => (
                    <button
                      key={`to-${p}`}
                      type="button"
                      onClick={() => setDestination(p)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        destination === p
                          ? "bg-savr-night text-white"
                          : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
                      }`}
                    >
                      → {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="rounded-sm bg-savr-fog px-3 py-2 text-xs font-semibold text-savr-mute">
              {meta ? `~${meta.km} km` : "Route"}
              {meta && meta.surge !== 1 ? ` · demand ×${meta.surge}` : ""}
              {loading ? " · updating…" : ""}
            </p>

            {error && (
              <div className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchQuotes()}
                  className="text-sm font-semibold text-savr-forest hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {best && (
              <SavingsMoment
                amountLabel={`Take ${best.partner}`}
                amountCents={saved}
                detail={`Save vs priciest net · +${formatKes(best.cashbackCents)} cashback · ${pickup} → ${destination}`}
                share={share}
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
                          <p className="font-display text-2xl font-bold tracking-tightish">
                            {q.partner}
                          </p>
                          <p className={`text-sm ${i === 0 ? "text-white/65" : "text-savr-mute"}`}>
                            ETA ~{q.etaMin} min · Cashback {formatKes(q.cashbackCents)}
                          </p>
                          <p
                            className={`mt-0.5 text-xs font-semibold ${
                              i === 0 ? "text-savr-signal" : "text-savr-mute"
                            }`}
                          >
                            Net {formatKes(q.netCents)}
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
                    <div
                      className={`mt-4 h-2 overflow-hidden ${i === 0 ? "bg-white/15" : "bg-savr-fog"}`}
                    >
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
