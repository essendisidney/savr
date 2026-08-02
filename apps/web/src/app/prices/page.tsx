"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { loadCatalog } from "@/lib/catalog";
import { compareProduct, formatKes } from "@/lib/compare";
import type { Catalog, Product } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";

function PricesInner() {
  const searchParams = useSearchParams();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("id"));
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalog().then((c) => {
      setCatalog(c);
      setLoading(false);
      const id = searchParams.get("id");
      if (id && c.products.some((p) => p.id === id)) {
        setSelectedId(id);
      }
    });
  }, [searchParams]);

  const selected: Product | null = useMemo(() => {
    if (!catalog || !selectedId) return null;
    return catalog.products.find((p) => p.id === selectedId) ?? null;
  }, [catalog, selectedId]);

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
    () => (catalog && selectedId ? compareProduct(catalog, selectedId) : []),
    [catalog, selectedId],
  );

  const cheapest = results[0];
  const dearest = results[results.length - 1];
  const saved =
    cheapest && dearest ? dearest.priceCents - cheapest.priceCents : 0;
  const maxPrice = Math.max(...results.map((r) => r.priceCents), 1);

  if (loading) {
    return (
      <PageFrame>
        <div className="h-52 animate-pulse bg-savr-night/80" />
        <PageShell>
          <div className="h-28 animate-pulse bg-savr-fog" />
        </PageShell>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="prices"
        title="Where is it cheaper?"
        subtitle={`Search ${catalog?.products.length ?? "…"} staples · live Nairobi prices · ${catalog?.source ?? "…"}`}
        action={{ href: "/basket", label: "Full basket compare" }}
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    category === "all"
                      ? "bg-savr-night text-white"
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
                        ? "bg-savr-night text-white"
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
              <ul className="mt-3 divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.08] bg-white">
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
                            ? "bg-savr-night text-white"
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
                          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-savr-signal">
                            Selected
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
                {!suggestions.length && (
                  <li className="px-4 py-6 text-sm text-savr-mute">
                    No products match. Try milk, sugar, or oil.
                  </li>
                )}
              </ul>
            </div>

            {selected && results.length > 0 && (
              <>
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

                <ol className="space-y-4">
                  {results.map((r, i) => {
                    const width = Math.max(14, (r.priceCents / maxPrice) * 100);
                    return (
                      <li
                        key={r.merchantId}
                        className={`animate-rise relative overflow-hidden border ${
                          r.isCheapest
                            ? "border-transparent bg-savr-night text-white shadow-[0_18px_40px_-24px_rgba(4,36,25,0.65)]"
                            : "border-savr-ink/[0.08] bg-white"
                        }`}
                        style={{ animationDelay: `${i * 0.07}s` }}
                      >
                        {r.isCheapest && (
                          <div className="absolute inset-y-0 left-0 w-1.5 bg-savr-signal" />
                        )}
                        <div className="px-4 py-5 sm:px-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                              <span
                                className={`mt-0.5 flex h-8 w-8 items-center justify-center font-display text-sm font-bold ${
                                  r.isCheapest
                                    ? "bg-savr-signal text-savr-ink"
                                    : "bg-savr-fog text-savr-mute"
                                }`}
                              >
                                {i + 1}
                              </span>
                              <div>
                                <p
                                  className={`font-display text-2xl font-bold tracking-tightish ${
                                    r.isCheapest ? "text-white" : "text-savr-ink"
                                  }`}
                                >
                                  {r.merchantName}
                                </p>
                                {r.branchName && (
                                  <p
                                    className={`text-xs ${
                                      r.isCheapest ? "text-white/65" : "text-savr-mute"
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
                                </p>
                              </div>
                            </div>
                            <p
                              className={`font-display text-2xl font-bold tracking-tightish tabular-nums ${
                                r.isCheapest ? "text-white" : "text-savr-ink"
                              }`}
                            >
                              {formatKes(r.priceCents)}
                            </p>
                          </div>

                          <div
                            className={`mt-4 h-2 overflow-hidden ${
                              r.isCheapest ? "bg-white/15" : "bg-savr-fog"
                            }`}
                          >
                            <div
                              className={`rank-bar h-full animate-barGrow ${
                                r.isCheapest ? "bg-savr-signal" : "bg-savr-forest/70"
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
              </>
            )}

            {selected && results.length === 0 && (
              <p className="border border-savr-ink/[0.08] bg-white px-4 py-6 text-sm text-savr-mute">
                No merchant prices for this product yet. Try another staple or check back after a
                merchant updates prices.
              </p>
            )}

            {!selected && (
              <p className="text-sm text-savr-mute">
                Pick a product above to rank Naivas, Quickmart, and Carrefour.
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
          <div className="h-52 animate-pulse bg-savr-night/80" />
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
