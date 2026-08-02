"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { submitCrowdsourceFuelPrice } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { loadFuelStations } from "@/lib/catalog";
import { formatKes } from "@/lib/compare";
import { loadFuelPrefsDraft, saveFuelPrefsDraft } from "@/lib/fuel-draft";
import { formatPriceFreshness, freshnessClassName } from "@/lib/freshness";
import { formatDistanceKm, haversineKm, useShopperOrigin } from "@/lib/geo";
import { track } from "@/lib/track";
import type { FuelStation, FuelType } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";

type SortMode = "price" | "distance" | "value";

export default function FuelPage() {
  const { user } = useAuth();
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [source, setSource] = useState("…");
  const [loading, setLoading] = useState(true);
  const [prefsReady, setPrefsReady] = useState(false);
  const [fuelType, setFuelType] = useState<FuelType>("petrol");
  const [sort, setSort] = useState<SortMode>("value");
  const [tipStationId, setTipStationId] = useState("");
  const [tipPrice, setTipPrice] = useState("");
  const [tipBusy, setTipBusy] = useState(false);
  const [tipStatus, setTipStatus] = useState<string | null>(null);
  const { origin, source: geoSource, busy: geoBusy, error: geoError, useMyLocation } =
    useShopperOrigin();

  useEffect(() => {
    const draft = loadFuelPrefsDraft();
    if (draft) {
      setFuelType(draft.fuelType);
      setSort(draft.sort);
    }
    setPrefsReady(true);
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    saveFuelPrefsDraft(fuelType, sort);
  }, [prefsReady, fuelType, sort]);

  useEffect(() => {
    if (!prefsReady) return;
    let cancelled = false;
    setLoading(true);
    loadFuelStations(fuelType).then((r) => {
      if (cancelled) return;
      setStations(r.stations);
      setSource(r.source);
      setLoading(false);
      const live = r.stations.find((s) => !s.id.startsWith("fallback-"));
      if (live) setTipStationId(live.id);
      setTipStatus(null);
    });
    return () => {
      cancelled = true;
    };
  }, [prefsReady, fuelType]);
  const tippableStations = useMemo(
    () => stations.filter((s) => !s.id.startsWith("fallback-")),
    [stations],
  );

  async function reloadStations() {
    const r = await loadFuelStations(fuelType);
    setStations(r.stations);
    setSource(r.source);
  }

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
  const fuelLabel = fuelType === "diesel" ? "diesel" : "petrol";

  if (loading) {
    return (
      <PageFrame>
        <div className="h-44 animate-pulse bg-savr-night/85" />
        <PageShell>
          <LoadingBlock rows={4} />
        </PageShell>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="fuel"
        title="Fill up smarter"
        subtitle={`Nearby ${fuelLabel} prices · ${source}. Your fuel type and sort stay on this phone.`}
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            {best && (
              <SavingsMoment
                amountLabel={`Go to ${best.brand}`}
                amountCents={savedPerLitre}
                detail={`Saved per litre vs the highest ${fuelLabel} station · ${formatDistanceKm(best.distanceKm) ?? "nearby"}`}
              />
            )}

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["petrol", "Petrol"],
                  ["diesel", "Diesel"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFuelType(id)}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    fuelType === id
                      ? "bg-savr-forest text-white"
                      : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

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

            {ranked.length === 0 ? (
              <EmptyState
                title="No stations yet"
                body="Fuel prices will show here when the catalog is online. Try again in a moment."
              />
            ) : (
            <ol className="space-y-4">
              {ranked.map((s, i) => {
                const dist = formatDistanceKm(s.distanceKm);
                return (
                  <li
                    key={`${s.id}-${fuelType}`}
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
                            {(() => {
                              const fresh = formatPriceFreshness(s.observedAt, s.source);
                              if (!fresh.label) return null;
                              return (
                                <p
                                  className={`mt-0.5 text-[11px] ${freshnessClassName(
                                    fresh.stale,
                                    i === 0 ? "dark" : "light",
                                  )}`}
                                >
                                  {fresh.label}
                                </p>
                              );
                            })()}
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
            )}

            <section className="border border-savr-ink/[0.08] bg-white px-4 py-5 sm:px-5">
              <h3 className="font-display text-lg font-bold tracking-tightish">
                Saw a different pump price?
              </h3>
              <p className="mt-1 text-sm text-savr-mute">
                Tip the {fuelLabel} KES/L you just paid — keeps nearby ranks fresh.
              </p>
              {!user ? (
                <p className="mt-4 text-sm text-savr-mute">
                  <Link href="/login" className="font-semibold text-savr-forest hover:underline">
                    Sign in
                  </Link>{" "}
                  to submit a tip.
                </p>
              ) : tippableStations.length === 0 ? (
                <p className="mt-4 text-sm text-savr-mute">
                  Live stations unavailable — tips open when the catalog is online.
                </p>
              ) : (
                <form
                  className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                  onSubmit={async (e: FormEvent) => {
                    e.preventDefault();
                    if (!tipStationId) return;
                    setTipBusy(true);
                    setTipStatus(null);
                    const res = await submitCrowdsourceFuelPrice({
                      stationId: tipStationId,
                      priceKesPerLitre: Number(tipPrice),
                      fuelType,
                    });
                    setTipBusy(false);
                    if ("error" in res) {
                      setTipStatus(res.error);
                      return;
                    }
                    setTipStatus("Thanks — pump tip saved. Ranks refresh below.");
                    setTipPrice("");
                    track("fuel_tip", { fuelType });
                    await reloadStations();
                  }}
                >
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Station
                    </span>
                    <select
                      value={tipStationId}
                      onChange={(e) => setTipStationId(e.target.value)}
                      className="field"
                    >
                      {tippableStations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.brand} · {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      KES / L
                    </span>
                    <input
                      required
                      inputMode="decimal"
                      value={tipPrice}
                      onChange={(e) => setTipPrice(e.target.value)}
                      placeholder={fuelType === "diesel" ? "e.g. 168" : "e.g. 189"}
                      className="field w-full sm:w-28"
                    />
                  </label>
                  <button type="submit" disabled={tipBusy} className="btn-primary h-[46px]">
                    {tipBusy ? "Saving…" : "Tip price"}
                  </button>
                </form>
              )}
              {tipStatus && (
                <p
                  className={`mt-3 text-sm font-medium ${
                    tipStatus.startsWith("Thanks") ? "text-savr-forest" : "text-red-700"
                  }`}
                >
                  {tipStatus}
                </p>
              )}
            </section>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
