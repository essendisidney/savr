"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { confirmBasketChoice } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { compareBasket, defaultListFromCatalog, formatKes } from "@/lib/compare";
import type { Catalog, ListItem } from "@/lib/types";

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
    setStatus(`Saved. Cashback credited · compare ${outcome.compareId.slice(0, 8)}…`);
  }

  if (loading || !catalog) {
    return <p className="text-savr-ink/60">Loading Nairobi catalog…</p>;
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-savr-clay">Groceries · Nairobi</p>
        <h1 className="mt-2 font-display text-4xl text-savr-ink">Basket compare</h1>
        <p className="mt-2 max-w-xl text-savr-ink/70">
          Live catalog from Savr · source: {catalog.source}. Lowest net cost after savings cashback.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-savr-ink/60">
            Shopping list
          </h2>
          <ul className="divide-y divide-savr-ink/10 border-y border-savr-ink/10">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-3 py-3">
                <span>{item.freeText}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-savr-ink/50 hover:text-savr-clay"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-savr-ink/60">
            Results
          </h2>
          {results.map((r) => (
            <div
              key={r.merchantId}
              className={`border px-4 py-4 transition ${
                r.isRecommended
                  ? "border-savr-leaf bg-savr-mint/60"
                  : "border-savr-ink/10 bg-white/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl">{r.merchantName}</p>
                  {r.isRecommended && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-savr-forest">
                      Recommended
                    </p>
                  )}
                </div>
                <p className="text-right font-semibold">{formatKes(r.totalCents)}</p>
              </div>
              <p className="mt-2 text-sm text-savr-ink/70">
                Cashback {formatKes(r.cashbackCents)} · Net {formatKes(r.netCents)} ·{" "}
                {Math.round(r.coverage * 100)}% coverage
              </p>
              {r.isRecommended && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => choose(r.merchantId)}
                  className="mt-4 bg-savr-forest px-4 py-2 text-sm font-semibold text-white hover:bg-savr-leaf disabled:opacity-60"
                >
                  {busy ? "Saving…" : `Choose ${r.merchantName}`}
                </button>
              )}
            </div>
          ))}

          {recommended && (
            <div className="border-l-4 border-savr-clay bg-white/50 px-4 py-3 text-sm">
              Save <strong>{formatKes(saved)}</strong> vs highest basket · Earn{" "}
              <strong>{formatKes(recommended.cashbackCents)}</strong> savings cashback.
              {!user && (
                <>
                  {" "}
                  <Link href="/login" className="text-savr-forest underline-offset-2 hover:underline">
                    Sign in
                  </Link>{" "}
                  to credit your wallet.
                </>
              )}
            </div>
          )}
          {status && <p className="text-sm text-savr-forest">{status}</p>}
        </div>
      </div>
    </div>
  );
}
