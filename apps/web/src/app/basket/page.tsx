"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  confirmBasketChoice,
  enableListShare,
  fetchSavedLists,
  loadProfile,
  loadSavedList,
  loadSharedList,
  saveShoppingList,
  shareDraftAsLiveList,
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
  markBasketCompared,
  saveBasketDraft,
} from "@/lib/basket-draft";
import type { Catalog, ListItem } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { RankList } from "@/components/RankList";
import { SavingsMoment } from "@/components/SavingsMoment";
import { ShopperOriginBar } from "@/components/ShopperOriginBar";
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
  const [lockedShareReady, setLockedShareReady] = useState(false);
  const [liveSharePath, setLiveSharePath] = useState<string | null>(null);
  const punchRef = useRef<HTMLDivElement>(null);
  const askText = (searchParams.get("ask") ?? "").trim();
  const {
    origin,
    source: geoSource,
    label: geoLabel,
    busy: geoBusy,
    error: geoError,
    useMyLocation,
    setEstate,
  } = useShopperOrigin();

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
      let appliedShared = false;
      const shareToken = searchParams.get("token");
      if (shareToken) {
        const res = await loadSharedList(shareToken);
        if (!cancelled && !("error" in res) && res.items.length) {
          const kept = res.items.filter((i) => ids.has(i.productId));
          if (kept.length) {
            setItems(kept);
            setListName(res.name || "Shared list");
            setStatus(`Loaded shared list “${res.name || "list"}”.`);
            track("shared_list_compare", { items: kept.length, via: "token" });
            appliedShared = true;
          }
        }
      }
      if (!appliedShared && searchParams.get("shared") && typeof window !== "undefined") {
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

  useEffect(() => {
    if (loading || items.length === 0 || results.length === 0) return;
    markBasketCompared();
  }, [loading, items.length, results.length]);

  useEffect(() => {
    setLockedShareReady(false);
    setLiveSharePath(null);
  }, [items]);

  const recommended = results.find((r) => r.isRecommended);
  const worst = results[results.length - 1];
  const saved = recommended && worst ? worst.netCents - recommended.netCents : 0;
  const share = useMemo(() => {
    if (!recommended || saved <= 0) return undefined;
    return buildBasketShare({
      savingsCents: saved,
      merchantName: recommended.merchantName,
      cashbackCents: recommended.cashbackCents,
      listName: listName.trim() || "Weekly shop",
      items,
      nextPath: liveSharePath,
    });
  }, [recommended, saved, listName, items, liveSharePath]);

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

  function resolvedListName() {
    return listName.trim() || "Weekly shop";
  }

  async function onSaveList() {
    if (!user) {
      setStatus("Sign in to save this list.");
      return;
    }
    setSaving(true);
    const name = resolvedListName();
    if (name !== listName) setListName(name);
    const outcome = await saveShoppingList({ name, items });
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
    setListName(outcome.name.trim() || "Weekly shop");
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
      setLiveSharePath(`/l/${outcome.token}`);
      setStatus("Opening WhatsApp — household can add items on the link.");
      return;
    }
    const result = await sharePayload(payload);
    await refreshLists();
    setLiveSharePath(`/l/${outcome.token}`);
    if (result === "shared") setStatus("List shared — household can add items on the link.");
    else if (result === "copied") setStatus("Share link copied — they can add items too.");
    else setStatus(`Share link: ${outcome.url}`);
  }

  async function onShareCurrent(viaWhatsApp = false) {
    if (!items.length) return;
    setSharingDraft(true);
    setStatus(null);
    const name = resolvedListName();
    if (name !== listName) setListName(name);

    if (user) {
      const outcome = await shareDraftAsLiveList({ name, items });
      setSharingDraft(false);
      if ("error" in outcome) {
        setStatus(outcome.error);
        return;
      }
      setLiveSharePath(`/l/${outcome.token}`);
      const payload = buildListShare({
        listName: name,
        url: outcome.url,
        itemCount: items.length,
      });
      track("list_share", {
        via: viaWhatsApp ? "whatsapp_live" : "live",
        items: items.length,
      });
      await refreshLists();
      if (viaWhatsApp) {
        window.open(whatsAppShareUrl(payload), "_blank", "noopener,noreferrer");
        setStatus("Opening WhatsApp — household can add items on the live link.");
        return;
      }
      const result = await sharePayload(payload);
      if (result === "shared") setStatus("Live list shared — household can add items.");
      else if (result === "copied") setStatus("Live link copied — they can add items too.");
      else setStatus(`Share link: ${outcome.url}`);
      return;
    }

    const url = buildListShareUrl(name, items);
    setSharingDraft(false);
    if (!url) {
      setStatus("Could not build a share link for this list.");
      return;
    }
    const payload = buildListShare({
      listName: name,
      url,
      itemCount: items.length,
    });
    track("list_share", {
      via: viaWhatsApp ? "whatsapp_draft" : "draft",
      items: items.length,
    });
    if (viaWhatsApp) {
      window.open(whatsAppShareUrl(payload), "_blank", "noopener,noreferrer");
      setStatus("Opening WhatsApp — snapshot link. Sign in to share a live list they can edit.");
      return;
    }
    const result = await sharePayload(payload);
    if (result === "shared") {
      setStatus("Snapshot shared — sign in next time for a live household list.");
    } else if (result === "copied") {
      setStatus("Snapshot link copied — sign in for a live list they can edit.");
    } else setStatus(`Share link: ${url}`);
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
    track("basket_confirm", { followed, earned: earnCents });
    refreshLists();
    setLockedShareReady(true);

    const punch = share;
    if (followed && punch) {
      track("share_save", {
        via: "whatsapp_autolock",
        amountKes: Math.round(saved / 100),
      });
      window.open(whatsAppShareUrl(punch), "_blank", "noopener,noreferrer");
      setStatus(
        earnCents > 0
          ? `Locked in — ${formatKes(earnCents)} cashback. Opening WhatsApp…`
          : "Locked in — opening WhatsApp so someone else checks first.",
      );
    } else if (followed) {
      setStatus(
        earnCents > 0
          ? `Locked in — ${formatKes(earnCents)} cashback in your wallet. Share the save.`
          : "Locked in — WhatsApp your save so someone else checks before they spend.",
      );
    } else {
      setStatus(
        `Locked ${chosen.merchantName} — no cashback (Savr recommended ${recommended.merchantName}).`,
      );
    }

    requestAnimationFrame(() => {
      punchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
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
        title={askText ? "Here’s where to shop" : "Where should you shop?"}
        subtitle={
          askText
            ? `For “${askText.length > 72 ? `${askText.slice(0, 72)}…` : askText}” — branches ranked by total cost.`
            : "One list. Branches ranked by total cost — then share or lock."
        }
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            {askText && recommended && items.length > 0 && (
              <p className="text-sm text-savr-mute">
                Ask Savr routed this as a{" "}
                <span className="font-semibold text-savr-ink">basket compare</span>
                {saved > 0 ? (
                  <>
                    {" "}
                    — you could keep about{" "}
                    <span className="font-semibold text-savr-forest">{formatKes(saved)}</span> at{" "}
                    {recommended.merchantName}.
                  </>
                ) : (
                  "."
                )}
              </p>
            )}
            {recommended && items.length > 0 && (
              <div ref={punchRef}>
                <SavingsMoment
                  amountLabel={lockedShareReady ? "You locked in" : "You could keep"}
                  amountCents={saved}
                  detail={
                    lockedShareReady
                      ? `Smart pick · ${recommended.merchantName}${
                          recommended.cashbackCents > 0
                            ? ` · ${formatKes(recommended.cashbackCents)} cashback`
                            : ""
                        }`
                      : `vs the priciest basket · ${recommended.merchantName}${
                          recommended.cashbackCents > 0
                            ? ` · earn ${formatKes(recommended.cashbackCents)}`
                            : ""
                        }`
                  }
                  share={share}
                  shareLabel="Share another way"
                  emphasizeShare={lockedShareReady}
                  paidCents={recommended.netCents}
                  averageCents={
                    results.length
                      ? Math.round(
                          results.reduce((s, r) => s + r.netCents, 0) / results.length,
                        )
                      : undefined
                  }
                />
              </div>
            )}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
              <section className="order-1 space-y-3">
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
                {items.length === 0 ? (
                  <EmptyState
                    title="Add items to rank stores"
                    body="Load staples or search below — all branches rank here."
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
                    canTip
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
                    <Link
                      href="/login?next=/basket"
                      className="font-semibold text-savr-forest hover:underline"
                    >
                      Sign in
                    </Link>{" "}
                    to lock the winner and earn cashback.
                  </p>
                )}
                {status && <p className="text-sm font-semibold text-savr-forest">{status}</p>}
              </section>

              <section className="order-2 animate-rise-delay space-y-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-bold tracking-tightish">Your list</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setItems(defaultListFromCatalog(catalog));
                        setListName("Weekly shop");
                        setStatus("Loaded weekly staples.");
                        track("starter_basket", { items: 10, via: "chip" });
                      }}
                      className="text-xs font-semibold text-savr-forest hover:underline"
                    >
                      Staples
                    </button>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setItems([]);
                          clearBasketDraft();
                          setStatus("List cleared.");
                        }}
                        className="text-xs font-semibold text-savr-mute hover:text-savr-ink hover:underline"
                      >
                        Clear
                      </button>
                    )}
                    <span className="text-xs font-semibold tabular-nums text-savr-mute">
                      {items.length}
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
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="min-w-0 text-[15px] font-medium leading-snug">
                        {item.freeText}
                      </span>
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
                        body="Load staples or search — ranks appear above."
                        action={
                          <button
                            type="button"
                            onClick={() => {
                              setItems(defaultListFromCatalog(catalog));
                              setListName("Weekly shop");
                              setStatus("Loaded weekly staples.");
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

                {items.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <button
                      type="button"
                      disabled={sharingDraft}
                      onClick={() => onShareCurrent(true)}
                      className="font-semibold text-savr-forest hover:underline disabled:opacity-50"
                    >
                      {sharingDraft ? "…" : user ? "WhatsApp live list" : "WhatsApp list"}
                    </button>
                    <button
                      type="button"
                      disabled={sharingDraft}
                      onClick={() => onShareCurrent(false)}
                      className="font-semibold text-savr-mute hover:text-savr-ink hover:underline disabled:opacity-50"
                    >
                      Copy link
                    </button>
                    {user ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={onSaveList}
                        className="font-semibold text-savr-mute hover:text-savr-ink hover:underline disabled:opacity-50"
                      >
                        {saving ? "…" : "Save"}
                      </button>
                    ) : (
                      <Link
                        href="/login?next=/basket"
                        className="font-semibold text-savr-mute hover:text-savr-forest hover:underline"
                      >
                        Sign in to save
                      </Link>
                    )}
                  </div>
                )}

                {user && savedLists.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold text-savr-mute hover:text-savr-ink">
                      Saved lists ({savedLists.length})
                    </summary>
                    <ul className="mt-2 divide-y divide-savr-ink/[0.06] card">
                      {savedLists.map((list) => (
                        <li
                          key={list.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{list.name}</p>
                            <p className="text-xs text-savr-mute">
                              {list.itemCount} items
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
                  </details>
                )}
              </section>
            </div>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
