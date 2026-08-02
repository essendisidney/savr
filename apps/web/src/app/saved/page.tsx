"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSavedLists, loadWallet, type SavedListSummary } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { PageFrame, PageShell } from "@/components/PageShell";

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const [lists, setLists] = useState<SavedListSummary[]>([]);
  const [history, setHistory] = useState<
    { id: string; listId: string; when: string; savingsCents: number; chosenMerchant: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void (async () => {
      const [listsRes, wallet] = await Promise.all([fetchSavedLists(), loadWallet()]);
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
    return (
      <PageFrame>
        <div className="border-b border-savr-ink/[0.05]">
          <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-forest">
              Saved
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish text-savr-ink">
              Your lists & wins
            </h1>
          </div>
        </div>
        <PageShell>
          <EmptyState
            title="Sign in to keep lists"
            body="Saved baskets and shop-again history live here."
            action={
              <Link href="/login?next=/saved" className="btn-primary">
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
            Saved
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tightish text-savr-ink">
            Lists & smarter shops
          </h1>
          <p className="mt-2 text-sm text-savr-mute">
            Reopen a list or shop again from a locked-in basket.
          </p>
        </div>
      </div>

      <PageShell narrow>
        <section className="space-y-3">
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
