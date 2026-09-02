"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageFrame, PageShell } from "@/components/PageShell";
import { LoadingBlock } from "@/components/LoadingBlock";
import { useAuth } from "@/lib/auth";
import {
  dealStatusLabel,
  feeCentsFor,
  formatKes,
  sellerPayoutCents,
  type MarketplaceDeal,
} from "@/lib/marketplace";
import {
  confirmDealReceived,
  loadDeal,
  payDealWithMpesa,
  rateDeal,
  reportDealProblem,
} from "@/lib/marketplace-actions";

export default function DealPage() {
  const params = useParams();
  const dealId = String(params.id ?? "");
  const { user } = useAuth();
  const [deal, setDeal] = useState<MarketplaceDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState(5);

  async function refresh() {
    const row = await loadDeal(dealId);
    setDeal(row);
    setLoading(false);
  }

  useEffect(() => {
    if (!dealId) return;
    void refresh();
  }, [dealId]);

  async function onPay(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await payDealWithMpesa(dealId, phone);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setStatus(
      res.dryRun
        ? "Dry-run: treated as paid into escrow (no live M-Pesa)."
        : "STK sent — enter PIN on your phone. Funds held in escrow.",
    );
    await refresh();
  }

  async function onConfirm() {
    setError(null);
    setBusy(true);
    const res = await confirmDealReceived(dealId);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setStatus(
      res.dryRun
        ? "Dry-run: seller payout marked released."
        : "Confirmed — seller payout sent via M-Pesa.",
    );
    await refresh();
  }

  async function onReport() {
    setBusy(true);
    const res = await reportDealProblem(dealId);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setStatus("Problem logged — funds stay held. Support will review.");
  }

  async function onRate() {
    if (!deal || !user) return;
    const toId = user.id === deal.buyerId ? deal.sellerId : deal.buyerId;
    setBusy(true);
    const res = await rateDeal({ dealId, toId, stars });
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setStatus("Thanks — rating saved.");
  }

  if (loading) {
    return (
      <PageFrame>
        <PageShell>
          <LoadingBlock rows={4} />
        </PageShell>
      </PageFrame>
    );
  }

  if (!deal) {
    return (
      <PageFrame>
        <PageShell narrow>
          <h1 className="page-title text-2xl">Deal not found</h1>
          <Link href="/account" className="btn-ghost mt-6 inline-flex">
            Back to You
          </Link>
        </PageShell>
      </PageFrame>
    );
  }

  const isBuyer = user?.id === deal.buyerId;
  const fee = deal.feeCents || feeCentsFor(deal.priceCents);
  const payout = sellerPayoutCents(deal.priceCents);

  return (
    <PageFrame>
      <PageShell narrow>
        <p className="page-eyebrow">Deal</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish text-savr-ink">
          {deal.listingTitle}
        </h1>
        <p className="mt-2 text-sm font-semibold text-savr-forest">{dealStatusLabel(deal.status)}</p>
        <p className="mt-1 font-display text-xl font-bold tabular-nums text-savr-ink">
          {formatKes(deal.priceCents)}
        </p>
        <p className="mt-1 text-xs text-savr-mute">
          Fee {formatKes(fee)} · Seller gets {formatKes(payout)} after confirm
        </p>

        <div className="mt-5 rounded-2xl border border-savr-forest/20 bg-savr-forest/[0.06] px-4 py-3 text-sm text-savr-ink">
          Escrow is the trust layer. Money stays held until the buyer confirms — not “deal at your
          own risk.”
        </div>

        {status && <p className="mt-4 text-sm font-semibold text-savr-forest">{status}</p>}
        {error && <p className="mt-4 text-sm font-semibold text-amber-800">{error}</p>}

        {isBuyer && deal.status === "pending_pay" && (
          <form onSubmit={onPay} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                M-Pesa phone
              </span>
              <input
                className="field mt-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                required
              />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Sending…" : "Pay into escrow"}
            </button>
          </form>
        )}

        {isBuyer && deal.status === "in_escrow" && (
          <div className="mt-6 space-y-3">
            <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void onConfirm()}>
              {busy ? "…" : "I received it — release to seller"}
            </button>
            <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => void onReport()}>
              Report a problem
            </button>
          </div>
        )}

        {deal.status === "released" && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-savr-mute">Rate the other party</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  className={`h-10 w-10 rounded-xl text-sm font-bold ${
                    stars >= n ? "bg-savr-forest text-white" : "bg-savr-fog text-savr-mute"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void onRate()}>
              Submit rating
            </button>
          </div>
        )}

        <Link href={`/listing/${deal.listingId}`} className="mt-8 block text-center text-sm font-semibold text-savr-mute">
          View listing
        </Link>
      </PageShell>
    </PageFrame>
  );
}
