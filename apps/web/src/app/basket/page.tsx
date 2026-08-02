"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  confirmBasketChoice,
  enableListShare,
  fetchSavedLists,
  loadProfile,
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
  quickAddChips,
  searchProducts,
} from "@/lib/compare";
import { useShopperOrigin } from "@/lib/geo";
import {
  buildListShareUrl,
  clearBasketDraft,
  decodeListShare,
  hydrateDraftAgainstCatalog,
  loadBasketDraft,
  saveBasketDraft,
} from "@/lib/basket-draft";
import type { Catalog, ListItem } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { RankList } from "@/components/RankList";
import { SavingsMoment } from "@/components/SavingsMoment";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { buildBasketShare, buildListShare, sharePayload, whatsAppShareUrl } from "@/lib/share";
import { track } from "@/lib/track";

export default function BasketPage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <div className="h-28 animate-pulse bg-savr-fog/80" />
          <PageShell>
            <div className="space-y-4 animate-pulse">
              <div className="h-28 w-full bg-savr-fog" />
              <div className="h-40 w-full bg-savr-fog" />
            </div>
          </PageShell>
        </PageFrame>
      }
    >
      <BasketInner />
    </Suspense>
  );
}

function BasketInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [query, setQuery] = useState("");
  const [listName, setListName] = useState("Weekly shop");
  const [savedLists, setSavedLists] = useState<SavedListSummary[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preferredMerchantIds, setPreferredMerchantIds] = useState<string[]>([]);
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [sharingDraft, setSharingDraft] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const { origin, source: geoSource, busy: geoBusy, error: geoError, useMyLocation } =
    useShopperOrigin();

  const refreshLists = useCallback(async () => {
    if (!user) {
      setSavedLists([]);
      return;
    }
    const res = await fetchSavedLists();
    if (!res.error) setSavedLists(res.lists);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    loadCatalog().then(async (c) => {
      if (cancelled) return;
      setCatalog(c);
      const ids = new Set(c.products.map((p) => p.id));
      const sharedFlag = searchParams.get("shared");
      let appliedShared = false;
      if (sharedFlag && typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem("savr_shared_list");
          if (raw) {
            const parsed = JSON.parse(raw) as { name?: string; items?: ListItem[] };
            if (parsed.items?.length) {
              const kept = parsed.items.filter((i) => ids.has(i.productId));
              if (kept.length) {
                setItems(kept);
                setListName(parsed.name ?? "Shared list");
                setStatus(`Loaded shared list “${parsed.name ?? "list"}”.`);
                appliedShared = true;
              }
              sessionStorage.removeItem("savr_shared_list");
            }
          }
        } catch {
          /* ignore */
        }
      }
      if (!appliedShared) {
        const savedId = searchParams.get("saved");
        if (savedId) {
          const res = await loadSavedList(savedId);
          if (!cancelled && !("error" in res) && res.items.length) {
            const kept = res.items.filter((i) => ids.has(i.productId));
            if (kept.length) {
              setItems(kept);
              setListName(res.name || "Weekly shop");
              setStatus(`Shop again — reloaded “${res.name || "your list"}”.`);
              track("reshop_from_history", { listId: savedId, items: kept.length });
              appliedShared = true;
            }
          }
        }
      }
      if (!appliedShared) {
        const listParam = searchParams.get("list");
        const fromLink = listParam ? decodeListShare(listParam) : null;
        if (fromLink) {
          const kept = fromLink.items.filter((i) => ids.has(i.productId));
          if (kept.length) {
            setItems(kept);
            setListName(fromLink.name);
            setStatus(`Opened shared list “${fromLink.name}”.`);
            appliedShared = true;
          }
        }
      }
      if (!appliedShared) {
        const forceStaples = searchParams.get("staples") === "1";
        if (forceStaples) {
          const staples = defaultListFromCatalog(c);
          setItems(staples);
          setListName("Weekly shop");
          setStatus(
            `Starter basket ready — ${staples.length} staples. Scroll to see where to shop.`,
          );
          track("starter_basket", { items: staples.length });
          appliedShared = true;
        }
      }
      if (!appliedShared) {
        const draft = loadBasketDraft();
        const hydrated = draft ? hydrateDraftAgainstCatalog(draft, ids) : null;
        if (hydrated) {
          setItems(hydrated.items);
          setListName(hydrated.name);
        } else {
          setItems(defaultListFromCatalog(c));
        }
      }
      if (!cancelled) {
        setLoading(false);
        setDraftReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!draftReady || loading) return;
    saveBasketDraft(listName, items);
  }, [draftReady, loading, listName, items]);
  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  useEffect(() => {
    if (!user) {
      setPreferredMerchantIds([]);
      return;
    }
    loadProfile().then((p) => {
      if (!("error" in p)) setPreferredMerchantIds(p.preferredMerchantIds);
    });
  }, [user]);

  const results = useMemo(
    () =>
      catalog
        ? compareBasket(
            catalog,
            items,
            origin,
            preferredOnly && preferredMerchantIds.length > 0
              ? preferredMerchantIds
              : null,
          )
        : [],
    [catalog, items, origin, preferredOnly, preferredMerchantIds],
  );
  const recommended = results.find((r) => r.isRecommended);
  const worst = results[results.length - 1];
  const saved = recommended && worst ? worst.netCents - recommended.netCents : 0;
  const share = useMemo(() => {
    if (!recommended || saved <= 0) return undefined;
    return buildBasketShare({
      savingsCents: saved,
      merchantName: recommended.merchantName,
      cashbackCents: recommended.cashbackCents,
    });
  }, [recommended, saved]);

  const suggestions = useMemo(() => {
    if (!catalog || !query.trim()) return [];
    return searchProducts(
      catalog,
      query,
      items.map((i) => i.productId),
    );
  }, [catalog, query, items]);

  const chips = useMemo(() => {
    if (!catalog) return [];
    return quickAddChips(
      catalog,
      items.map((i) => i.productId),
    );
  }, [catalog, items]);

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

  async function onShareList(listId: string, viaWhatsApp = false) {
    setSharingId(listId);
    setStatus(null);
    const outcome = await enableListShare(listId);
    setSharingId(null);
    if ("error" in outcome) {
      setStatus(outcome.error);
      return;
    }
    const list = savedLists.find((l) => l.id === listId);
    const payload = buildListShare({
      listName: list?.name ?? "Weekly shop",
      url: outcome.url,
      itemCount: list?.itemCount ?? items.length,
    });
    track("list_share", { via: viaWhatsApp ? "whatsapp_saved" : "sheet_saved" });
    if (viaWhatsApp) {
      window.open(whatsAppShareUrl(payload), "_blank", "noopener,noreferrer");
      await refreshLists();
      setStatus("Opening WhatsApp — household can add items on the link.");
      return;
    }
    const result = await sharePayload(payload);
    await refreshLists();
    if (result === "shared") setStatus("List shared — household can add items on the link.");
    else if (result === "copied") setStatus("Share link copied — they can add items too.");
    else setStatus(`Share link: ${outcome.url}`);
  }

  async function onShareCurrent(viaWhatsApp = false) {
    if (!items.length) return;
    setSharingDraft(true);
    setStatus(null);
    const url = buildListShareUrl(listName, items);
    setSharingDraft(false);
    if (!url) {
      setStatus("Could not build a share link for this list.");
      return;
    }
    const payload = buildListShare({
      listName,
      url,
      itemCount: items.length,
    });
    track("list_share", {
      via: viaWhatsApp ? "whatsapp_draft" : "draft",
      items: items.length,
    });
    if (viaWhatsApp) {
      window.open(whatsAppShareUrl(payload), "_blank", "noopener,noreferrer");
      setStatus("Opening WhatsApp — they can open the list with no sign-in.");
      return;
    }
    const result = await sharePayload(payload);
    if (result === "shared") setStatus("List shared — no sign-in needed for them to open it.");
    else if (result === "copied") setStatus("Share link copied.");
    else setStatus(`Share link: ${url}`);
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
    const followed = merchantId === recommended.merchantId;
    const earnCents = followed ? recommended.cashbackCents : 0;
    const outcome = await confirmBasketChoice({
      items,
      results,
      chosenMerchantId: merchantId,
      recommendedMerchantId: recommended.merchantId,
      savingsCents: followed
        ? saved
        : Math.max(0, (worst?.netCents ?? chosen.netCents) - chosen.netCents),
      cashbackCents: earnCents,
    });
    setBusy(false);
    if ("error" in outcome) {
      setStatus(outcome.error);
      return;
    }
    setStatus(
      followed && earnCents > 0
        ? `Locked in — ${formatKes(earnCents)} cashback in your wallet.`
        : followed
          ? "Locked in — share your save or see it in Savings."
          : `Locked ${chosen.merchantName} — no cashback (Savr recommended ${recommended.merchantName}).`,
    );
    track("basket_confirm", { followed, earned: earnCents });
    refreshLists();
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
        theme="basket"
        title="Feed the family for less"
        subtitle="One list. Every supermarket. The winner should feel obvious — total cost, not sticker price."
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-9">
            {recommended && items.length > 0 && (
              <SavingsMoment
                amountLabel="Great choice — you could keep"
                amountCents={saved}
                detail={`vs the priciest basket · earn ${formatKes(recommended.cashbackCents)} at ${recommended.merchantName}${
                  recommended.promoCents > 0
                    ? ` · promo −${formatKes(recommended.promoCents)}`
                    : ""
                }`}
                share={share}
                paidCents={recommended.netCents}
                averageCents={
                  results.length
                    ? Math.round(
                        results.reduce((s, r) => s + r.netCents, 0) / results.length,
                      )
                    : undefined
                }
              />
            )}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)] lg:gap-12">
              <section className="animate-rise-delay space-y-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-bold tracking-tightish">Your list</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setItems(defaultListFromCatalog(catalog));
                        setListName("Weekly shop");
                        setStatus(
                          "Loaded weekly staples — milk, bread, rice, sugar, soap, oil, eggs, ugali…",
                        );
                        track("starter_basket", { items: 10, via: "chip" });
                      }}
                      className="text-xs font-semibold text-savr-forest hover:underline"
                    >
                      Weekly staples
                    </button>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setItems([]);
                          clearBasketDraft();
                          setStatus("List cleared — search or tap Weekly staples to start again.");
                        }}
                        className="text-xs font-semibold text-savr-mute hover:text-savr-ink hover:underline"
                      >
                        Clear
                      </button>
                    )}
                    <span className="rounded-full bg-savr-fog px-2 py-0.5 text-xs font-semibold text-savr-mute">
                      {items.length} items
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Add milk, bananas, detergent…"
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

                {chips.length > 0 && !query.trim() && (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((c) => (
                      <button
                        key={c.productId}
                        type="button"
                        onClick={() => addProduct(c.productId, c.name)}
                        className="border border-savr-ink/[0.1] bg-white px-3 py-1.5 text-xs font-semibold text-savr-ink transition hover:border-savr-forest/40 hover:text-savr-forest"
                      >
                        + {c.chip}
                      </button>
                    ))}
                  </div>
                )}

                <ul className="divide-y divide-savr-ink/[0.06] card">
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
                    <li className="list-none">
                      <EmptyState
                        title="Your list is empty"
                        body="Search staples above, or load a weekly set to compare stores in seconds."
                        action={
                          <button
                            type="button"
                            onClick={() => {
                              setItems(defaultListFromCatalog(catalog));
                              setListName("Weekly shop");
                              setStatus(
                                "Loaded weekly staples — milk, bread, rice, sugar, soap, oil, eggs, ugali…",
                              );
                              track("starter_basket", { items: 10, via: "empty" });
                            }}
                            className="btn-primary"
                          >
                            Load weekly staples
                          </button>
                        }
                      />
                    </li>
                  )}
                </ul>

                <div className="flex flex-col gap-2 card p-3 sm:flex-row sm:items-center">
                  <input
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="field py-2.5"
                    placeholder="List name"
                    aria-label="List name"
                  />
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={sharingDraft || items.length === 0}
                      onClick={() => onShareCurrent(true)}
                      className="btn-primary flex-1 disabled:opacity-50 sm:flex-none"
                    >
                      {sharingDraft ? "…" : "WhatsApp list"}
                    </button>
                    <button
                      type="button"
                      disabled={sharingDraft || items.length === 0}
                      onClick={() => onShareCurrent(false)}
                      className="btn-ghost flex-1 disabled:opacity-50 sm:flex-none"
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      disabled={saving || items.length === 0}
                      onClick={onSaveList}
                      className="btn-dark flex-1 disabled:opacity-50 sm:flex-none"
                    >
                      {saving ? "Saving…" : "Save list"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-savr-mute">
                  WhatsApp the list home — they add items on the link, you compare before anyone shops.
                </p>

                {user && savedLists.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                      Saved lists
                    </p>
                    <ul className="divide-y divide-savr-ink/[0.06] card">
                      {savedLists.map((list) => (
                        <li key={list.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{list.name}</p>
                            <p className="text-xs text-savr-mute">
                              {list.itemCount} items · {list.updatedAt}
                              {list.shareToken ? " · shared" : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <button
                              type="button"
                              disabled={sharingId === list.id}
                              onClick={() => onShareList(list.id, true)}
                              className="text-sm font-semibold text-savr-forest hover:underline disabled:opacity-50"
                            >
                              {sharingId === list.id ? "…" : "WhatsApp"}
                            </button>
                            <button
                              type="button"
                              onClick={() => onLoadList(list.id)}
                              className="text-sm font-semibold text-savr-ink hover:underline"
                            >
                              Load
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!user && (
                  <p className="text-xs text-savr-mute">
                    Draft saved on this device.{" "}
                    <Link href="/login?next=/basket" className="font-semibold text-savr-forest hover:underline">
                      Sign in
                    </Link>{" "}
                    to keep lists across phones.
                  </p>
                )}

                {user && (
                  <p className="text-xs text-savr-mute">
                    Prefer certain stores?{" "}
                    <Link href="/account" className="font-semibold text-savr-forest hover:underline">
                      Set them in Account
                    </Link>
                    , then filter ranks below.
                  </p>
                )}

                <p className="text-xs text-savr-mute">
                  Catalog · {catalog.products.length} products
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-bold tracking-tightish">Live ranking</h2>
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
                {preferredMerchantIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferredOnly(false)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        !preferredOnly
                          ? "chip-active"
                          : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
                      }`}
                    >
                      All stores
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredOnly(true)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        preferredOnly
                          ? "bg-savr-forest text-white"
                          : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
                      }`}
                    >
                      Preferred only
                    </button>
                  </div>
                )}
                {preferredOnly && preferredMerchantIds.length > 0 && (
                  <p className="text-xs text-savr-mute">
                    Ranking among your preferred stores — best total value still wins.
                  </p>
                )}
                {geoSource === "default" && (
                  <p className="text-xs text-savr-mute">
                    Distances from Westlands · share location for your trip.
                  </p>
                )}
                {geoError && <p className="text-xs font-medium text-red-700">{geoError}</p>}
                {items.length === 0 ? (
                  <EmptyState
                    title="Add items to rank stores"
                    body="Build your list on the left — Savr ranks who is cheapest after cashback."
                  />
                ) : results.length === 0 ? (
                  <EmptyState
                    title="No preferred stores in range"
                    body="Widen the filter or update which stores you prefer."
                    action={
                      <Link href="/account" className="btn-ghost">
                        Update Account
                      </Link>
                    }
                  />
                ) : (
                  <RankList
                    results={results}
                    busy={busy}
                    onChoose={choose}
                    chooseLabel={(name, isRecommended, cashbackCents) =>
                      isRecommended
                        ? cashbackCents > 0
                          ? `Lock ${name} · earn ${formatKes(cashbackCents)}`
                          : `Lock ${name} · best value`
                        : `Shop ${name} · no cashback`
                    }
                    preferredMerchantIds={preferredMerchantIds}
                    canTip={Boolean(user)}
                    onPriceTipped={async () => {
                      const c = await loadCatalog();
                      setCatalog(c);
                      setStatus("Price tip saved — ranks refreshed.");
                    }}
                    getLineItems={(merchantId, locationId) =>
                      lineItemsForMerchant(catalog, items, merchantId, locationId)
                    }
                  />
                )}

                {!user && items.length > 0 && (
                  <p className="text-sm text-savr-mute">
                    <Link href="/login?next=/basket" className="font-semibold text-savr-forest hover:underline">
                      Sign in
                    </Link>{" "}
                    and lock the recommended store to earn wallet cashback.
                  </p>
                )}
                {user && items.length > 0 && recommended && (
                  <p className="text-sm text-savr-mute">
                    Cashback pays only when you lock{" "}
                    <span className="font-semibold text-savr-ink">{recommended.merchantName}</span>
                    {recommended.cashbackCents > 0
                      ? ` (${formatKes(recommended.cashbackCents)})`
                      : ""}
                    — other stores save the trip, not the wallet.
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
