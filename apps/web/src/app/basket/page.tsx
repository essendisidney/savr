"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  confirmBasketChoice,
  fetchSavedLists,
  loadSavedList,
  saveShoppingList,
  type SavedListSummary,
} from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import {
  compareBasket,
  defaultListFromCatalog,
  formatKes,
  lineItemsForMerchant,
  searchProducts,
} from "@/lib/compare";
import type { Catalog, ListItem } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { RankList } from "@/components/RankList";
import { SavingsMoment } from "@/components/SavingsMoment";

export default function BasketPage() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [query, setQuery] = useState("");
  const [listName, setListName] = useState("Weekly shop");
  const [savedLists, setSavedLists] = useState<SavedListSummary[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshLists = useCallback(async () => {
    if (!user) {
      setSavedLists([]);
      return;
    }
    const res = await fetchSavedLists();
    if (!res.error) setSavedLists(res.lists);
  }, [user]);

  useEffect(() => {
    loadCatalog().then((c) => {
      setCatalog(c);
      setItems(defaultListFromCatalog(c));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  const results = useMemo(
    () => (catalog ? compareBasket(catalog, items) : []),
    [catalog, items],
  );
  const recommended = results.find((r) => r.isRecommended);
  const worst = results[results.length - 1];
  const saved = recommended && worst ? worst.totalCents - recommended.totalCents : 0;

  const suggestions = useMemo(() => {
    if (!catalog || !query.trim()) return [];
    return searchProducts(
      catalog,
      query,
      items.map((i) => i.productId),
    );
  }, [catalog, query, items]);

  function setQty(productId: string, next: number) {
    setStatus(null);
    if (next <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: next } : i)),
    );
  }

  function addProduct(productId: string, name: string) {
    setItems((prev) => {
      if (prev.some((i) => i.productId === productId)) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { productId, freeText: name, quantity: 1 }];
    });
    setQuery("");
    setStatus(null);
  }

  async function onSaveList() {
    if (!user) {
      setStatus("Sign in to save this list.");
      return;
    }
    setSaving(true);
    const outcome = await saveShoppingList({ name: listName, items });
    setSaving(false);
    if ("error" in outcome) {
      setStatus(outcome.error);
      return;
    }
    setStatus("List saved to your account.");
    refreshLists();
  }

  async function onLoadList(id: string) {
    const outcome = await loadSavedList(id);
    if ("error" in outcome) {
      setStatus(outcome.error);
      return;
    }
    setItems(outcome.items);
    setListName(outcome.name);
    setStatus(`Loaded “${outcome.name}”.`);
  }

  async function choose(merchantId: string) {
    if (!recommended || !catalog) return;
    if (!user) {
      setStatus("Sign in to lock this in and earn cashback.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const chosen = results.find((r) => r.merchantId === merchantId) ?? recommended;
    const outcome = await confirmBasketChoice({
      items,
      results,
      chosenMerchantId: merchantId,
      recommendedMerchantId: recommended.merchantId,
      savingsCents: saved,
      cashbackCents: chosen.cashbackCents,
    });
    setBusy(false);
    if ("error" in outcome) {
      setStatus(outcome.error);
      return;
    }
    setStatus("Done — cashback is in your wallet.");
    refreshLists();
  }

  if (loading || !catalog) {
    return (
      <PageFrame>
        <div className="h-52 animate-pulse bg-savr-night/80" />
        <PageShell>
          <div className="space-y-4 animate-pulse">
            <div className="h-28 w-full bg-savr-fog" />
            <div className="h-40 w-full bg-savr-fog" />
          </div>
        </PageShell>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="basket"
        title="Beat the weekly shop"
        subtitle="Search, save your list, and reopen it next week — ranked by total value."
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-9">
            {recommended && items.length > 0 && (
              <SavingsMoment
                amountLabel="You could keep"
                amountCents={saved}
                detail={`vs the priciest basket · earn ${formatKes(recommended.cashbackCents)} at ${recommended.merchantName}`}
              />
            )}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:gap-12">
              <section className="animate-rise-delay space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-bold tracking-tightish">Your list</h2>
                  <span className="rounded-sm bg-savr-fog px-2 py-0.5 text-xs font-semibold text-savr-mute">
                    {items.length} items
                  </span>
                </div>

                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Add milk, yoghurt, spaghetti…"
                    className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                    aria-label="Search products to add"
                  />
                  {suggestions.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full border border-savr-ink/10 bg-white shadow-[0_16px_40px_-20px_rgba(4,36,25,0.55)]">
                      {suggestions.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => addProduct(p.id, p.name)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-savr-mist"
                          >
                            <span>
                              <span className="font-medium">{p.name}</span>
                              {p.brand && (
                                <span className="ml-2 text-savr-mute">{p.brand}</span>
                              )}
                            </span>
                            <span className="shrink-0 font-semibold text-savr-forest">Add +</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <ul className="divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.08] bg-white shadow-[0_12px_40px_-28px_rgba(4,36,25,0.45)]">
                  {items.map((item) => (
                    <li
                      key={item.productId}
                      className="flex items-center justify-between gap-3 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <span className="block text-[15px] font-medium leading-snug">
                          {item.freeText}
                        </span>
                        <Link
                          href={`/prices?id=${item.productId}`}
                          className="text-xs font-semibold text-savr-forest hover:underline"
                        >
                          Price alone →
                        </Link>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() => setQty(item.productId, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center bg-savr-fog text-lg font-semibold text-savr-ink transition hover:bg-savr-signal"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => setQty(item.productId, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center bg-savr-fog text-lg font-semibold text-savr-ink transition hover:bg-savr-signal"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="px-4 py-8 text-center text-sm text-savr-mute">
                      Search above to build your list.
                    </li>
                  )}
                </ul>

                <div className="flex flex-col gap-2 border border-savr-ink/[0.08] bg-white p-3 sm:flex-row sm:items-center">
                  <input
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="field py-2.5"
                    placeholder="List name"
                    aria-label="List name"
                  />
                  <button
                    type="button"
                    disabled={saving || items.length === 0}
                    onClick={onSaveList}
                    className="btn-dark shrink-0 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save list"}
                  </button>
                </div>

                {user && savedLists.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                      Saved lists
                    </p>
                    <ul className="divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.08] bg-white">
                      {savedLists.map((list) => (
                        <li key={list.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <div>
                            <p className="text-sm font-medium">{list.name}</p>
                            <p className="text-xs text-savr-mute">
                              {list.itemCount} items · {list.updatedAt}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onLoadList(list.id)}
                            className="text-sm font-semibold text-savr-forest hover:underline"
                          >
                            Load
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!user && (
                  <p className="text-xs text-savr-mute">
                    <Link href="/login" className="font-semibold text-savr-forest hover:underline">
                      Sign in
                    </Link>{" "}
                    to save lists for next week.
                  </p>
                )}

                <p className="text-xs text-savr-mute">
                  Catalog · {catalog.products.length} products · {catalog.source}
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold tracking-tightish">Live ranking</h2>
                {items.length === 0 ? (
                  <p className="border border-dashed border-savr-forest/35 bg-white px-4 py-8 text-center text-sm text-savr-mute">
                    Add items to see who is cheapest.
                  </p>
                ) : (
                  <RankList
                    results={results}
                    busy={busy}
                    onChoose={choose}
                    chooseLabel={(name) => `Choose ${name} & earn`}
                    getLineItems={(merchantId) =>
                      lineItemsForMerchant(catalog, items, merchantId)
                    }
                  />
                )}

                {!user && items.length > 0 && (
                  <p className="text-sm text-savr-mute">
                    <Link href="/login" className="font-semibold text-savr-forest hover:underline">
                      Sign in
                    </Link>{" "}
                    to earn wallet cashback.
                  </p>
                )}
                {status && <p className="text-sm font-semibold text-savr-forest">{status}</p>}
              </section>
            </div>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
