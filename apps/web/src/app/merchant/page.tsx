"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";
import {
  addMerchantPrice,
  claimMerchant,
  createMerchant,
  createPromotion,
  deactivatePromotion,
  fetchMyMerchantIds,
  listMerchants,
  loadCashbackRule,
  loadMerchantAnalytics,
  loadMerchantLocations,
  loadMerchantPrices,
  loadPromotions,
  saveCashbackRule,
  updateMerchantPrice,
  type ManagedPrice,
  type MerchantAnalytics,
  type MerchantCashbackRule,
  type MerchantLocationOption,
  type MerchantPromotion,
  type MerchantSummary,
} from "@/lib/merchant";
import { loadCatalog } from "@/lib/catalog";
import { csvTemplate, parsePriceCsv, weekly30CsvTemplate, type CsvPriceRow } from "@/lib/merchant-csv";
import { loadUnmatchedAsks, type UnmatchedAsk } from "@/lib/unmatched-asks";
import type { Product } from "@/lib/types";

export default function MerchantPage() {
  const { user, loading: authLoading } = useAuth();
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [myIds, setMyIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prices, setPrices] = useState<ManagedPrice[]>([]);
  const [locations, setLocations] = useState<MerchantLocationOption[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [cashback, setCashback] = useState<MerchantCashbackRule | null>(null);
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [promotions, setPromotions] = useState<MerchantPromotion[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [newName, setNewName] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [addProductId, setAddProductId] = useState("");
  const [addPriceKes, setAddPriceKes] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoPercent, setPromoPercent] = useState("");
  const [promoFlatKes, setPromoFlatKes] = useState("");
  const [promoProductId, setPromoProductId] = useState("");
  const [promoCategory, setPromoCategory] = useState("");
  const [promoEndsAt, setPromoEndsAt] = useState("");
  const [csvRows, setCsvRows] = useState<CsvPriceRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [unmatchedAsks, setUnmatchedAsks] = useState<UnmatchedAsk[]>([]);
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
    loadCatalog().then((c) => setCatalogProducts(c.products));
  }, [refresh]);

  useEffect(() => {
    setUnmatchedAsks(loadUnmatchedAsks().slice(0, 12));
  }, []);

  useEffect(() => {
    if (!selectedId || !myIds.includes(selectedId)) {
      setPrices([]);
      setLocations([]);
      setBranchId("");
      setDrafts({});
      setCashback(null);
      setAnalytics(null);
      setPromotions([]);
      return;
    }
    Promise.all([
      loadMerchantPrices(selectedId),
      loadMerchantLocations(selectedId),
      loadCashbackRule(selectedId),
      loadMerchantAnalytics(selectedId),
      loadPromotions(selectedId),
    ]).then(([rows, locs, rule, stats, promos]) => {
      setPrices(rows);
      setLocations(locs);
      setBranchId((prev) => {
        if (prev && locs.some((l) => l.id === prev)) return prev;
        return locs[0]?.id ?? "";
      });
      const next: Record<string, string> = {};
      for (const row of rows) {
        next[row.id] = (row.priceCents / 100).toFixed(2);
      }
      setDrafts(next);
      setCashback(rule);
      if ("error" in stats) setAnalytics(null);
      else setAnalytics(stats);
      setPromotions(promos);
    });
  }, [selectedId, myIds]);

  const selected = useMemo(
    () => merchants.find((m) => m.id === selectedId) ?? null,
    [merchants, selectedId],
  );

  const branchPrices = useMemo(() => {
    if (!branchId) return prices;
    return prices.filter((p) => p.locationId === branchId);
  }, [prices, branchId]);

  const pricedIds = useMemo(
    () => new Set(branchPrices.map((p) => p.productId)),
    [branchPrices],
  );
  const pricingGaps = useMemo(
    () =>
      catalogProducts
        .filter((p) => !pricedIds.has(p.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 24),
    [catalogProducts, pricedIds],
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

  async function onCreateStore() {
    if (!user) {
      setStatus("Sign in to register a store.");
      return;
    }
    if (newName.trim().length < 2) {
      setStatus("Enter a store name.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const res = await createMerchant({
      name: newName,
      branchName: newBranch,
      address: newAddress,
    });
    setBusy(false);
    if ("error" in res) {
      setStatus(res.error);
      return;
    }
    setSelectedId(res.merchantId);
    setNewName("");
    setNewBranch("");
    setNewAddress("");
    setStatus("Store registered — add SKUs and cashback to compete on Savr.");
    await refresh();
  }

  async function onAddSku() {
    if (!selectedId || !addProductId) return;
    if (!branchId) {
      setStatus("Pick a branch before pricing a SKU.");
      return;
    }
    const kes = Number(addPriceKes);
    if (!Number.isFinite(kes) || kes < 0) {
      setStatus("Enter a valid price in KES.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const res = await addMerchantPrice({
      merchantId: selectedId,
      productId: addProductId,
      priceCents: Math.round(kes * 100),
      locationId: branchId,
    });
    setBusy(false);
    if (res.error) {
      setStatus(res.error);
      return;
    }
    setAddProductId("");
    setAddPriceKes("");
    setStatus("SKU priced on this branch — shoppers can compare it now.");
    const rows = await loadMerchantPrices(selectedId);
    setPrices(rows);
    const next: Record<string, string> = {};
    for (const row of rows) {
      next[row.id] = (row.priceCents / 100).toFixed(2);
    }
    setDrafts(next);
    await refresh();
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
    setStatus("Cashback published.");
    setCashback(await loadCashbackRule(selectedId));
  }

  async function onCreatePromo() {
    if (!selectedId) return;
    const percentRaw = promoPercent.trim() ? Number(promoPercent) : null;
    const flatRaw = promoFlatKes.trim() ? Number(promoFlatKes) : null;
    setBusy(true);
    setStatus(null);
    const res = await createPromotion({
      merchantId: selectedId,
      title: promoTitle,
      discountPercent:
        percentRaw != null && Number.isFinite(percentRaw) ? percentRaw : null,
      flatCents:
        flatRaw != null && Number.isFinite(flatRaw) ? Math.round(flatRaw * 100) : null,
      productId: promoProductId || null,
      category: promoCategory || null,
      endsAt: promoEndsAt ? new Date(`${promoEndsAt}T23:59:59`).toISOString() : null,
    });
    setBusy(false);
    if (res.error) {
      setStatus(res.error);
      return;
    }
    setPromoTitle("");
    setPromoPercent("");
    setPromoFlatKes("");
    setPromoProductId("");
    setPromoCategory("");
    setPromoEndsAt("");
    setStatus("Promotion published.");
    setPromotions(await loadPromotions(selectedId));
  }

  async function onDeactivatePromo(id: string) {
    setBusy(true);
    setStatus(null);
    const res = await deactivatePromotion(id);
    setBusy(false);
    if (res.error) {
      setStatus(res.error);
      return;
    }
    setStatus("Promotion deactivated.");
    if (selectedId) setPromotions(await loadPromotions(selectedId));
  }

  function downloadCsvTemplate() {
    const blob = new Blob([csvTemplate(catalogProducts)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "savr-price-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadWeekly30Template() {
    const blob = new Blob([weekly30CsvTemplate(catalogProducts)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "savr-weekly-30.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onCsvFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsvRows(parsePriceCsv(text, catalogProducts));
    };
    reader.readAsText(file);
  }

  async function onConfirmCsv() {
    if (!selectedId) return;
    if (!branchId) {
      setStatus("Pick a branch before importing CSV.");
      return;
    }
    const valid = csvRows.filter((r) => !r.error && r.matchedProduct);
    if (!valid.length) {
      setStatus("No valid CSV rows to import.");
      return;
    }
    setBusy(true);
    setStatus(null);
    let ok = 0;
    let fail = 0;
    const existing = new Map(
      branchPrices.map((p) => [p.productId, p] as const),
    );
    for (const row of valid) {
      const productId = row.matchedProduct!.id;
      const cents = Math.round(row.priceKes * 100);
      const current = existing.get(productId);
      const res = current
        ? await updateMerchantPrice(current.id, cents)
        : await addMerchantPrice({
            merchantId: selectedId,
            productId,
            priceCents: cents,
            locationId: branchId,
          });
      if (res.error) fail += 1;
      else ok += 1;
    }
    setBusy(false);
    setStatus(`CSV import · ${ok} updated · ${fail} failed`);
    setCsvRows([]);
    const rows = await loadMerchantPrices(selectedId);
    setPrices(rows);
    const next: Record<string, string> = {};
    for (const row of rows) next[row.id] = (row.priceCents / 100).toFixed(2);
    setDrafts(next);
    await refresh();
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of catalogProducts) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort();
  }, [catalogProducts]);

  if (loading || authLoading) {
    return (
      <PageFrame>
        <div className="h-28 animate-pulse bg-savr-fog/80" />
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
        subtitle="Register your store or claim your chain — then compete on price and cashback."
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-10">
            {!user && (
              <p className="border border-savr-signal/50 bg-savr-signal/20 px-4 py-3 text-sm">
                <Link href="/login" className="font-semibold text-savr-ink underline-offset-2 hover:underline">
                  Sign in
                </Link>{" "}
                to register a grocery store or claim an existing chain.
              </p>
            )}

            {unmatchedAsks.length > 0 && (
              <section className="card space-y-3 p-4 sm:p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                    Demand from Ask
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold tracking-tightish">
                    Unmatched searches on this device
                  </h2>
                  <p className="mt-1 text-sm text-savr-mute">
                    Soft-launch signal — phrases shoppers typed that didn’t hit a SKU. Use them to
                    grow aliases or catalog; Weekly 30 still comes first.
                  </p>
                </div>
                <ul className="divide-y divide-savr-ink/[0.06]">
                  {unmatchedAsks.map((row) => (
                    <li
                      key={row.q}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <span className="font-medium text-savr-ink">
                        “{row.q}”
                        {row.requested ? (
                          <span className="ml-2 text-xs font-semibold text-savr-forest">requested</span>
                        ) : null}
                      </span>
                      <span className="text-xs text-savr-mute">
                        ×{row.count}
                        {row.at ? ` · ${new Date(row.at).toLocaleDateString("en-KE")}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {user && (
              <section className="space-y-4 card p-4 sm:p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                    New on Savr
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold tracking-tightish">
                    Register your store
                  </h2>
                  <p className="mt-1 text-sm text-savr-mute">
                    Creates a grocery merchant, first branch, and makes you the owner.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Store name
                    </span>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="field mt-1.5"
                      placeholder="Eastlands Fresh Mart"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Branch
                    </span>
                    <input
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      className="field mt-1.5"
                      placeholder="Main · Buruburu"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Address
                    </span>
                    <input
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="field mt-1.5"
                      placeholder="Outer Ring Rd"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCreateStore}
                  className="btn-primary disabled:opacity-50"
                >
                  {busy ? "Creating…" : "Create store"}
                </button>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold tracking-tightish">Grocery network</h2>
              <div className="overflow-x-auto card">
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
                    Demand signal
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tightish">
                    Analytics · {selected.name}
                  </h2>
                  <p className="mt-1 text-sm text-savr-mute">
                    Privacy-safe totals from locked-in basket compares — no shopper identities.
                  </p>
                </div>

                <div className="card px-4 py-5 sm:px-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-bold tracking-tightish">
                      Pricing gaps
                    </h3>
                    <span className="text-xs font-semibold text-savr-mute">
                      {pricingGaps.length
                        ? `${pricingGaps.length} of ${catalogProducts.length} unpriced`
                        : "Full coverage"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-savr-mute">
                    SKUs shoppers can tip as missing — price them to lift your list coverage.
                  </p>
                  {pricingGaps.length === 0 ? (
                    <p className="mt-3 text-sm font-medium text-savr-forest">
                      You have a price on every catalog staple.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.08]">
                      {pricingGaps.map((p) => (
                        <li
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                        >
                          <span>
                            <span className="font-medium">{p.name}</span>
                            {p.brand ? (
                              <span className="ml-2 text-savr-mute">{p.brand}</span>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            className="text-xs font-semibold text-savr-forest hover:underline"
                            onClick={() => {
                              setAddProductId(p.id);
                              setAddPriceKes("");
                              setStatus(`Selected ${p.name} — enter KES below and add.`);
                            }}
                          >
                            Price this →
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {analytics ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: "Impressions", value: String(analytics.impressions) },
                        { label: "Recommended", value: String(analytics.recommended) },
                        { label: "Chosen", value: String(analytics.chosen) },
                        { label: "Win rate", value: `${analytics.winRate}%` },
                      ].map((stat, i) => (
                        <div
                          key={stat.label}
                          className="animate-rise card px-4 py-4"
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                            {stat.label}
                          </p>
                          <p className="mt-2 font-display text-3xl font-bold tracking-tightish tabular-nums text-savr-ink">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="card px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                          List inclusions
                        </p>
                        <p className="mt-2 font-display text-3xl font-bold tabular-nums text-savr-forest">
                          {analytics.listInclusions}
                        </p>
                        <p className="mt-1 text-xs text-savr-mute">
                          Times your priced SKUs appeared on shopping lists
                        </p>
                      </div>
                      <div className="card px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                          Avg basket shown
                        </p>
                        <p className="mt-2 font-display text-3xl font-bold tabular-nums text-savr-ink">
                          {analytics.avgBasketCents
                            ? formatKes(analytics.avgBasketCents)
                            : "—"}
                        </p>
                        <p className="mt-1 text-xs text-savr-mute">
                          Mean total when shoppers saw your store in a rank
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                        Top list SKUs
                      </p>
                      {analytics.topProducts.length === 0 ? (
                        <p className="mt-2 text-sm text-savr-mute">
                          No list activity yet — keep prices fresh so shoppers can add your SKUs.
                        </p>
                      ) : (
                        <ol className="mt-2 divide-y divide-savr-ink/[0.06] card">
                          {analytics.topProducts.map((p, i) => (
                            <li
                              key={`${p.productName}-${i}`}
                              className="flex items-center justify-between gap-3 px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-medium">{p.productName}</p>
                                <p className="text-xs text-savr-mute">{p.brand ?? "Unbranded"}</p>
                              </div>
                              <p className="font-display text-lg font-bold tabular-nums text-savr-forest">
                                {p.inclusions}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="border border-dashed border-savr-forest/35 bg-white px-4 py-6 text-sm text-savr-mute">
                    Analytics unlock after shoppers lock in basket compares that include your store.
                  </p>
                )}

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

                <div className="grid gap-4 card p-4 sm:grid-cols-2 sm:p-5">
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                    Partner promos
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tightish">
                    Promotions · {selected.name}
                  </h2>
                  <p className="mt-1 text-sm text-savr-mute">
                    Create offers for your store — title, discount, product or category, end date.
                  </p>
                </div>

                <div className="grid gap-4 card p-4 sm:grid-cols-2 sm:p-5">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Title
                    </span>
                    <input
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                      className="field mt-1.5"
                      placeholder="Weekend pasta deal"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Discount %
                    </span>
                    <input
                      value={promoPercent}
                      onChange={(e) => setPromoPercent(e.target.value)}
                      className="field mt-1.5"
                      inputMode="decimal"
                      placeholder="10"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Flat off (KES)
                    </span>
                    <input
                      value={promoFlatKes}
                      onChange={(e) => setPromoFlatKes(e.target.value)}
                      className="field mt-1.5"
                      inputMode="numeric"
                      placeholder="50"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Product
                    </span>
                    <select
                      value={promoProductId}
                      onChange={(e) => setPromoProductId(e.target.value)}
                      className="field mt-1.5"
                    >
                      <option value="">All catalog</option>
                      {catalogProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.brand ? ` · ${p.brand}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Category
                    </span>
                    <select
                      value={promoCategory}
                      onChange={(e) => setPromoCategory(e.target.value)}
                      className="field mt-1.5"
                    >
                      <option value="">Any</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Ends
                    </span>
                    <input
                      type="date"
                      value={promoEndsAt}
                      onChange={(e) => setPromoEndsAt(e.target.value)}
                      className="field mt-1.5"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={busy || !promoTitle.trim()}
                      onClick={onCreatePromo}
                      className="btn-primary disabled:opacity-50"
                    >
                      {busy ? "Saving…" : "Create promotion"}
                    </button>
                  </div>
                </div>

                <ul className="divide-y divide-savr-ink/[0.06] card">
                  {promotions.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {p.title}
                          {!p.isActive ? (
                            <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-savr-mute">
                              inactive
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-savr-mute">
                          {[
                            p.discountPercent != null ? `${p.discountPercent}%` : null,
                            p.flatCents != null
                              ? `KES ${Math.round(p.flatCents / 100)} off`
                              : null,
                            p.category ? `Category: ${p.category}` : null,
                            p.productName ?? "All catalog",
                            p.endsAt
                              ? `ends ${new Date(p.endsAt).toLocaleDateString("en-KE")}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      {p.isActive ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDeactivatePromo(p.id)}
                          className="btn-dark px-3 py-2 text-xs disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      ) : null}
                    </li>
                  ))}
                  {promotions.length === 0 && (
                    <li className="px-4 py-8 text-center text-sm text-savr-mute">
                      No promotions yet — create one above for partner inventory.
                    </li>
                  )}
                </ul>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                    Price desk
                  </p>
                  <p className="mt-1 text-sm text-savr-mute">
                    Price each branch separately — merchant updates raise confidence above catalog
                    seed.
                  </p>
                </div>

                {locations.length > 0 && (
                  <label className="block max-w-md">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Branch
                    </span>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="field mt-1.5"
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                          {l.address ? ` · ${l.address}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="space-y-3 card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-forest">
                    Bulk CSV
                  </p>
                  <p className="text-sm text-savr-mute">
                    Imports apply to the selected branch. Soft-launch: fill Weekly 30 from a shelf
                    walk, then upload. Columns: product_id, sku_name, brand, price_kes (aisle
                    optional).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={downloadWeekly30Template}
                      className="btn-primary text-sm"
                    >
                      Download Weekly 30
                    </button>
                    <button type="button" onClick={downloadCsvTemplate} className="btn-ghost text-sm">
                      Full catalog template
                    </button>
                    <label className="btn-dark cursor-pointer px-4 py-2.5 text-sm">
                      Upload CSV
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => onCsvFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {csvRows.length > 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onConfirmCsv}
                        className="btn-primary disabled:opacity-50"
                      >
                        Confirm {csvRows.filter((r) => !r.error).length} rows
                      </button>
                    )}
                  </div>
                  {csvRows.length > 0 && (
                    <ul className="max-h-48 overflow-auto divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.06] text-sm">
                      {csvRows.slice(0, 40).map((r) => (
                        <li key={r.line} className="flex justify-between gap-2 px-3 py-2">
                          <span>
                            L{r.line} · {r.skuName || r.productId || "—"}
                          </span>
                          <span className={r.error ? "text-red-700" : "text-savr-forest"}>
                            {r.error ?? `KES ${r.priceKes}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid gap-3 border border-savr-ink/[0.08] bg-savr-mist/40 p-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Add SKU
                    </span>
                    <select
                      value={addProductId}
                      onChange={(e) => setAddProductId(e.target.value)}
                      className="field mt-1.5"
                    >
                      <option value="">Choose product…</option>
                      {catalogProducts
                        .filter((p) => !pricedIds.has(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.brand ? ` · ${p.brand}` : ""}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      KES
                    </span>
                    <input
                      value={addPriceKes}
                      onChange={(e) => setAddPriceKes(e.target.value)}
                      className="field mt-1.5"
                      inputMode="decimal"
                      placeholder="0"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !addProductId || !branchId}
                    onClick={onAddSku}
                    className="btn-dark px-4 py-2.5 text-sm disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                <ul className="divide-y divide-savr-ink/[0.06] card">
                  {branchPrices.map((p) => (
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
                  {branchPrices.length === 0 && (
                    <li className="px-4 py-8 text-center text-sm text-savr-mute">
                      No priced SKUs on this branch yet — add from the catalog above.
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
