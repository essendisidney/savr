"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadWatchlist,
  markAllWatchDropsSeen,
  markWatchDropSeen,
  type WatchItem,
} from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { PageFrame, PageShell } from "@/components/PageShell";

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const [drops, setDrops] = useState<WatchItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function refresh() {
    const res = await loadWatchlist();
    setDrops(res.drops ?? []);
    setUnreadCount(res.unreadCount ?? 0);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [user, authLoading]);

  async function onOpen(item: WatchItem) {
    if (item.unread) {
      await markWatchDropSeen(item.productId, item.dropCents);
      setDrops((prev) =>
        prev.map((d) =>
          d.productId === item.productId
            ? { ...d, unread: false, seenDropCents: item.dropCents }
            : d,
        ),
      );
      setUnreadCount((n) => Math.max(0, n - 1));
    }
  }

  async function onMarkAll() {
    const unread = drops.filter((d) => d.unread);
    if (!unread.length) return;
    setBusy(true);
    setStatus(null);
    const res = await markAllWatchDropsSeen(
      unread.map((d) => ({ productId: d.productId, dropCents: d.dropCents })),
    );
    setBusy(false);
    if ("error" in res) {
      setStatus(res.error);
      return;
    }
    setDrops((prev) =>
      prev.map((d) => ({ ...d, unread: false, seenDropCents: Math.max(d.seenDropCents, d.dropCents) })),
    );
    setUnreadCount(0);
    setStatus("All clear — only new drops will show again.");
  }

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
    return (
      <PageFrame>
        <div className="border-b border-savr-ink/[0.05]">
          <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-forest">
              Alerts
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish text-savr-ink">
              High-value only
            </h1>
          </div>
        </div>
        <PageShell>
          <EmptyState
            title="Sign in for watch alerts"
            body="When a watched staple drops at least KES 5 below your baseline, it lands here — not as spam."
            action={
              <Link href="/login?next=/alerts" className="btn-primary">
                Sign in
              </Link>
            }
          />
        </PageShell>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <div className="border-b border-savr-ink/[0.05]">
        <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-forest">
            Alerts
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish text-savr-ink">
            Worth opening
          </h1>
          <p className="mt-2 text-sm text-savr-mute">
            Watchlist drops of KES 5+ only. No push noise — check here when you care.
          </p>
        </div>
      </div>

      <PageShell narrow>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-savr-mute">
            {unreadCount > 0
              ? `${unreadCount} new drop${unreadCount === 1 ? "" : "s"}`
              : drops.length
                ? "You’re caught up"
                : "No drops yet"}
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={onMarkAll}
              className="text-sm font-semibold text-savr-forest hover:underline disabled:opacity-50"
            >
              Mark all seen
            </button>
          )}
        </div>

        {drops.length === 0 ? (
          <EmptyState
            title="Nothing to alert yet"
            body="Watch staples on Prices. When the cheapest shelf drops KES 5+ below your start price, it shows up here."
            action={
              <Link href="/prices?q=oil" className="btn-primary">
                Watch cooking oil
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {drops.map((d) => (
              <li key={d.id}>
                <Link
                  href={d.href}
                  onClick={() => void onOpen(d)}
                  className={`card flex items-center justify-between gap-3 px-4 py-3.5 hover:border-savr-forest/30 ${
                    d.unread ? "border-savr-forest/25 bg-savr-mist/80" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <span className="flex items-center gap-2">
                      {d.unread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-savr-forest" aria-hidden />
                      )}
                      <span className="font-semibold text-savr-ink">{d.productName}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-savr-mute">
                      {d.merchantName ? `${d.merchantName} · ` : ""}
                      {d.currentCents != null ? formatKes(d.currentCents) : "—"}
                      {d.baselineCents != null
                        ? ` · was ${formatKes(d.baselineCents)} when watched`
                        : ""}
                    </span>
                  </div>
                  <span className="shrink-0 font-display text-lg font-bold tabular-nums text-savr-forest">
                    ↓ {formatKes(d.dropCents)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {status && <p className="mt-4 text-sm font-semibold text-savr-forest">{status}</p>}

        <p className="mt-8 text-center text-xs text-savr-mute">
          Manage watches on{" "}
          <Link href="/saved" className="font-semibold text-savr-forest hover:underline">
            Saved
          </Link>
          .
        </p>
      </PageShell>
    </PageFrame>
  );
}
