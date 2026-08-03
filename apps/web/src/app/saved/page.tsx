"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchSavedLists,
  loadRecentReceipts,
  loadWallet,
  loadWatchlist,
  unwatchProduct,
  type SavedListSummary,
  type ShopReceiptSummary,
  type WatchItem,
} from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";
import { askPriceQuery, askQuote } from "@/lib/intents";
import { buildReceiptShare, whatsAppShareUrl } from "@/lib/share";
import { track } from "@/lib/track";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { PageFrame, PageShell } from "@/components/PageShell";

export default function SavedPage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <div className="h-28 animate-pulse bg-savr-fog/80" />
          <PageShell>
            <LoadingBlock rows={4} />
          </PageShell>
        </PageFrame>
      }
    >
      <SavedInner />
    </Suspense>
  );
}

function SavedInner() {
  const searchParams = useSearchParams();
  const askText = (searchParams.get("ask") ?? "").trim();
  const { user, loading: authLoading } = useAuth();
  const [lists, setLists] = useState<SavedListSummary[]>([]);
  const [history, setHistory] = useState<
    { id: string; listId: string; when: string; savingsCents: number; chosenMerchant: string }[]
  >([]);
  const [watches, setWatches] = useState<WatchItem[]>([]);
  const [receipts, setReceipts] = useState<ShopReceiptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  function onWhatsAppReceipt(r: ShopReceiptSummary) {
    const share = buildReceiptShare(r);
    track("share_save", {
      via: "whatsapp_saved_receipt",
      win: r.alreadyOptimal || r.missedCents <= 0,
      receiptId: r.id,
    });
    setSharingId(r.id);
    window.open(whatsAppShareUrl(share), "_blank", "noopener,noreferrer");
    setShareStatus(
      r.alreadyOptimal || r.missedCents <= 0
        ? "Opening WhatsApp — share the win."
        : "Opening WhatsApp — share the miss before next shop.",
    );
    window.setTimeout(() => setSharingId(null), 800);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void (async () => {
      const [listsRes, wallet, watchRes, receiptRes] = await Promise.all([
        fetchSavedLists(),
        loadWallet(),
        loadWatchlist(),
        loadRecentReceipts(),
      ]);
      setLists(listsRes.lists ?? []);
      setHistory(
        (wallet.history ?? []).map((h) => ({
          id: h.id,
          listId: h.listId,
          when: h.when,
          savingsCents: h.savingsCents,
          chosenMerchant: h.chosenMerchant,
        })),
      );
      setWatches(watchRes.items ?? []);
      setReceipts(receiptRes.receipts ?? []);
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <PageFrame>
        <div className="h-28 animate-pulse bg-savr-fog/80" />
        <PageShell>
          <LoadingBlock rows={4} />
        </PageShell>
      </PageFrame>
    );
  }

  if (!user) {
    const pricesNext = askText
      ? `/prices?q=${encodeURIComponent(askPriceQuery(askText))}&ask=${encodeURIComponent(askText)}`
      : "/prices?q=cooking%20oil";
    const loginNext = askText
      ? `/login?next=${encodeURIComponent(`/saved?ask=${encodeURIComponent(askText)}`)}`
      : "/login?next=/saved";
    return (
      <PageFrame>
        <div className="page-hero relative overflow-hidden border-b border-white/40">
          <div className="page-hero-glow pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-2xl px-4 py-10 md:px-6">
            <p className="page-eyebrow">Saved</p>
            <h1 className="page-title mt-2.5 text-3xl">Your lists & wins</h1>
            {askText ? (
              <p className="mt-2.5 text-sm leading-relaxed text-savr-mute">
                For “{askQuote(askText)}” — sign in to watch drops, or compare the price now.
              </p>
            ) : null}
          </div>
        </div>
        <PageShell>
          <EmptyState
            title={askText ? "Sign in to watch this" : "Sign in to keep lists"}
            body={
              askText
                ? "Watches need an account. Or jump straight to Prices and compare first."
                : "Saved baskets, watchlist drops, shop receipts, and shop-again history live here."
            }
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link href={loginNext} className="btn-primary">
                  Sign in
                </Link>
                <Link href={pricesNext} className="btn-ghost">
                  Compare prices first
                </Link>
              </div>
            }
          />
        </PageShell>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <div className="page-hero relative overflow-hidden border-b border-white/40">
        <div className="page-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-4 py-10 md:px-6">
          <p className="page-eyebrow">Saved</p>
          <h1 className="page-title mt-2.5 text-3xl">
            {askText ? "Your watches & shops" : "Lists, watches & shops"}
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-savr-mute">
            {askText
              ? `For “${askQuote(askText)}” — catch a drop or re-punch a past shop.`
              : "Reopen a list, catch a drop, or revisit what a trip really cost you."}
          </p>
          {askText ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/prices?q=${encodeURIComponent(askPriceQuery(askText))}&ask=${encodeURIComponent(askText)}`}
                className="btn-primary"
              >
                Compare that price
              </Link>
              <Link href="/check" className="btn-ghost">
                Log a shop
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <PageShell narrow>
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-savr-ink">Recent shops</h2>
            <Link href="/check" className="text-sm font-semibold text-savr-forest hover:underline">
              Log a shop →
            </Link>
          </div>
          {receipts.length === 0 ? (
            <EmptyState
              title="No shops logged yet"
              body="After a trip, open Check — pick the branch, add what you bought, and tap Save this shop."
              action={
                <Link href="/check" className="btn-primary">
                  Check a shop
                </Link>
              }
            />
          ) : (
            <>
              {shareStatus && (
                <p className="text-sm font-semibold text-savr-forest">{shareStatus}</p>
              )}
              <ul className="space-y-2">
                {receipts.map((r) => {
                  const isWin = r.alreadyOptimal || r.missedCents <= 0;
                  return (
                    <li key={r.id} className="card space-y-3 px-4 py-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block font-semibold text-savr-ink">
                            {r.paidMerchantName}
                          </span>
                          <span className="text-xs text-savr-mute">
                            {r.when}
                            {isWin ? " · smart pick" : ` · vs ${r.bestMerchantName}`}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 font-display text-lg font-bold tabular-nums ${
                            isWin ? "text-savr-forest" : "text-amber-800"
                          }`}
                        >
                          {isWin
                            ? formatKes(r.paidTotalCents)
                            : `−${formatKes(r.missedCents)}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onWhatsAppReceipt(r)}
                        className="btn-ghost w-full py-2.5 text-sm"
                      >
                        {sharingId === r.id
                          ? "Opening…"
                          : isWin
                            ? "WhatsApp this win"
                            : "WhatsApp this miss"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section className="mt-10 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-savr-ink">Watching for drops</h2>
            <Link href="/alerts" className="text-sm font-semibold text-savr-forest hover:underline">
              Alerts →
            </Link>
          </div>
          {watches.length === 0 ? (
            <EmptyState
              title="No watches yet"
              body="On any price compare, tap Watch for drop — Savr flags when it gets cheaper than when you started watching."
              action={
                <Link href="/prices?q=oil" className="btn-primary">
                  Watch cooking oil
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {watches.map((w) => (
                <li key={w.id} className="card flex items-center justify-between gap-3 px-4 py-3.5">
                  <Link href={w.unread ? "/alerts" : w.href} className="min-w-0 flex-1 hover:opacity-90">
                    <span className="flex items-center gap-2">
                      {w.unread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-savr-forest" aria-hidden />
                      )}
                      <span className="block font-semibold text-savr-ink">{w.productName}</span>
                    </span>
                    <span className="text-xs text-savr-mute">
                      {w.currentCents != null
                        ? `${formatKes(w.currentCents)}${w.merchantName ? ` · ${w.merchantName}` : ""}`
                        : "No live price yet"}
                      {w.dropCents > 0
                        ? ` · ↓ ${formatKes(w.dropCents)} since watch`
                        : w.weekTrendLabel
                          ? ` · ${w.weekTrendLabel}`
                          : ` · since ${w.createdAt}`}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold text-savr-mute hover:text-savr-forest"
                    onClick={async () => {
                      await unwatchProduct(w.productId);
                      setWatches((prev) => prev.filter((x) => x.id !== w.id));
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-lg font-bold text-savr-ink">Shopping lists</h2>
          {lists.length === 0 ? (
            <EmptyState
              title="No saved lists yet"
              body="Compare a basket and tap Save list."
              action={
                <Link href="/basket" className="btn-primary">
                  Open basket
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {lists.map((list) => (
                <li key={list.id}>
                  <Link
                    href={`/basket?saved=${list.id}`}
                    className="card flex items-center justify-between gap-3 px-4 py-3.5 hover:border-savr-forest/30"
                  >
                    <span>
                      <span className="block font-semibold text-savr-ink">{list.name}</span>
                      <span className="text-xs text-savr-mute">
                        {list.itemCount} items
                        {list.updatedAt ? ` · ${list.updatedAt}` : ""}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-savr-forest">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-lg font-bold text-savr-ink">Recent wins</h2>
          {history.length === 0 ? (
            <p className="text-sm text-savr-mute">Lock in a recommended store to build this streak.</p>
          ) : (
            <ul className="space-y-2">
              {history.slice(0, 12).map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/basket?saved=${h.listId}`}
                    className="card flex items-center justify-between gap-3 px-4 py-3.5 hover:border-savr-forest/30"
                  >
                    <span>
                      <span className="block font-semibold text-savr-ink">{h.chosenMerchant}</span>
                      <span className="text-xs text-savr-mute">{h.when}</span>
                    </span>
                    <span className="font-display text-lg font-bold tabular-nums text-savr-forest">
                      {formatKes(h.savingsCents)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageShell>
    </PageFrame>
  );
}
