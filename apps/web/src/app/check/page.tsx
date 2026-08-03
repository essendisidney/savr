"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { logShopReceipt, submitCrowdsourcePrice } from "@/lib/actions";
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
import { buildMissedShare, buildWinShare, sharePayload, whatsAppShareUrl } from "@/lib/share";
import { track } from "@/lib/track";

export default function CheckPage() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [paidKey, setPaidKey] = useState("");
  const [items, setItems] = useState<ListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [tipProductId, setTipProductId] = useState<string | null>(null);
  const [tipPrice, setTipPrice] = useState("");
  const [tipBusy, setTipBusy] = useState(false);
  const [tipStatus, setTipStatus] = useState<string | null>(null);
  const [draftHint, setDraftHint] = useState<BasketDraft | null>(null);
  const [listNote, setListNote] = useState<string | null>(null);
  const [listName, setListName] = useState("This trip");
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [savedShareReady, setSavedShareReady] = useState(false);
  const punchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCatalog().then((c) => {
      setCatalog(c);
      const grocery = c.merchants.filter((m) => m.category === "grocery");
      const first = grocery[0];
      if (first) {
        setPaidKey(`${first.id}:${first.locationId ?? first.location?.id ?? "none"}`);
      }
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
    setListName(hydrated.name.trim() || "This trip");
    setListNote(`Loaded “${hydrated.name}” from your basket draft.`);
    setTipProductId(null);
    setTipStatus(null);
    setSaveStatus(null);
  }

  const grocery = useMemo(
    () => (catalog ? catalog.merchants.filter((m) => m.category === "grocery") : []),
    [catalog],
  );

  const paidMerchantId = useMemo(() => paidKey.split(":")[0] ?? "", [paidKey]);
  const paidLocationId = useMemo(() => {
    const loc = paidKey.split(":")[1];
    return loc && loc !== "none" ? loc : null;
  }, [paidKey]);

  const missed = useMemo(
    () =>
      catalog && paidMerchantId && items.length
        ? computeMissedSavings(catalog, items, paidMerchantId, paidLocationId)
        : null,
    [catalog, items, paidMerchantId, paidLocationId],
  );

  const paidLines = useMemo(
    () =>
      catalog && paidMerchantId && items.length
        ? lineItemsForMerchant(catalog, items, paidMerchantId, paidLocationId)
        : [],
    [catalog, items, paidMerchantId, paidLocationId],
  );

  const share = useMemo(() => {
    if (!missed) return undefined;
    const listPayload = { listName, items };
    if (missed.alreadyOptimal || missed.missedCents <= 0) {
      return buildWinShare({
        merchantName: missed.paidMerchantName,
        cashbackCents: missed.paidCashbackCents,
        paidCents: missed.paidNetCents,
        ...listPayload,
      });
    }
    return buildMissedShare({
      missedCents: missed.missedCents,
      paidMerchantName: missed.paidMerchantName,
      bestMerchantName: missed.bestMerchantName,
      ...listPayload,
    });
  }, [missed, items, listName]);

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
    setSaveStatus(null);
    setSavedShareReady(false);
  }

  async function onTipPrice(e: FormEvent) {
    e.preventDefault();
    if (!tipProductId || !paidMerchantId) return;
    setTipBusy(true);
    setTipStatus(null);
    const res = await submitCrowdsourcePrice({
      merchantId: paidMerchantId,
      locationId: paidLocationId,
      productId: tipProductId,
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
      } tipped this shelf. Miss recalculates with fresher prices.`,
    );
    setTipPrice("");
    setTipProductId(null);
    const c = await loadCatalog();
    setCatalog(c);
  }

  async function onSaveReceipt() {
    if (!missed || !paidMerchantId) return;
    if (!user) {
      setSaveStatus("Sign in to keep this shop on your record.");
      return;
    }
    setSaveBusy(true);
    setSaveStatus(null);
    const res = await logShopReceipt({
      merchantId: paidMerchantId,
      locationId: paidLocationId,
      items: items.map((item) => {
        const line = paidLines.find((l) => l.productId === item.productId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          paidUnitCents: line?.unitCents ?? null,
        };
      }),
      paidTotalCents: missed.paidNetCents,
      smartTotalCents: missed.bestNetCents,
      missedCents: missed.missedCents,
      alreadyOptimal: missed.alreadyOptimal,
      paidMerchantName: missed.paidMerchantName,
      bestMerchantName: missed.bestMerchantName,
    });
    setSaveBusy(false);
    if ("error" in res) {
      setSaveStatus(res.error);
      return;
    }
    setSavedShareReady(true);
    track("shop_receipt_saved", {
      missedCents: missed.missedCents,
      alreadyOptimal: missed.alreadyOptimal,
    });

    const punch = share;
    if (punch) {
      track("share_save", {
        via: "whatsapp_autosave",
        amountKes: Math.round(
          (missed.alreadyOptimal ? missed.paidCashbackCents : missed.missedCents) / 100,
        ),
      });
      window.open(whatsAppShareUrl(punch), "_blank", "noopener,noreferrer");
      setSaveStatus(
        missed.alreadyOptimal
          ? "Saved — opening WhatsApp so someone else checks first."
          : `Saved — ${formatKes(missed.missedCents)} left on the table. Opening WhatsApp…`,
      );
    } else {
      setSaveStatus(
        missed.alreadyOptimal
          ? "Shop saved — WhatsApp your win so someone else checks before they spend."
          : `Shop saved — ${formatKes(missed.missedCents)} left on the table. Share it before you forget.`,
      );
    }

    requestAnimationFrame(() => {
      punchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function onPunchShare() {
    if (!share) return;
    track("share_save", {
      via: "sheet_postsave",
      amountKes: Math.round(
        ((missed?.alreadyOptimal ? missed.paidCashbackCents : missed?.missedCents) ?? 0) / 100,
      ),
    });
    const result = await sharePayload(share);
    if (result === "shared") setSaveStatus("Shared.");
    else if (result === "copied") setSaveStatus("Link copied — paste it in WhatsApp.");
  }

  function onPunchWhatsApp() {
    if (!share) return;
    track("share_save", {
      via: "whatsapp_postsave",
      amountKes: Math.round(
        ((missed?.alreadyOptimal ? missed.paidCashbackCents : missed?.missedCents) ?? 0) / 100,
      ),
    });
    window.open(whatsAppShareUrl(share), "_blank", "noopener,noreferrer");
    setSaveStatus("Opening WhatsApp…");
  }

  if (loading || !catalog) {
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
        theme="check"
        title="Could you have saved?"
        subtitle="Pull your basket draft, tip what you paid, and save the trip — no photo needed."
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
                shareLabel={missed.alreadyOptimal ? "Share this win" : "Share this miss"}
                emphasizeShare={
                  savedShareReady || (!missed.alreadyOptimal && missed.missedCents > 0)
                }
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
                      const key = `${m.id}:${m.locationId ?? m.location?.id ?? "none"}`;
                      const active = key === paidKey;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setPaidKey(key);
                            setSaveStatus(null);
                            setSavedShareReady(false);
                          }}
                          className={`px-3.5 py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-savr-forest text-white"
                              : "bg-white text-savr-ink ring-1 ring-savr-ink/10 hover:ring-savr-forest/40"
                          }`}
                        >
                          {m.name}
                          {m.location?.name ? (
                            <span
                              className={`ml-1.5 text-xs font-medium ${
                                active ? "text-white/80" : "text-savr-mute"
                              }`}
                            >
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
                    <h2 className="font-display text-lg font-bold tracking-tightish">
                      What you bought
                    </h2>
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
                      <span className="rounded-full bg-savr-fog px-2 py-0.5 text-xs font-semibold text-savr-mute">
                        {items.length} items
                      </span>
                    </div>
                  </div>
                  {draftHint && draftHint.items.length > 0 && items.length === 0 && (
                    <p className="mt-2 text-xs text-savr-mute">
                      You have “{draftHint.name}” on Basket ({draftHint.items.length} items) — load
                      it to check the miss in one tap.
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
                                    ? `${formatKes(line.unitCents)} shelf`
                                    : "No shelf price — tip what you paid"}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded-full bg-savr-fog text-sm font-bold"
                                  onClick={() => setQty(item.productId, item.quantity - 1)}
                                >
                                  −
                                </button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded-full bg-savr-fog text-sm font-bold"
                                  onClick={() => setQty(item.productId, item.quantity + 1)}
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-savr-forest"
                                  onClick={() => {
                                    setTipProductId(item.productId);
                                    setTipPrice(
                                      line?.unitCents != null
                                        ? String(Math.round(line.unitCents / 100))
                                        : "",
                                    );
                                  }}
                                >
                                  Tip
                                </button>
                              </div>
                            </div>
                            {tipping && (
                              <form
                                onSubmit={onTipPrice}
                                className="mt-2 flex flex-wrap items-center gap-2"
                              >
                                <input
                                  value={tipPrice}
                                  onChange={(e) => setTipPrice(e.target.value)}
                                  inputMode="decimal"
                                  placeholder="KES paid"
                                  className="field w-28 py-2"
                                  required
                                />
                                <button
                                  type="submit"
                                  disabled={tipBusy}
                                  className="btn-dark px-3 py-2 text-xs disabled:opacity-50"
                                >
                                  Save tip
                                </button>
                                <button
                                  type="button"
                                  className="text-xs text-savr-mute"
                                  onClick={() => setTipProductId(null)}
                                >
                                  Cancel
                                </button>
                              </form>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {tipStatus && (
                    <p className="mt-2 text-xs font-medium text-savr-forest">{tipStatus}</p>
                  )}
                </div>
              </section>

              <section className="animate-rise-delay-2 space-y-4">
                <h2 className="font-display text-lg font-bold tracking-tightish">The miss</h2>

                {!missed ? (
                  <div className="border border-dashed border-savr-ink/15 bg-white/70 px-5 py-10 text-center">
                    <p className="text-sm text-savr-mute">
                      Pick a branch and add what you bought — Savr will show the smarter total.
                    </p>
                  </div>
                ) : (
                  <div className="card space-y-4 px-5 py-5">
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
                      <p className="text-sm font-medium text-savr-ink">
                        That’s {formatKes(missed.missedCents)} you could have kept by checking Savr
                        before this trip.
                      </p>
                    )}

                    <div ref={punchRef} className="border-t border-savr-ink/[0.06] pt-4">
                      {savedShareReady && share ? (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={onPunchWhatsApp}
                            className="btn-primary w-full py-3.5 text-base"
                          >
                            {missed.alreadyOptimal
                              ? "WhatsApp this win"
                              : "WhatsApp this miss"}
                          </button>
                          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                            <button
                              type="button"
                              onClick={onPunchShare}
                              className="font-semibold text-savr-mute hover:text-savr-ink hover:underline"
                            >
                              Share another way
                            </button>
                            <Link
                              href="/basket"
                              className="font-semibold text-savr-forest hover:underline"
                            >
                              Compare before next shop
                            </Link>
                          </div>
                          {saveStatus && (
                            <p className="text-center text-sm font-semibold text-savr-forest">
                              {saveStatus}
                            </p>
                          )}
                        </div>
                      ) : user ? (
                        <>
                          <button
                            type="button"
                            disabled={saveBusy}
                            onClick={onSaveReceipt}
                            className="btn-primary w-full disabled:opacity-50"
                          >
                            {saveBusy ? "Saving…" : "Save this shop"}
                          </button>
                          <p className="mt-2 text-xs text-savr-mute">
                            Keeps a receipt on Saved — then WhatsApp the punch before you forget.
                          </p>
                          {saveStatus && (
                            <p className="mt-2 text-sm font-semibold text-savr-forest">{saveStatus}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <Link
                            href="/login?next=/check"
                            className="btn-primary flex w-full justify-center"
                          >
                            Sign in to save this shop
                          </Link>
                          <p className="mt-2 text-xs text-savr-mute">
                            Keeps a receipt on Saved — no photo, just the miss you can learn from.
                          </p>
                        </>
                      )}
                    </div>
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
