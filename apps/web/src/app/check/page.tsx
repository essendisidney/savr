"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { submitCrowdsourcePrice } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import {
  hydrateDraftAgainstCatalog,
  loadBasketDraft,
  type BasketDraft,
} from "@/lib/basket-draft";
import { loadCatalog } from "@/lib/catalog";
import {
  computeMissedSavings,
  formatKes,
  lineItemsForMerchant,
  searchProducts,
} from "@/lib/compare";
import type { Catalog, ListItem } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { buildMissedShare } from "@/lib/share";

export default function CheckPage() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [paidMerchantId, setPaidMerchantId] = useState("");
  const [items, setItems] = useState<ListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [tipProductId, setTipProductId] = useState<string | null>(null);
  const [tipPrice, setTipPrice] = useState("");
  const [tipBusy, setTipBusy] = useState(false);
  const [tipStatus, setTipStatus] = useState<string | null>(null);
  const [draftHint, setDraftHint] = useState<BasketDraft | null>(null);
  const [listNote, setListNote] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog().then((c) => {
      setCatalog(c);
      const grocery = c.merchants.filter((m) => m.category === "grocery");
      if (grocery[0]) setPaidMerchantId(grocery[0].id);
      const ids = new Set(c.products.map((p) => p.id));
      const draft = loadBasketDraft();
      const hydrated = draft ? hydrateDraftAgainstCatalog(draft, ids) : null;
      setDraftHint(hydrated);
      setLoading(false);
    });
  }, []);

  function useBasketDraft() {
    if (!catalog || !draftHint) return;
    const ids = new Set(catalog.products.map((p) => p.id));
    const hydrated = hydrateDraftAgainstCatalog(draftHint, ids);
    if (!hydrated?.items.length) {
      setListNote("Basket draft has no matching products right now.");
      return;
    }
    setItems(hydrated.items);
    setListNote(`Loaded “${hydrated.name}” from your basket draft.`);
    setTipProductId(null);
    setTipStatus(null);
  }
  const grocery = useMemo(
    () => (catalog ? catalog.merchants.filter((m) => m.category === "grocery") : []),
    [catalog],
  );

  const missed = useMemo(
    () =>
      catalog && paidMerchantId && items.length
        ? computeMissedSavings(catalog, items, paidMerchantId)
        : null,
    [catalog, items, paidMerchantId],
  );

  const paidLines = useMemo(
    () =>
      catalog && paidMerchantId && items.length
        ? lineItemsForMerchant(catalog, items, paidMerchantId)
        : [],
    [catalog, items, paidMerchantId],
  );

  const share = useMemo(() => {
    if (!missed || missed.alreadyOptimal || missed.missedCents <= 0) return undefined;
    return buildMissedShare({
      missedCents: missed.missedCents,
      paidMerchantName: missed.paidMerchantName,
      bestMerchantName: missed.bestMerchantName,
    });
  }, [missed]);

  const suggestions = useMemo(() => {
    if (!catalog || !query.trim()) return [];
    return searchProducts(
      catalog,
      query,
      items.map((i) => i.productId),
    );
  }, [catalog, query, items]);

  function setQty(productId: string, next: number) {
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
  }

  async function onTipPrice(e: FormEvent) {
    e.preventDefault();
    if (!tipProductId || !paidMerchantId) return;
    setTipBusy(true);
    setTipStatus(null);
    const res = await submitCrowdsourcePrice({
      merchantId: paidMerchantId,
      productId: tipProductId,
      priceKes: Number(tipPrice),
    });
    setTipBusy(false);
    if ("error" in res) {
      setTipStatus(res.error);
      return;
    }
    setTipStatus("Thanks — tip saved. Miss recalculates with fresher prices.");
    setTipPrice("");
    setTipProductId(null);
    const c = await loadCatalog();
    setCatalog(c);
  }

  if (loading || !catalog) {
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
        theme="check"
        title="Could you have saved?"
        subtitle="Pull your basket draft, tip what you paid, and see what you left on the table."
        action={{ href: "/basket", label: "Compare before next shop" }}
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-9">
            {missed && (
              <SavingsMoment
                amountLabel={missed.alreadyOptimal ? "You already won" : "You could have kept"}
                amountCents={missed.alreadyOptimal ? missed.paidCashbackCents : missed.missedCents}
                detail={
                  missed.alreadyOptimal
                    ? `${missed.paidMerchantName} was the smart pick for this basket.`
                    : `Shopping at ${missed.bestMerchantName} instead of ${missed.paidMerchantName} — before you spend next time.`
                }
                share={share}
              />
            )}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:gap-12">
              <section className="animate-rise-delay space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold tracking-tightish">
                    Where did you shop?
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {grocery.map((m) => {
                      const active = m.id === paidMerchantId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaidMerchantId(m.id)}
                          className={`px-3.5 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-savr-forest text-white"
                              : "bg-white text-savr-ink ring-1 ring-savr-ink/10 hover:ring-savr-forest/40"
                          }`}
                        >
                          {m.name}
                          {m.location?.name ? (
                            <span className={`ml-1.5 text-xs font-medium ${active ? "text-white/70" : "text-savr-mute"}`}>
                              {m.location.name}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-lg font-bold tracking-tightish">What you bought</h2>
                    <div className="flex items-center gap-2">
                      {draftHint && draftHint.items.length > 0 && (
                        <button
                          type="button"
                          onClick={useBasketDraft}
                          className="text-xs font-semibold text-savr-forest hover:underline"
                        >
                          Use my basket list
                        </button>
                      )}
                      <span className="rounded-sm bg-savr-fog px-2 py-0.5 text-xs font-semibold text-savr-mute">
                        {items.length} items
                      </span>
                    </div>
                  </div>
                  {draftHint && draftHint.items.length > 0 && items.length === 0 && (
                    <p className="mt-2 text-xs text-savr-mute">
                      You have “{draftHint.name}” on Basket ({draftHint.items.length} items) — load it
                      to check the miss in one tap.
                    </p>
                  )}
                  {listNote && (
                    <p className="mt-2 text-xs font-medium text-savr-forest">{listNote}</p>
                  )}

                  <div className="relative mt-3">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Add milk, bread, rice…"
                      className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                      aria-label="Search products you bought"
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
                              <span className="text-xs font-semibold text-savr-forest">Add</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <EmptyState
                      title="What did you buy?"
                      body="Add a few staples from this trip — or pull your basket draft — to see the miss."
                      action={
                        draftHint && draftHint.items.length > 0 ? (
                          <button type="button" onClick={useBasketDraft} className="btn-primary">
                            Use basket draft
                          </button>
                        ) : (
                          <Link href="/basket" className="btn-ghost">
                            Open basket
                          </Link>
                        )
                      }
                    />
                  ) : (
                    <ul className="mt-4 divide-y divide-savr-ink/[0.06] border-y border-savr-ink/[0.06]">
                      {items.map((item) => {
                        const line = paidLines.find((l) => l.productId === item.productId);
                        const tipping = tipProductId === item.productId;
                        return (
                          <li key={item.productId} className="py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-savr-ink">
                                  {item.freeText}
                                </p>
                                <p className="text-xs text-savr-mute">
                                  {line?.unitCents != null
                                    ? `${formatKes(line.unitCents)} each on Savr`
                                    : "No price at this store"}
                                  {" · "}
                                  {!user ? (
                                    <Link
                                      href="/login"
                                      className="font-semibold text-savr-forest hover:underline"
                                    >
                                      Sign in to tip
                                    </Link>
                                  ) : (
                                    <button
                                      type="button"
                                      className="font-semibold text-savr-forest hover:underline"
                                      onClick={() => {
                                        setTipProductId(tipping ? null : item.productId);
                                        setTipPrice(
                                          line?.unitCents != null
                                            ? String(Math.round(line.unitCents / 100))
                                            : "",
                                        );
                                        setTipStatus(null);
                                      }}
                                    >
                                      {tipping ? "Cancel" : "Tip what you paid"}
                                    </button>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="h-8 w-8 bg-savr-fog text-sm font-bold"
                                  onClick={() => setQty(item.productId, item.quantity - 1)}
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="h-8 w-8 bg-savr-fog text-sm font-bold"
                                  onClick={() => setQty(item.productId, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            {tipping && user && (
                              <form
                                onSubmit={onTipPrice}
                                className="mt-3 flex flex-wrap items-end gap-2"
                              >
                                <label className="block min-w-[7rem] flex-1 space-y-1">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                                    You paid (KES)
                                  </span>
                                  <input
                                    required
                                    inputMode="decimal"
                                    value={tipPrice}
                                    onChange={(e) => setTipPrice(e.target.value)}
                                    placeholder="e.g. 185"
                                    className="field py-2"
                                    autoFocus
                                  />
                                </label>
                                <button
                                  type="submit"
                                  disabled={tipBusy}
                                  className="btn-primary h-[42px] px-4"
                                >
                                  {tipBusy ? "Saving…" : "Save tip"}
                                </button>
                              </form>
                            )}
                          </li>
                        );
                      })}
                    </ul>
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
                </div>
              </section>

              <section className="animate-rise-delay-2 space-y-4">
                <h2 className="font-display text-lg font-bold tracking-tightish">The miss</h2>

                {!missed ? (
                  <div className="border border-dashed border-savr-ink/15 bg-white/70 px-5 py-10 text-center">
                    <p className="text-sm text-savr-mute">
                      Pick a store and add what you bought — Savr will show the smarter total.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 bg-white px-5 py-5 shadow-[0_18px_50px_-28px_rgba(4,36,25,0.45)] ring-1 ring-savr-ink/[0.06]">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-savr-mute">
                          You paid at {missed.paidMerchantName}
                        </p>
                        <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-savr-ink">
                          {formatKes(missed.paidNetCents)}
                        </p>
                        {missed.paidCashbackCents > 0 && (
                          <p className="mt-1 text-xs text-savr-mute">
                            after {formatKes(missed.paidCashbackCents)} cashback
                          </p>
                        )}
                      </div>
                      <p className="text-right text-xs font-semibold text-savr-mute">
                        {Math.round(missed.paidCoverage * 100)}% priced
                      </p>
                    </div>

                    <div className="border-t border-savr-ink/[0.06] pt-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-savr-forest">
                        Smart total · {missed.bestMerchantName}
                      </p>
                      <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-savr-forest">
                        {formatKes(missed.bestNetCents)}
                      </p>
                      {missed.bestCashbackCents > 0 && (
                        <p className="mt-1 text-xs text-savr-mute">
                          includes {formatKes(missed.bestCashbackCents)} cashback
                        </p>
                      )}
                    </div>

                    {!missed.alreadyOptimal && missed.missedCents > 0 && (
                      <p className="border-t border-savr-ink/[0.06] pt-4 text-sm font-medium leading-snug text-savr-ink/80">
                        That’s {formatKes(missed.missedCents)} you could have kept by checking Savr
                        before the trip.
                      </p>
                    )}

                    <Link href="/basket" className="btn-primary mt-2 inline-flex w-full justify-center">
                      Compare before my next shop
                    </Link>
                  </div>
                )}
              </section>
            </div>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
