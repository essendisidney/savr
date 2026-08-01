"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { confirmBasketChoice } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { compareBasket, defaultListFromCatalog, formatKes } from "@/lib/compare";
import type { Catalog, ListItem } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { RankList } from "@/components/RankList";
import { SavingsMoment } from "@/components/SavingsMoment";

export default function BasketPage() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalog().then((c) => {
      setCatalog(c);
      setItems(defaultListFromCatalog(c));
      setLoading(false);
    });
  }, []);

  const results = useMemo(
    () => (catalog ? compareBasket(catalog, items) : []),
    [catalog, items],
  );
  const recommended = results.find((r) => r.isRecommended);
  const worst = results[results.length - 1];
  const saved = recommended && worst ? worst.totalCents - recommended.totalCents : 0;

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
        subtitle="One list. Every supermarket. The lowest net cost after cashback wins."
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-9">
            {recommended && (
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
                <ul className="divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.08] bg-white shadow-[0_12px_40px_-28px_rgba(4,36,25,0.45)]">
                  {items.map((item) => (
                    <li
                      key={item.productId}
                      className="flex items-center justify-between gap-3 px-4 py-3.5"
                    >
                      <span className="text-[15px] font-medium leading-snug">{item.freeText}</span>
                      <div className="flex items-center gap-1">
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
                      List empty — refresh to restore staples.
                    </li>
                  )}
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-lg font-bold tracking-tightish">Live ranking</h2>
                <RankList
                  results={results}
                  busy={busy}
                  onChoose={choose}
                  chooseLabel={(name) => `Choose ${name} & earn`}
                />

                {!user && (
                  <p className="text-sm text-savr-mute">
                    <Link href="/login" className="font-semibold text-savr-forest hover:underline">
                      Sign in
                    </Link>{" "}
                    to send cashback to your wallet.
                  </p>
                )}
                {status && (
                  <p className="text-sm font-semibold text-savr-forest">
                    {status}{" "}
                    {status.includes("Sign in") && (
                      <Link href="/login" className="underline-offset-2 hover:underline">
                        Go to sign in
                      </Link>
                    )}
                  </p>
                )}
              </section>
            </div>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
