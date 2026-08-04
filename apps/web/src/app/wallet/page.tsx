"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  loadProfile,
  loadWallet,
  requestRedeem,
  type CompareHistoryItem,
} from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { buildLifetimeShare, sharePayload } from "@/lib/share";
import { track } from "@/lib/track";

type LedgerRow = {
  note: string | null;
  amountCents: number;
  when: string;
  entryType: string;
};

type RedeemRow = {
  id: string;
  amountCents: number;
  status: string;
  when: string;
  phone: string | null;
  dryRun?: boolean;
};

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const [balanceCents, setBalanceCents] = useState(0);
  const [lifetimeSavingsCents, setLifetimeSavingsCents] = useState(0);
  const [lifetimeMissedCents, setLifetimeMissedCents] = useState(0);
  const [receiptCount, setReceiptCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [history, setHistory] = useState<CompareHistoryItem[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [pendingRedeems, setPendingRedeems] = useState<RedeemRow[]>([]);
  const [phone, setPhone] = useState("");
  const [amountKes, setAmountKes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const w = await loadWallet();
    setBalanceCents(w.balanceCents);
    setLifetimeSavingsCents(w.lifetimeSavingsCents);
    setLifetimeMissedCents(w.lifetimeMissedCents ?? 0);
    setReceiptCount(w.receiptCount ?? 0);
    setCompareCount(w.compareCount);
    setHistory(w.history);
    setLedger(w.ledger);
    setPendingRedeems(w.pendingRedeems);
    setError(w.error === "signed_out" ? "signed_out" : w.error ?? null);
    if (w.balanceCents > 0) {
      setAmountKes(String(Math.round(w.balanceCents / 100)));
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError("signed_out");
      return;
    }
    Promise.all([refresh(), loadProfile()]).then(([, profile]) => {
      if (!("error" in profile) && profile.phone) setPhone(profile.phone);
      setLoading(false);
    });
  }, [user, authLoading, refresh]);

  async function onRedeem() {
    const kes = Number(amountKes);
    if (!Number.isFinite(kes) || kes < 50) {
      setStatus("Minimum redeem is KES 50.");
      return;
    }
    const cents = Math.round(kes * 100);
    if (cents > balanceCents) {
      setStatus("Amount is higher than your available cashback.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const res = await requestRedeem({ amountCents: cents, phone });
    setBusy(false);
    if ("error" in res) {
      setStatus(res.error);
      return;
    }
    setStatus(
      "Redeem requested — queued for payout. Live M-Pesa is still dry-run until we flip it on.",
    );
    track("redeem_request", { amountKes: Math.round(cents / 100) });
    await refresh();
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

  if (error === "signed_out" || !user) {
    return (
      <PageFrame>
        <PageHero
          theme="wallet"
          title="Saved with Savr"
          subtitle="Sign in to track lifetime savings and cashback from smarter choices."
        />
        <div className="page-band">
          <PageShell>
            <EmptyState
              title="Your streak lives here"
              body="Every time you lock the recommended basket, lifetime savings and wallet cashback add up."
              action={
                <Link href="/login?next=/wallet" className="btn-primary">
                  Sign in
                </Link>
              }
            />
          </PageShell>
        </div>
      </PageFrame>
    );
  }

  const pendingTotal = pendingRedeems
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amountCents, 0);

  return (
    <PageFrame>
      <PageHero
        theme="wallet"
        title="Saved with Savr"
        subtitle={
          compareCount > 0
            ? `${compareCount} smart shop${compareCount === 1 ? "" : "s"} · cashback ready to use`
            : "Every smarter basket adds up here."
        }
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            <div className="savings-moment animate-rise relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,197,24,0.55),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(14,159,95,0.4),transparent_50%)]" />
              <div className="relative space-y-4 px-6 py-8 md:px-8 md:py-10">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-savr-ink/70">
                    Lifetime price savings
                  </p>
                  <p className="mt-2 font-display text-6xl font-extrabold tracking-tightish tabular-nums text-savr-ink md:text-7xl">
                    {formatKes(lifetimeSavingsCents)}
                  </p>
                  <p className="mt-3 max-w-sm text-[15px] font-medium text-savr-ink/75">
                    What you kept vs the priciest basket each time you locked in a choice.
                  </p>
                </div>
                {lifetimeSavingsCents > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="btn-dark px-4 py-2.5 text-sm"
                      onClick={async () => {
                        const result = await sharePayload(
                          buildLifetimeShare(lifetimeSavingsCents),
                        );
                        if (result === "shared") setShareStatus("Shared");
                        else if (result === "copied") setShareStatus("Link copied");
                      }}
                    >
                      Share my streak
                    </button>
                    {shareStatus && (
                      <span className="text-sm font-semibold text-savr-ink/70">{shareStatus}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="animate-rise relative overflow-hidden rounded-card-lg bg-gradient-to-br from-savr-forest to-[#009624] px-5 py-6 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,197,24,0.35),transparent_55%)]" />
                <div className="relative">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                    Wallet cashback
                  </p>
                  <p className="mt-2 font-display text-4xl font-bold tracking-tightish tabular-nums text-savr-signal">
                    {formatKes(balanceCents)}
                  </p>
                  <p className="mt-2 text-xs text-white/55">
                    Earned by locking Savr&apos;s recommended store
                  </p>
                </div>
              </div>
              <div
                className="animate-rise card px-5 py-6"
                style={{ animationDelay: "0.06s" }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                  Left on the table
                </p>
                <p className="mt-2 font-display text-4xl font-bold tracking-tightish tabular-nums text-amber-800">
                  {formatKes(lifetimeMissedCents)}
                </p>
                <p className="mt-2 text-xs text-savr-mute">
                  {receiptCount > 0
                    ? `From ${receiptCount} logged shop${receiptCount === 1 ? "" : "s"} — verified miss, not a guess`
                    : "Log a shop on Check to measure what you left behind"}
                </p>
                <Link
                  href="/check"
                  className="mt-3 inline-block text-xs font-semibold text-savr-forest hover:underline"
                >
                  Log a shop →
                </Link>
              </div>
            </div>

            {pendingTotal > 0 && (
              <div className="card px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                  Redeem in progress
                </p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums text-savr-ink">
                  {formatKes(pendingTotal)}
                </p>
              </div>
            )}

            <section className="card space-y-4 bg-gradient-to-br from-white to-savr-mist/40 p-5 sm:p-6">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tightish">Redeem cashback</h2>
                <p className="mt-1 text-sm text-savr-mute">
                  Request a payout to your phone. Minimum redeem is KES 50. Payouts stay dry-run
                  until live M-Pesa is enabled — no money moves yet.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                    Amount (KES)
                  </span>
                  <input
                    value={amountKes}
                    onChange={(e) => setAmountKes(e.target.value)}
                    className="field mt-1.5"
                    inputMode="numeric"
                    disabled={balanceCents < 5000}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-savr-mute">
                    M-Pesa phone
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="field mt-1.5"
                    placeholder="07…"
                    inputMode="tel"
                    disabled={balanceCents < 5000}
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={busy || balanceCents < 5000}
                onClick={onRedeem}
                className="btn-primary disabled:opacity-50"
              >
                {busy ? "Requesting…" : "Request redeem"}
              </button>
              {balanceCents < 5000 && (
                <p className="text-xs text-savr-mute">
                  Earn at least KES 50 by locking recommended baskets (not just any store).
                </p>
              )}
              {status && <p className="text-sm font-semibold text-savr-forest">{status}</p>}
            </section>

            {pendingRedeems.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold tracking-tightish">Redeem requests</h2>
                <ul className="mt-3 divide-y divide-savr-ink/[0.06] card">
                  {pendingRedeems.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 px-4 py-3.5"
                    >
                      <div>
                        <p className="text-[15px] font-medium">{formatKes(r.amountCents)}</p>
                        <p className="text-xs text-savr-mute">
                          {r.when}
                          {r.phone ? ` · ${r.phone}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          r.status === "pending" ? "text-savr-forest" : "text-savr-mute"
                        }`}
                      >
                        {r.status === "pending"
                          ? "In progress"
                          : r.dryRun
                            ? "Simulated"
                            : r.status === "paid"
                              ? "Paid"
                              : r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="animate-rise-delay">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-bold tracking-tightish">Shopping history</h2>
                <div className="flex gap-3">
                  <Link href="/check" className="text-sm font-semibold text-savr-mute hover:text-savr-forest hover:underline">
                    Could have saved?
                  </Link>
                  <Link href="/basket" className="text-sm font-semibold text-savr-forest hover:underline">
                    New compare →
                  </Link>
                </div>
              </div>
              {history.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Nothing on the streak yet"
                    body="Compare a basket and choose a store — your saves land here."
                    action={
                      <Link href="/basket" className="btn-primary">
                        Compare a basket
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ol className="mt-3 space-y-3">
                  {history.map((item, i) => (
                    <li
                      key={item.id}
                      className={`animate-rise relative overflow-hidden ${
                        item.followedAdvice ? "card-winner" : "card"
                      }`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {item.followedAdvice && (
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-savr-forest" />
                      )}
                      <div className="px-4 py-4 sm:px-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={`font-display text-xl font-bold tracking-tightish ${
                                item.followedAdvice ? "text-savr-ink" : "text-savr-ink"
                              }`}
                            >
                              {item.chosenMerchant}
                            </p>
                            <p
                              className={`mt-0.5 text-xs font-semibold ${
                                item.followedAdvice ? "text-savr-forest" : "text-savr-mute"
                              }`}
                            >
                              {item.followedAdvice
                                ? "Followed Savr pick"
                                : `Savr suggested ${item.recommendedMerchant}`}
                              <span className="mx-1.5 opacity-40">·</span>
                              {item.when}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-display text-xl font-bold tabular-nums ${
                                "text-savr-forest"
                              }`}
                            >
                              {formatKes(item.savingsCents)}
                            </p>
                            <p
                              className={`text-xs ${
                                "text-savr-mute"
                              }`}
                            >
                              saved
                              {item.cashbackCents > 0
                                ? ` · +${formatKes(item.cashbackCents)} CB`
                                : ""}
                            </p>
                          </div>
                        </div>
                        {item.listId ? (
                          <div className="mt-3">
                            <Link
                              href={`/basket?saved=${item.listId}`}
                              className={`inline-flex text-sm font-semibold ${
                                item.followedAdvice
                                  ? "text-savr-signal hover:underline"
                                  : "text-savr-forest hover:underline"
                              }`}
                            >
                              Shop again →
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section>
              <h2 className="font-display text-lg font-bold tracking-tightish">Cashback activity</h2>
              {ledger.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    title="No cashback activity"
                    body="Credits appear when you lock in a recommended basket."
                  />
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-savr-ink/[0.06] card">
                  {ledger.map((e, i) => {
                    const credit = e.amountCents >= 0;
                    return (
                      <li
                        key={`${e.when}-${i}`}
                        className="flex items-center justify-between gap-3 px-4 py-4"
                      >
                        <div>
                          <p className="text-[15px] font-medium">{e.note ?? "Cashback"}</p>
                          <p className="text-xs text-savr-mute">{e.when}</p>
                        </div>
                        <p
                          className={`font-display text-xl font-bold tabular-nums ${
                            credit ? "text-savr-forest" : "text-savr-ink"
                          }`}
                        >
                          {credit ? "+" : "−"}
                          {formatKes(Math.abs(e.amountCents))}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
