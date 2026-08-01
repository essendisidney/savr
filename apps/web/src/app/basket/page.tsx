"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { confirmBasketChoice } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { compareBasket, defaultListFromCatalog, formatKes } from "@/lib/compare";
import type { Catalog, ListItem } from "@/lib/types";
import { PageShell } from "@/components/PageShell";
import { RankList } from "@/components/RankList";

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
      <PageShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-savr-fog" />
          <div className="h-12 w-72 bg-savr-fog" />
          <div className="h-24 w-full bg-savr-fog" />
          <div className="h-40 w-full bg-savr-fog" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-8 pb-8">
        <header className="animate-rise">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-savr-forest">
            Groceries · Nairobi
          </p>
          <h1 className="mt-2 font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-tightish md:text-5xl">
            Beat the weekly shop
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-savr-mute">
            We rank the full list by net cost after cashback — so the winner is obvious.
          </p>
        </header>

        {recommended && (
          <div className="animate-rise-delay surface border border-savr-leaf/40 px-5 py-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                  You could keep
                </p>
                <p className="mt-1 font-display text-4xl font-extrabold tracking-tightish tabular-nums md:text-5xl">
                  {formatKes(saved)}
                </p>
              </div>
              <p className="max-w-[14rem] text-right text-sm leading-snug text-savr-mute">
                vs highest basket · earn {formatKes(recommended.cashbackCents)} at{" "}
                <span className="font-semibold text-savr-ink">{recommended.merchantName}</span>
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-12">
          <section className="animate-rise-delay space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-mute">
                Your list
              </h2>
              <span className="text-xs text-savr-mute">{items.length} items</span>
            </div>
            <ul className="surface divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.07]">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between gap-3 px-3.5 py-3">
                  <span className="text-[15px] font-medium leading-snug">{item.freeText}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => setQty(item.productId, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center border border-savr-ink/10 text-lg text-savr-mute transition hover:border-savr-forest hover:text-savr-forest"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => setQty(item.productId, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center border border-savr-ink/10 text-lg text-savr-mute transition hover:border-savr-forest hover:text-savr-forest"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
              {items.length === 0 && (
                <li className="px-3.5 py-6 text-sm text-savr-mute">
                  List is empty — refresh to restore staples.
                </li>
              )}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-mute">
              Ranked results
            </h2>
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
              <p
                className={`text-sm font-semibold ${
                  status.includes("Done") || status.includes("wallet")
                    ? "text-savr-forest"
                    : "text-savr-ink"
                }`}
              >
                {status}{" "}
                {status.includes("Sign in") && (
                  <Link href="/login" className="text-savr-forest underline-offset-2 hover:underline">
                    Go to sign in
                  </Link>
                )}
              </p>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
