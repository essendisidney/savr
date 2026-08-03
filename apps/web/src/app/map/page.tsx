"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { PageFrame, PageShell } from "@/components/PageShell";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { ShopperOriginBar } from "@/components/ShopperOriginBar";
import { loadCatalog, loadFuelStations } from "@/lib/catalog";
import { compareBasket, defaultListFromCatalog, formatKes } from "@/lib/compare";
import { catalogHonesty, fuelHonesty } from "@/lib/data-honesty";
import { haversineKm, useShopperOrigin } from "@/lib/geo";
import { askQuote } from "@/lib/intents";
import type { MapPoint, ValueTier } from "@/components/NairobiMap";

const NairobiMap = dynamic(() => import("@/components/NairobiMap").then((m) => m.NairobiMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(72vh,560px)] items-center justify-center rounded-card border border-savr-ink/[0.06] bg-savr-fog text-sm text-savr-mute">
      Loading value map…
    </div>
  ),
});

function tierFromRank(index: number, n: number): ValueTier {
  if (n <= 1) return "good";
  if (index === 0) return "good";
  if (index >= n - 1) return "poor";
  const third = Math.max(1, Math.floor(n / 3));
  if (index < third) return "good";
  if (index >= n - third) return "poor";
  return "mid";
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <div className="h-28 animate-pulse bg-savr-fog/80" />
          <PageShell>
            <LoadingBlock rows={3} />
          </PageShell>
        </PageFrame>
      }
    >
      <MapInner />
    </Suspense>
  );
}

function MapInner() {
  const searchParams = useSearchParams();
  const askText = (searchParams.get("ask") ?? "").trim();
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [honestyNote, setHonestyNote] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "grocery" | "fuel">("all");
  const {
    origin,
    source: geoSource,
    label: geoLabel,
    busy: geoBusy,
    error: geoError,
    useMyLocation,
    setEstate,
  } = useShopperOrigin();

  useEffect(() => {
    if (!askText) return;
    if (/\bfuel|petrol|diesel|station\b/i.test(askText)) setFilter("fuel");
    else if (/\bgrocer|shop|market|supermarket\b/i.test(askText)) setFilter("grocery");
  }, [askText]);

  const onSelect = useCallback((p: MapPoint) => setSelected(p), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [catalog, fuel] = await Promise.all([loadCatalog(), loadFuelStations("petrol")]);
      if (cancelled) return;
      const g = catalogHonesty(catalog);
      const f = fuelHonesty(fuel.stations, fuel.source);
      const notes = [g.banner, f.banner].filter(Boolean);
      setHonestyNote(notes[0] ?? null);
      const staples = defaultListFromCatalog(catalog);
      const basketRanks = staples.length ? compareBasket(catalog, staples, origin) : [];
      const byBranch = new Map(
        basketRanks.map((r) => [`${r.merchantId}:${r.locationId ?? "none"}`, r]),
      );
      const worstNet = basketRanks.length
        ? Math.max(...basketRanks.map((r) => r.netCents))
        : 0;
      const sortedGrocery = [...basketRanks].sort((a, b) => a.netCents - b.netCents);

      const grocery: MapPoint[] = catalog.merchants
        .filter((m) => m.category === "grocery" && m.location?.lat != null && m.location?.lng != null)
        .map((m) => {
          const branchKey = `${m.id}:${m.locationId ?? m.location?.id ?? "none"}`;
          const rank = byBranch.get(branchKey);
          const rankIndex = sortedGrocery.findIndex(
            (r) =>
              r.merchantId === m.id &&
              (r.locationId ?? "none") === (m.locationId ?? m.location?.id ?? "none"),
          );
          const tier: ValueTier =
            rankIndex >= 0 ? tierFromRank(rankIndex, sortedGrocery.length) : "neutral";
          const saveCents = rank ? Math.max(0, worstNet - rank.netCents) : 0;
          const valueLabel =
            rank && saveCents > 0
              ? `Save ${formatKes(saveCents)}`
              : rank
                ? `Basket ${formatKes(rank.netCents)}`
                : null;
          const dest = `${m.location!.lat},${m.location!.lng}`;
          return {
            id: `m-${branchKey}`,
            kind: "grocery" as const,
            name: m.name,
            subtitle: [
              m.location?.name ?? m.location?.address ?? "Grocery",
              rank ? `Weekly staples net ${formatKes(rank.netCents)}` : null,
              rank?.cashbackCents ? `Cashback ${formatKes(rank.cashbackCents)}` : null,
              rank?.distanceKm != null ? `${rank.distanceKm.toFixed(1)} km` : null,
            ]
              .filter(Boolean)
              .join(" · "),
            lat: m.location!.lat!,
            lng: m.location!.lng!,
            mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest}`,
            valueTier: tier,
            valueLabel,
            metricCents: rank?.netCents ?? null,
          };
        });

      const fuelWithDist = fuel.stations
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => ({
          ...s,
          distanceKm: haversineKm(origin, { lat: s.lat!, lng: s.lng! }),
        }));
      const fuelSorted = [...fuelWithDist].sort(
        (a, b) => a.priceCentsPerLitre - b.priceCentsPerLitre,
      );
      const dearest = fuelSorted.length
        ? fuelSorted[fuelSorted.length - 1].priceCentsPerLitre
        : 0;

      const stations: MapPoint[] = fuelSorted.map((s, index) => {
        const saveCents = Math.max(0, dearest - s.priceCentsPerLitre);
        const tier = tierFromRank(index, fuelSorted.length);
        const dest = `${s.lat},${s.lng}`;
        return {
          id: `f-${s.id}`,
          kind: "fuel" as const,
          name: s.name,
          subtitle: `${s.brand} · petrol ${formatKes(s.priceCentsPerLitre)}/L · ${s.distanceKm.toFixed(1)} km`,
          lat: s.lat!,
          lng: s.lng!,
          mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest}`,
          valueTier: tier,
          valueLabel:
            saveCents > 0
              ? `${formatKes(s.priceCentsPerLitre)}/L · save ${formatKes(saveCents)}/L vs highest`
              : `${formatKes(s.priceCentsPerLitre)}/L`,
          metricCents: s.priceCentsPerLitre,
        };
      });

      const all = [...grocery, ...stations].sort((a, b) => {
        const order = { good: 0, mid: 1, poor: 2, neutral: 3 };
        return (order[a.valueTier ?? "neutral"] ?? 3) - (order[b.valueTier ?? "neutral"] ?? 3);
      });
      setPoints(all);
      setSelected((prev) => {
        if (prev) {
          const still = all.find((p) => p.id === prev.id);
          if (still) return still;
        }
        return all.find((p) => p.valueTier === "good") ?? all[0] ?? null;
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [origin]);

  const visible = points.filter((p) => (filter === "all" ? true : p.kind === filter));

  return (
    <PageFrame>
      <div className="page-hero relative overflow-hidden border-b border-white/40">
        <div className="page-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-10 md:px-6 md:pt-14">
          <p className="page-eyebrow">Value map</p>
          <h1 className="page-title mt-2.5 max-w-2xl text-[clamp(1.85rem,4.5vw,2.75rem)]">
            {askText ? "Here’s nearby value" : "Where Nairobi saves money"}
          </h1>
          <p className="mt-3.5 max-w-lg text-[15px] leading-relaxed text-savr-mute">
            {askText
              ? `For “${askQuote(askText)}” — green is best value, yellow middle, red expensive. Confirm on shelf / board.`
              : "Green = best value. Yellow = middle. Red = expensive. Ranks use catalog + tips — confirm before you spend."}
          </p>
          {askText && (
            <p className="mt-2 max-w-lg text-sm text-savr-mute">
              Ask Savr opened the{" "}
              <span className="font-semibold text-savr-ink">value map</span>
              {filter !== "all" ? ` · showing ${filter}` : ""}.
            </p>
          )}
        </div>
      </div>

      <div className="page-band">
        <PageShell>
          {loading ? (
            <LoadingBlock rows={3} />
          ) : points.length === 0 ? (
            <EmptyState
              title="Map is empty"
              body="Places will appear when grocery and fuel catalogs load."
            />
          ) : (
            <div className="space-y-4">
              {honestyNote && (
                <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
                  {honestyNote}
                </p>
              )}
              <ShopperOriginBar
                label={geoLabel}
                source={geoSource}
                busy={geoBusy}
                error={geoError}
                useMyLocation={useMyLocation}
                setEstate={setEstate}
              />

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["all", "All"],
                    ["grocery", "Groceries"],
                    ["fuel", "Fuel"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={filter === id ? "chip-active" : "chip"}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wide text-savr-mute">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-savr-forest" /> Best value
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-savr-signal" /> Average
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Expensive
                </span>
                <span className="text-savr-mute/80 normal-case tracking-normal">
                  Dashed ring = fuel · {visible.length} places
                </span>
              </div>

              <NairobiMap points={visible} onSelect={onSelect} center={origin} youLabel={geoLabel} />

              {selected && (
                <div
                  className={`relative overflow-hidden px-5 py-5 ${
                    selected.valueTier === "good"
                      ? "card-winner"
                      : selected.valueTier === "poor"
                        ? "card border-red-200"
                        : "card"
                  }`}
                >
                  {selected.valueTier === "good" && (
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-savr-forest" />
                  )}
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                    {selected.kind === "fuel" ? "Fuel" : "Grocery"}
                    {selected.valueTier === "good"
                      ? " · Best value"
                      : selected.valueTier === "poor"
                        ? " · Expensive"
                        : selected.valueTier === "mid"
                          ? " · Mid pack"
                          : ""}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-tightish text-savr-ink">
                    {selected.name}
                  </p>
                  <p className="mt-1 text-sm text-savr-mute">{selected.subtitle}</p>
                  {selected.valueLabel && (
                    <p className="mt-3 font-display text-xl font-bold text-savr-forest">
                      {selected.valueLabel}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {selected.mapsUrl && (
                      <a
                        href={selected.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary px-4 py-2.5 text-sm"
                      >
                        Directions
                      </a>
                    )}
                    {selected.kind === "grocery" ? (
                      <Link href="/basket" className="btn-ghost px-4 py-2.5 text-sm">
                        Compare basket
                      </Link>
                    ) : (
                      <Link href="/fuel" className="btn-ghost px-4 py-2.5 text-sm">
                        Rank fuel
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <ul className="grid gap-2 sm:grid-cols-2">
                {visible
                  .filter((p) => p.valueTier === "good")
                  .slice(0, 6)
                  .map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(p)}
                        className="card w-full px-4 py-3 text-left hover:border-savr-forest/30"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-savr-forest">
                          Best value
                        </p>
                        <p className="mt-0.5 font-semibold text-savr-ink">{p.name}</p>
                        {p.valueLabel && (
                          <p className="text-sm text-savr-mute">{p.valueLabel}</p>
                        )}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </PageShell>
      </div>
    </PageFrame>
  );
}
