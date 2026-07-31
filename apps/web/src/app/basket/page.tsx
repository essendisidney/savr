"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { confirmBasketChoice } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { compareBasket, defaultListFromCatalog, formatKes } from "@/lib/compare";
import type { Catalog, ListItem } from "@/lib/types";
import { PageShell } from "@/components/PageShell";

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

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    setStatus(null);
  }

  async function choose(merchantId: string) {
    if (!recommended || !catalog) return;
    if (!user) {
      setStatus("Sign in to lock the choice and earn cashback.");
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
    setStatus(`Locked in. Cashback headed to your wallet.`);
  }

  if (loading || !catalog) {
    return (
      <PageShell>
        <p className="animate-pulse text-savr-ink/50">Loading Nairobi prices…</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-10">
        <div className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-savr-forest">
            Groceries · Nairobi
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Beat the weekly shop
          </h1>
          <p className="mt-3 max-w-xl text-savr-ink/65">
            One list. Every supermarket. Lowest net cost after savings cashback.
          </p>
        </div>

        {recommended && (
          <div className="animate-countPop save-strip animate-shimmer px-5 py-4 text-savr-ink">
            <p className="text-xs font-bold uppercase tracking-wide">You could keep</p>
            <p className="font-display text-3xl font-extrabold md:text-4xl">{formatKes(saved)}</p>
            <p className="text-sm">
              vs the most expensive basket · plus {formatKes(recommended.cashbackCents)} cashback at{" "}
              {recommended.merchantName}
            </p>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.2fr]">
          <div className="animate-rise-delay space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-savr-ink/45">
              Your list · {items.length} items
            </h2>
            <ul className="divide-y divide-savr-ink/10 border-y border-savr-ink/10 bg-white/50">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between gap-3 px-3 py-3.5">
                  <span className="font-medium">{item.freeText}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-xs font-semibold text-savr-ink/40 hover:text-savr-forest"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-rise-delay-2 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-savr-ink/45">
              Ranked by net value
            </h2>
            {results.map((r, i) => (
              <div
                key={r.merchantId}
                className={`px-4 py-4 transition ${
                  r.isRecommended ? "result-win" : "border border-savr-ink/10 bg-white/40"
                }`}
                style={{ animationDelay: `${0.08 * i}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-bold">{r.merchantName}</p>
                    {r.isRecommended && (
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-savr-forest">
                        Best total value
                      </p>
                    )}
                  </div>
                  <p className="font-display text-xl font-bold">{formatKes(r.totalCents)}</p>
                </div>
                <p className="mt-2 text-sm text-savr-ink/60">
                  Cashback {formatKes(r.cashbackCents)} · Net{" "}
                  <span className="font-semibold text-savr-ink">{formatKes(r.netCents)}</span>
                </p>
                {r.isRecommended && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => choose(r.merchantId)}
                    className="btn-primary mt-4 disabled:opacity-60"
                  >
                    {busy ? "Locking in…" : `Choose ${r.merchantName} & earn`}
                  </button>
                )}
              </div>
            ))}

            {!user && (
              <p className="text-sm text-savr-ink/60">
                <Link href="/login" className="font-semibold text-savr-forest underline-offset-2 hover:underline">
                  Sign in
                </Link>{" "}
                to credit cashback to your wallet.
              </p>
            )}
            {status && <p className="text-sm font-semibold text-savr-forest">{status}</p>}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
