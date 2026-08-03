"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import {
  isWatchingProduct,
  submitCrowdsourcePrice,
  unwatchProduct,
  watchProduct,
} from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { bestAskProductMatch, compareProduct, formatKes } from "@/lib/compare";
import { track } from "@/lib/track";
import { formatPriceFreshness, freshnessClassName, formatPriceTrend, trendClassName, confidenceClassName } from "@/lib/freshness";
import { formatDistanceKm, useShopperOrigin } from "@/lib/geo";
import type { Catalog, Product } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";
import { ShopperOriginBar } from "@/components/ShopperOriginBar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";

function PricesInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("id"));
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [tipBranchKey, setTipBranchKey] = useState("");
  const [tipPrice, setTipPrice] = useState("");
  const [tipBusy, setTipBusy] = useState(false);
  const [tipStatus, setTipStatus] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [watchBusy, setWatchBusy] = useState(false);
  const askText = (searchParams.get("ask") ?? "").trim();
  const fromAsk = Boolean(askText || searchParams.get("q"));
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
    loadCatalog().then((c) => {
      setCatalog(c);
      setLoading(false);
      const id = searchParams.get("id");
      if (id && c.products.some((p) => p.id === id)) {
        setSelectedId(id);
      } else if (!id) {
        const q = (searchParams.get("q") ?? askText).trim();
        if (q) {
          const hit = bestAskProductMatch(c, q);
          if (hit) {
            setSelectedId(hit.id);
            setQuery(hit.name);
            track("ask_price_match", { productId: hit.id, q: q.slice(0, 80) });
          }
        }
      }
      const grocery = c.merchants.filter((m) => m.category === "grocery" && m.location?.id);
      if (grocery[0]) {
        setTipBranchKey(`${grocery[0].id}|${grocery[0].locationId ?? grocery[0].location?.id}`);
      }
    });
  }, [searchParams, askText]);

  useEffect(() => {
    setTipStatus(null);
    setTipPrice("");
  }, [selectedId]);

  useEffect(() => {
    if (!user || !selectedId) {
      setWatching(false);
      return;
    }
    void isWatchingProduct(selectedId).then(setWatching);
  }, [user, selectedId]);

  const selected: Product | null = useMemo(() => {
    if (!catalog || !selectedId) return null;
    return catalog.products.find((p) => p.id === selectedId) ?? null;
  }, [catalog, selectedId]);

  const tipBranches = useMemo(() => {
    if (!catalog) return [] as { key: string; merchantId: string; locationId: string; label: string }[];
    return catalog.merchants
      .filter((m) => m.category === "grocery" && (m.locationId || m.location?.id))
      .map((m) => {
        const locationId = m.locationId ?? m.location!.id;
        return {
          key: `${m.id}|${locationId}`,
          merchantId: m.id,
          locationId,
          label: `${m.name}${m.location?.name ? ` · ${m.location.name}` : ""}`,
        };
      });
  }, [catalog]);

  const categories = useMemo(() => {
    if (!catalog) return [] as string[];
    return Array.from(new Set(catalog.products.map((p) => p.category))).sort();
  }, [catalog]);

  const suggestions = useMemo(() => {
    if (!catalog) return [];
    const pool =
      category === "all"
        ? catalog.products
        : catalog.products.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return pool
        .filter((p) => {
          const hay = `${p.name} ${p.brand ?? ""} ${p.category}`.toLowerCase();
          return hay.includes(q);
        })
        .slice(0, 12);
    }
    return pool.slice(0, 12);
  }, [catalog, query, category]);

  const results = useMemo(
    () => (catalog && selectedId ? compareProduct(catalog, selectedId, origin) : []),
    [catalog, selectedId, origin],
  );

  const cheapest = results[0];
  const dearest = results[results.length - 1];
  const saved =
    cheapest && dearest ? dearest.priceCents - cheapest.priceCents : 0;
  const maxPrice = Math.max(...results.map((r) => r.priceCents), 1);

  if (loading) {
    return (
      <PageFrame>
        <div className="h-28 animate-pulse bg-savr-fog/80" />
        <PageShell>
          <LoadingBlock rows={4} />
        </PageShell>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="prices"
        title={
          askText || fromAsk
            ? cheapest
              ? `Cheapest: ${cheapest.merchantName}`
              : "Here’s the price check"
            : "Where is it cheaper?"
        }
        subtitle={
          askText
            ? `For “${askText.length > 72 ? `${askText.slice(0, 72)}…` : askText}”${
                selected ? ` · matched ${selected.name}` : ""
              }`
            : `Search ${catalog?.products.length ?? "…"} staples · live Nairobi prices · ${catalog?.source ?? "…"}`
        }
        action={{ href: "/basket", label: "Full basket compare" }}
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            {askText && selected && cheapest && (
              <p className="text-sm text-savr-mute">
                Ask Savr matched{" "}
                <span className="font-semibold text-savr-ink">{selected.name}</span>
                {" — "}
                best shelf is about{" "}
                <span className="font-semibold text-savr-forest">{formatKes(cheapest.priceCents)}</span>
                {saved > 0 ? ` · keep ~${formatKes(saved)} vs the priciest` : ""}.
              </p>
            )}
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    category === "all"
                      ? "chip-active"
                      : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
                  }`}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                      category === c
                        ? "chip-active"
                        : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
                    }`}
                  >
                    {c.replace("_", " ")}
                  </button>
                ))}
              </div>
              <label htmlFor="price-search" className="sr-only">
                Search product
              </label>
              <input
                id="price-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Milk, bread, rice, oil…"
                className="w-full border border-savr-ink/[0.12] bg-white px-4 py-3.5 text-[15px] text-savr-ink outline-none transition placeholder:text-savr-mute focus:border-savr-forest"
                autoComplete="off"
              />
              <ul className="mt-3 divide-y divide-savr-ink/[0.06] card">
                {suggestions.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(p.id);
                          setQuery("");
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition ${
                          active
                            ? "chip-active"
                            : "hover:bg-savr-mist"
                        }`}
                      >
                        <span>
                          <span
                            className={`block font-semibold ${
                              active ? "text-white" : "text-savr-ink"
                            }`}
                          >
                            {p.name}
                          </span>
                          <span
                            className={`text-xs ${
                              active ? "text-white/60" : "text-savr-mute"
                            }`}
                          >
                            {[p.brand, p.category].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        {active && (
                          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-white/80">
                            Selected
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
                {!suggestions.length && (
                  <li className="list-none border-0">
                    <EmptyState
                      title="No products match"
                      body="Try milk, sugar, oil — or clear the search to browse categories."
                    />
                  </li>
                )}
              </ul>
            </div>

            {selected && results.length > 0 && (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-mute">
                      Comparing
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold tracking-tightish text-savr-ink md:text-3xl">
                      {selected.name}
                    </h2>
                    {selected.brand && (
                      <p className="mt-1 text-sm text-savr-mute">{selected.brand}</p>
                    )}
                  </div>
                  {user ? (
                    <button
                      type="button"
                      disabled={watchBusy || !selectedId}
                      onClick={async () => {
                        if (!selectedId) return;
                        setWatchBusy(true);
                        if (watching) {
                          const res = await unwatchProduct(selectedId);
                          setWatchBusy(false);
                          if ("error" in res) {
                            setTipStatus(res.error);
                            return;
                          }
                          setWatching(false);
                          track("unwatch_product", { productId: selectedId });
                          return;
                        }
                        const res = await watchProduct({
                          productId: selectedId,
                          baselineCents: cheapest?.priceCents ?? null,
                        });
                        setWatchBusy(false);
                        if ("error" in res) {
                          setTipStatus(res.error);
                          return;
                        }
                        setWatching(true);
                        track("watch_product", { productId: selectedId });
                      }}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition duration-soft disabled:opacity-60 ${
                        watching
                          ? "border-savr-forest/40 bg-savr-forest/10 text-savr-forest"
                          : "border-savr-ink/[0.08] bg-white text-savr-ink hover:border-savr-forest/30"
                      }`}
                    >
                      {watchBusy ? "…" : watching ? "Watching" : "Watch for drop"}
                    </button>
                  ) : (
                    <Link
                      href={`/login?next=${encodeURIComponent(`/prices?id=${selectedId}`)}`}
                      className="shrink-0 rounded-full border border-savr-ink/[0.08] bg-white px-4 py-2 text-sm font-semibold text-savr-ink hover:border-savr-forest/30"
                    >
                      Watch for drop
                    </Link>
                  )}
                </div>

                {cheapest && (
                  <SavingsMoment
                    amountLabel={`Cheapest at ${cheapest.merchantName}`}
                    amountCents={saved}
                    detail={
                      saved > 0
                        ? `Less than the highest store price for this item`
                        : "Same price everywhere right now"
                    }
                  />
                )}

                <ShopperOriginBar
                  label={geoLabel}
                  source={geoSource}
                  busy={geoBusy}
                  error={geoError}
                  useMyLocation={useMyLocation}
                  setEstate={setEstate}
                />

                <ol className="space-y-4">
                  {results.map((r, i) => {
                    const width = Math.max(14, (r.priceCents / maxPrice) * 100);
                    const dist = formatDistanceKm(r.distanceKm);
                    return (
                      <li
                        key={`${r.merchantId}:${r.locationId ?? "none"}`}
                        className={`animate-rise relative overflow-hidden border ${
                          r.isCheapest
                            ? "card-winner"
                            : "border-savr-ink/[0.08] bg-white"
                        }`}
                        style={{ animationDelay: `${i * 0.07}s` }}
                      >
                        {r.isCheapest && (
                          <div className="absolute inset-y-0 left-0 w-1.5 bg-savr-forest" />
                        )}
                        <div className="px-4 py-5 sm:px-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                              <span
                                className={`mt-0.5 flex h-8 w-8 items-center justify-center font-display text-sm font-bold ${
                                  r.isCheapest
                                    ? "rounded-xl bg-savr-forest text-white"
                                    : "rounded-xl bg-savr-fog text-savr-mute"
                                }`}
                              >
                                {i + 1}
                              </span>
                              <div>
                                <p
                                  className={`font-display text-2xl font-bold tracking-tightish ${
                                    r.isCheapest ? "text-savr-ink" : "text-savr-ink"
                                  }`}
                                >
                                  {r.merchantName}
                                </p>
                                {r.branchName && (
                                  <p
                                    className={`text-xs ${
                                      r.isCheapest ? "text-savr-mute" : "text-savr-mute"
                                    }`}
                                  >
                                    {r.branchName}
                                    {r.address ? ` · ${r.address}` : ""}
                                  </p>
                                )}
                                <p
                                  className={`mt-0.5 text-xs font-semibold ${
                                    r.isCheapest ? "text-savr-signal" : "text-savr-mute"
                                  }`}
                                >
                                  {r.isCheapest
                                    ? "Lowest price"
                                    : `+${formatKes(r.deltaCents)} vs cheapest`}
                                  {dist ? ` · ${dist}` : ""}
                                  {r.promoCents > 0
                                    ? ` · promo −${formatKes(r.promoCents)}${
                                        r.promoLabel ? ` (${r.promoLabel})` : ""
                                      }`
                                    : ""}
                                </p>
                                {(() => {
                                  const fresh = formatPriceFreshness(r.observedAt, r.source);
                                  const trend = formatPriceTrend(
                                    r.listCents,
                                    r.prevPriceCents,
                                    r.prevObservedAt,
                                  );
                                  if (!fresh.label && !trend.label && !r.confidenceLabel) return null;
                                  return (
                                    <>
                                      {fresh.label ? (
                                        <p
                                          className={`mt-0.5 text-[11px] ${freshnessClassName(
                                            fresh.stale,
                                            "light",
                                          )}`}
                                        >
                                          {fresh.label}
                                        </p>
                                      ) : null}
                                      {trend.label ? (
                                        <p
                                          className={`mt-0.5 text-[11px] font-semibold ${trendClassName(
                                            trend.direction,
                                            "light",
                                          )}`}
                                        >
                                          {trend.label}
                                        </p>
                                      ) : null}
                                      {r.confidenceLabel ? (
                                        <p
                                          className={`mt-0.5 text-[11px] font-semibold ${confidenceClassName(
                                            r.confidenceLevel ?? "medium",
                                            "light",
                                          )}`}
                                        >
                                          {r.confidenceLabel}
                                        </p>
                                      ) : null}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-display text-2xl font-bold tracking-tightish tabular-nums ${
                                  r.isCheapest ? "text-savr-ink" : "text-savr-ink"
                                }`}
                              >
                                {formatKes(r.priceCents)}
                              </p>
                              {r.promoCents > 0 && (
                                <p
                                  className={`text-xs line-through ${
                                    r.isCheapest ? "text-savr-mute" : "text-savr-mute"
                                  }`}
                                >
                                  {formatKes(r.listCents)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div
                            className={`mt-4 h-2 overflow-hidden ${
                              r.isCheapest ? "bg-white/15" : "bg-savr-fog"
                            }`}
                          >
                            <div
                              className={`rank-bar h-full animate-barGrow ${
                                r.isCheapest ? "bg-savr-forest" : "bg-savr-forest/70"
                              }`}
                              style={{
                                width: `${width}%`,
                                animationDelay: `${0.12 + i * 0.08}s`,
                              }}
                            />
                          </div>

                          <a
                            href={r.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-4 inline-block text-sm font-semibold ${
                              r.isCheapest ? "text-savr-signal" : "text-savr-forest"
                            }`}
                          >
                            Directions to store →
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <p className="text-sm text-savr-mute">
                  Building a full list?{" "}
                  <Link href="/basket" className="font-semibold text-savr-forest">
                    Compare your basket
                  </Link>{" "}
                  for the real total.
                </p>

                <section className="card px-4 py-5 sm:px-5">
                  <h3 className="font-display text-lg font-bold tracking-tightish">
                    Saw a different price?
                  </h3>
                  <p className="mt-1 text-sm text-savr-mute">
                    Tip what you paid for {selected.name} at a specific branch — raises confidence for that shelf.
                  </p>
                  <form
                    className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                    onSubmit={async (e: FormEvent) => {
                      e.preventDefault();
                      if (!selectedId || !tipBranchKey) return;
                      const branch = tipBranches.find((b) => b.key === tipBranchKey);
                      if (!branch) return;
                      setTipBusy(true);
                      setTipStatus(null);
                      const res = await submitCrowdsourcePrice({
                        merchantId: branch.merchantId,
                        locationId: branch.locationId,
                        productId: selectedId,
                        priceKes: Number(tipPrice),
                      });
                      setTipBusy(false);
                      if ("error" in res) {
                        setTipStatus(res.error);
                        return;
                      }
                        setTipStatus(
                          `Thanks — ${
                            res.tipCount === 1
                              ? "1 shopper"
                              : `${res.tipCount} shoppers`
                          } tipped this shelf · confidence should rise.`,
                        );
                      setTipPrice("");
                      const c = await loadCatalog();
                      setCatalog(c);
                    }}
                  >
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                        Branch
                      </span>
                      <select
                        value={tipBranchKey}
                        onChange={(e) => setTipBranchKey(e.target.value)}
                        className="field"
                      >
                        {tipBranches.map((b) => (
                          <option key={b.key} value={b.key}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                        Price (KES)
                      </span>
                      <input
                        required
                        inputMode="decimal"
                        value={tipPrice}
                        onChange={(e) => setTipPrice(e.target.value)}
                        placeholder="e.g. 185"
                        className="field w-full sm:w-28"
                      />
                    </label>
                    <button type="submit" disabled={tipBusy} className="btn-primary h-[46px]">
                      {tipBusy ? "Saving…" : "Tip price"}
                    </button>
                  </form>
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
              </>
            )}

            {selected && results.length === 0 && (
              <div className="space-y-4">
                <EmptyState
                  title="No prices yet"
                  body="Tip the shelf price you saw — it helps the next shopper."
                />
                {selectedId && (
                  <form
                    className="grid gap-3 card px-4 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                    onSubmit={async (e: FormEvent) => {
                      e.preventDefault();
                      if (!tipBranchKey) return;
                      const branch = tipBranches.find((b) => b.key === tipBranchKey);
                      if (!branch) return;
                      setTipBusy(true);
                      setTipStatus(null);
                      const res = await submitCrowdsourcePrice({
                        merchantId: branch.merchantId,
                        locationId: branch.locationId,
                        productId: selectedId,
                        priceKes: Number(tipPrice),
                      });
                      setTipBusy(false);
                      if ("error" in res) {
                        setTipStatus(res.error);
                        return;
                      }
                      setTipStatus(
                        `Thanks — ${
                          res.tipCount === 1 ? "1 shopper" : `${res.tipCount} shoppers`
                        } tipped this shelf.`,
                      );
                      setTipPrice("");
                      const c = await loadCatalog();
                      setCatalog(c);
                    }}
                  >
                    <select
                      value={tipBranchKey}
                      onChange={(e) => setTipBranchKey(e.target.value)}
                      className="field"
                    >
                      {tipBranches.map((b) => (
                        <option key={b.key} value={b.key}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      inputMode="decimal"
                      value={tipPrice}
                      onChange={(e) => setTipPrice(e.target.value)}
                      placeholder="KES"
                      className="field sm:w-28"
                    />
                    <button type="submit" disabled={tipBusy} className="btn-primary">
                      Tip price
                    </button>
                  </form>
                )}
                {tipStatus && <p className="text-sm font-medium text-savr-forest">{tipStatus}</p>}
              </div>
            )}

            {!selected && (
              <p className="text-sm text-savr-mute">
                Pick a product above to rank Naivas, Quickmart, Carrefour, Chandarana, and Eastmatt.
              </p>
            )}
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}

export default function PricesPage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <div className="h-28 animate-pulse bg-savr-fog/80" />
          <PageShell>
            <div className="h-28 animate-pulse bg-savr-fog" />
          </PageShell>
        </PageFrame>
      }
    >
      <PricesInner />
    </Suspense>
  );
}
