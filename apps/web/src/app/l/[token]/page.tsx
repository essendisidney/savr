"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { appendSharedListItem, loadSharedList } from "@/lib/actions";
import { loadCatalog } from "@/lib/catalog";
import {
  compareBasket,
  formatKes,
  quickAddChips,
  searchProducts,
} from "@/lib/compare";
import { useShopperOrigin } from "@/lib/geo";
import { track } from "@/lib/track";
import type { Catalog, ListItem } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { PageFrame, PageShell } from "@/components/PageShell";
import { RankList } from "@/components/RankList";
import { ShopperOriginBar } from "@/components/ShopperOriginBar";

export default function SharedListPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [name, setName] = useState("Shared list");
  const [items, setItems] = useState<ListItem[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
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
    if (!token) return;
    Promise.all([loadSharedList(token), loadCatalog()]).then(([res, c]) => {
      setCatalog(c);
      if ("error" in res) {
        setError(res.error);
      } else {
        setName(res.name);
        setItems(res.items);
        track("shared_list_open", { items: res.items.length });
      }
      setLoading(false);
    });
  }, [token]);

  const suggestions = useMemo(() => {
    if (!catalog || !query.trim()) return [];
    const exclude = items.map((i) => i.productId);
    return searchProducts(catalog, query, exclude, 8);
  }, [catalog, query, items]);

  const chips = useMemo(() => {
    if (!catalog) return [];
    return quickAddChips(
      catalog,
      items.map((i) => i.productId),
      6,
    );
  }, [catalog, items]);

  const ranks = useMemo(() => {
    if (!catalog || items.length === 0) return [];
    return compareBasket(catalog, items, origin).filter((r) => r.coverage > 0);
  }, [catalog, items, origin]);

  const tease = useMemo(() => {
    if (ranks.length < 2) return null;
    const best = ranks.find((r) => r.isRecommended) ?? ranks[0];
    const worst = ranks[ranks.length - 1];
    const delta = Math.max(0, worst.netCents - best.netCents);
    if (delta < 500) return null;
    const branch =
      best.branchName != null ? `${best.merchantName} · ${best.branchName}` : best.merchantName;
    return { delta, branch, bestNet: best.netCents };
  }, [ranks]);

  const compareHref = token ? `/basket?token=${encodeURIComponent(token)}` : "/basket";

  async function addProduct(productId: string, productName: string) {
    if (!token) return;
    setAddingId(productId);
    setStatus(null);
    const res = await appendSharedListItem({ token, productId, quantity: 1 });
    setAddingId(null);
    if ("error" in res) {
      setStatus(res.error);
      return;
    }
    setName(res.name);
    setItems(res.items);
    setQuery("");
    setStatus(`Added ${productName}.`);
    track("shared_list_append", { productId });
  }

  if (loading) {
    return (
      <PageFrame>
        <div className="h-28 animate-pulse bg-savr-fog/80" />
        <PageShell>
          <LoadingBlock rows={3} />
        </PageShell>
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame>
        <div className="border-b border-savr-ink/[0.05]">
          <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-forest">
              Savr
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish text-savr-ink">
              List not found
            </h1>
            <p className="mt-2 text-sm text-savr-mute">{error}</p>
            <Link href="/basket?staples=1" className="btn-primary mt-6 inline-flex">
              Start a weekly staples list
            </Link>
          </div>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <div className="relative overflow-hidden border-b border-savr-ink/[0.05] bg-gradient-to-br from-savr-mist via-white to-savr-fog/80">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-savr-forest/15 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-lg px-4 py-10 md:px-6 md:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-forest">
            Savr · household list
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish text-savr-ink md:text-4xl">
            {name}
          </h1>
          <p className="mt-2 max-w-md text-sm text-savr-mute">
            Add what you&apos;re out of. See where this list is cheapest before anyone shops.
          </p>
          {tease && (
            <p className="mt-4 inline-flex rounded-full bg-savr-forest/10 px-3 py-1.5 text-xs font-semibold text-savr-forest">
              This list could keep ~{formatKes(tease.delta)} at {tease.branch}
            </p>
          )}
        </div>
      </div>

      <div className="page-band">
        <PageShell>
          <div className="mx-auto max-w-lg space-y-7">
            {items.length > 0 && (
              <Link
                href={compareHref}
                onClick={() => track("shared_list_compare", { items: items.length, via: "cta" })}
                className="btn-primary flex w-full items-center justify-center py-3.5 text-base"
              >
                Open full compare
              </Link>
            )}

            {ranks.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold tracking-tightish">
                  Where to shop
                </h2>
                <ShopperOriginBar
                  label={geoLabel}
                  source={geoSource}
                  busy={geoBusy}
                  error={geoError}
                  useMyLocation={useMyLocation}
                  setEstate={setEstate}
                />
                <RankList results={ranks.slice(0, 4)} />
              </section>
            )}

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold tracking-tightish">Add to the list</h2>
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Milk, bread, avocados…"
                  className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                  aria-label="Search products to add"
                  autoFocus
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full border border-savr-ink/10 bg-white shadow-[0_16px_40px_-20px_rgba(4,36,25,0.55)]">
                    {suggestions.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={addingId === p.id}
                          onClick={() => addProduct(p.id, p.name)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-savr-mist disabled:opacity-60"
                        >
                          <span>
                            <span className="font-medium">{p.name}</span>
                            {p.brand && (
                              <span className="ml-2 text-savr-mute">{p.brand}</span>
                            )}
                          </span>
                          <span className="shrink-0 font-semibold text-savr-forest">
                            {addingId === p.id ? "…" : "Add +"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <button
                      key={c.productId}
                      type="button"
                      disabled={addingId === c.productId}
                      onClick={() => addProduct(c.productId, c.name)}
                      className="rounded-full border border-savr-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-savr-ink transition hover:border-savr-forest/40 hover:text-savr-forest disabled:opacity-50"
                    >
                      {addingId === c.productId ? "…" : `+ ${c.chip}`}
                    </button>
                  ))}
                </div>
              )}

              {status && (
                <p
                  className={`text-sm font-semibold ${
                    status.startsWith("Added") ? "text-savr-forest" : "text-red-700"
                  }`}
                >
                  {status}
                </p>
              )}
            </section>

            {items.length === 0 ? (
              <EmptyState
                title="Nothing on the list yet"
                body="Tap a chip or search — everyone with this link can add."
              />
            ) : (
              <ul className="divide-y divide-savr-ink/[0.06] card">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <span className="text-[15px] font-medium">{item.freeText}</span>
                    <span className="text-sm font-bold tabular-nums text-savr-mute">
                      ×{item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {items.length > 0 && (
              <Link
                href={compareHref}
                onClick={() => track("shared_list_compare", { items: items.length, via: "cta" })}
                className="btn-primary flex w-full items-center justify-center"
              >
                Open full compare
              </Link>
            )}

            <p className="text-center text-xs text-savr-mute">
              {items.length} item{items.length === 1 ? "" : "s"} · no account needed to add ·{" "}
              <Link href="/basket?staples=1" className="font-semibold text-savr-forest hover:underline">
                or start your own
              </Link>
            </p>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
