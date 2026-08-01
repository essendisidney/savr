"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";
import {
  claimMerchant,
  fetchMyMerchantIds,
  listMerchants,
  loadCashbackRule,
  loadMerchantPrices,
  saveCashbackRule,
  updateMerchantPrice,
  type ManagedPrice,
  type MerchantCashbackRule,
  type MerchantSummary,
} from "@/lib/merchant";

export default function MerchantPage() {
  const { user, loading: authLoading } = useAuth();
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [myIds, setMyIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prices, setPrices] = useState<ManagedPrice[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [cashback, setCashback] = useState<MerchantCashbackRule | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [m, mine] = await Promise.all([listMerchants(), fetchMyMerchantIds()]);
    setMerchants(m);
    setMyIds(mine);
    if (mine.length && !selectedId) setSelectedId(mine[0]);
    setLoading(false);
  }, [selectedId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedId || !myIds.includes(selectedId)) {
      setPrices([]);
      setDrafts({});
      setCashback(null);
      return;
    }
    Promise.all([loadMerchantPrices(selectedId), loadCashbackRule(selectedId)]).then(
      ([rows, rule]) => {
        setPrices(rows);
        const next: Record<string, string> = {};
        for (const row of rows) {
          next[row.id] = (row.priceCents / 100).toFixed(2);
        }
        setDrafts(next);
        setCashback(rule);
      },
    );
  }, [selectedId, myIds]);

  const selected = useMemo(
    () => merchants.find((m) => m.id === selectedId) ?? null,
    [merchants, selectedId],
  );

  async function onClaim(id: string) {
    if (!user) {
      setStatus("Sign in to claim a merchant dashboard.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const res = await claimMerchant(id);
    setBusy(false);
    if (res.error) {
      setStatus(res.error);
      return;
    }
    setSelectedId(id);
    setStatus("Store claimed — set prices and cashback to win shoppers.");
    await refresh();
  }

  async function onSavePrice(priceId: string) {
    const raw = drafts[priceId];
    const kes = Number(raw);
    if (!Number.isFinite(kes) || kes < 0) {
      setStatus("Enter a valid price in KES.");
      return;
    }
    const cents = Math.round(kes * 100);
    setBusy(true);
    const res = await updateMerchantPrice(priceId, cents);
    setBusy(false);
    if (res.error) {
      setStatus(res.error);
      return;
    }
    setStatus("Price updated — shoppers will see it on basket compare.");
    if (selectedId) {
      const rows = await loadMerchantPrices(selectedId);
      setPrices(rows);
    }
  }

  async function onSaveCashback() {
    if (!selectedId || !cashback) return;
    setBusy(true);
    setStatus(null);
    const res = await saveCashbackRule(selectedId, cashback);
    setBusy(false);
    if (res.error) {
      setStatus(res.error);
      return;
    }
    const refreshed = await loadCashbackRule(selectedId);
    setCashback(refreshed);
    setStatus("Cashback offer live — basket rankings will use it.");
    await refresh();
  }

  if (loading || authLoading) {
    return (
      <PageFrame>
        <div className="h-48 animate-pulse bg-savr-night/80" />
        <PageShell>
          <div className="h-40 animate-pulse bg-savr-fog" />
        </PageShell>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="basket"
        title="Compete on value"
        subtitle="Claim a store, tune prices and cashback, and win the basket ranking."
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-10">
            {!user && (
              <p className="border border-savr-signal/50 bg-savr-signal/20 px-4 py-3 text-sm">
                <Link href="/login" className="font-semibold text-savr-ink underline-offset-2 hover:underline">
                  Sign in
                </Link>{" "}
                to claim a grocery merchant and edit live offers.
              </p>
            )}

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold tracking-tightish">Grocery network</h2>
              <div className="overflow-x-auto border border-savr-ink/[0.08] bg-white shadow-[0_12px_40px_-28px_rgba(4,36,25,0.45)]">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className="border-b border-savr-ink/10 text-savr-mute">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Merchant</th>
                      <th className="px-4 py-3 font-semibold">SKUs</th>
                      <th className="px-4 py-3 font-semibold">Cashback</th>
                      <th className="px-4 py-3 font-semibold">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-savr-ink/[0.06]">
                    {merchants.map((m) => {
                      const mine = myIds.includes(m.id);
                      return (
                        <tr key={m.id} className={selectedId === m.id ? "bg-savr-mist/70" : ""}>
                          <td className="px-4 py-3.5">
                            <p className="font-display text-lg font-bold">{m.name}</p>
                            <p className="text-xs text-savr-mute">
                              {m.verified ? "Verified" : "Pending"} · {m.slug}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 tabular-nums">{m.skuCount}</td>
                          <td className="px-4 py-3.5 font-semibold text-savr-forest">
                            {m.cashbackCents ? formatKes(m.cashbackCents) : "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            {mine ? (
                              <button
                                type="button"
                                onClick={() => setSelectedId(m.id)}
                                className="text-sm font-semibold text-savr-forest hover:underline"
                              >
                                Manage store
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy || !user}
                                onClick={() => onClaim(m.id)}
                                className="btn-primary px-3 py-2 text-xs disabled:opacity-50"
                              >
                                Claim store
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {selected && myIds.includes(selected.id) && cashback && (
              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                    Win the ranking
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tightish">
                    Basket cashback · {selected.name}
                  </h2>
                  <p className="mt-1 text-sm text-savr-mute">
                    Flat reward when a shopper’s basket clears your minimum — used in net total value.
                  </p>
                </div>

                <div className="grid gap-4 border border-savr-ink/[0.08] bg-white p-4 sm:grid-cols-2 sm:p-5">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Offer title
                    </span>
                    <input
                      value={cashback.title}
                      onChange={(e) => setCashback({ ...cashback, title: e.target.value })}
                      className="field mt-1.5"
                      placeholder="Weekend basket bonus"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Cashback (KES)
                    </span>
                    <input
                      value={(cashback.flatCents / 100).toFixed(0)}
                      onChange={(e) => {
                        const kes = Number(e.target.value);
                        setCashback({
                          ...cashback,
                          flatCents: Number.isFinite(kes) ? Math.round(kes * 100) : 0,
                        });
                      }}
                      className="field mt-1.5"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Min basket (KES)
                    </span>
                    <input
                      value={(cashback.minBasketCents / 100).toFixed(0)}
                      onChange={(e) => {
                        const kes = Number(e.target.value);
                        setCashback({
                          ...cashback,
                          minBasketCents: Number.isFinite(kes) ? Math.round(kes * 100) : 0,
                        });
                      }}
                      className="field mt-1.5"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="flex items-center gap-3 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={cashback.isActive}
                      onChange={(e) => setCashback({ ...cashback, isActive: e.target.checked })}
                      className="h-4 w-4 accent-savr-forest"
                    />
                    <span className="text-sm font-medium">Offer is active on Savr</span>
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onSaveCashback}
                      className="btn-primary disabled:opacity-50"
                    >
                      {busy ? "Saving…" : "Publish cashback"}
                    </button>
                    <p className="mt-2 text-xs text-savr-mute">
                      Preview: {formatKes(cashback.flatCents)} back when basket ≥{" "}
                      {formatKes(cashback.minBasketCents)}
                      {!cashback.isActive ? " · currently off" : ""}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                    Price desk
                  </p>
                  <p className="mt-1 text-sm text-savr-mute">
                    Edits go live on basket compare immediately.
                  </p>
                </div>

                <ul className="divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.08] bg-white">
                  {prices.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{p.productName}</p>
                        <p className="text-xs text-savr-mute">
                          {p.brand ?? "Unbranded"}
                          {p.locationName ? ` · ${p.locationName}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-savr-mute">KES</span>
                        <input
                          value={drafts[p.id] ?? ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          className="field w-28 py-2"
                          inputMode="decimal"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onSavePrice(p.id)}
                          className="btn-dark px-3 py-2 text-xs disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </li>
                  ))}
                  {prices.length === 0 && (
                    <li className="px-4 py-8 text-center text-sm text-savr-mute">
                      No priced SKUs for this store yet.
                    </li>
                  )}
                </ul>
              </section>
            )}

            {status && <p className="text-sm font-semibold text-savr-forest">{status}</p>}
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
