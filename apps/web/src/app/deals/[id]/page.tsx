"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageFrame, PageShell } from "@/components/PageShell";
import { LoadingBlock } from "@/components/LoadingBlock";
import { useAuth } from "@/lib/auth";
import {
  buildTrustedSaleShare,
  dealStatusLabel,
  feeCentsFor,
  formatKes,
  sellerPayoutCents,
  whatsAppShareUrl,
  type MarketplaceDeal,
} from "@/lib/marketplace";
import {
  cancelDeal,
  confirmDealReceived,
  dealHasDispute,
  loadDeal,
  loadEscrowEvents,
  loadMyRatingForDeal,
  payDealWithMpesa,
  rateDeal,
  refundDeal,
  reportDealProblem,
} from "@/lib/marketplace-actions";

type TimelineEvent = {
  id: string;
  status: string;
  note: string | null;
  dryRun: boolean;
  createdAt: string;
};

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
  const [myRating, setMyRating] = useState<number | null>(null);
  const [disputed, setDisputed] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  async function refresh() {
    const [row, rating, hasDispute, timeline] = await Promise.all([
      loadDeal(dealId),
      loadMyRatingForDeal(dealId),
      dealHasDispute(dealId),
      loadEscrowEvents(dealId),
    ]);
    setDeal(row);
    setMyRating(rating?.stars ?? null);
    setDisputed(hasDispute);
    setEvents(timeline);
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

  async function onCancel() {
    setError(null);
    setBusy(true);
    const res = await cancelDeal(dealId);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setStatus("Deal cancelled — listing is live again.");
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
    setStatus("Problem logged — funds stay held. You can refund to restore the listing.");
    await refresh();
  }

  async function onRefund() {
    setError(null);
    setBusy(true);
    const res = await refundDeal(dealId);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setStatus(
      res.dryRun
        ? "Dry-run refund — deal closed, listing live again."
        : "Refunded — listing is live again.",
    );
    await refresh();
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
    setMyRating(stars);
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
  const isParty = isBuyer || user?.id === deal.sellerId;
  const fee = deal.feeCents || feeCentsFor(deal.priceCents);
  const payout = sellerPayoutCents(deal.priceCents);
  const share =
    deal.status === "released"
      ? buildTrustedSaleShare({
          title: deal.listingTitle,
          priceCents: deal.priceCents,
          dealId: deal.id,
        })
      : null;

  return (
    <PageFrame>
      <PageShell narrow>
        <p className="page-eyebrow">Deal</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish text-savr-ink">
          {deal.listingTitle}
        </h1>
        <p className="mt-2 text-sm font-semibold text-savr-forest">{dealStatusLabel(deal.status)}</p>
        {disputed && deal.status === "in_escrow" ? (
          <p className="mt-1 text-sm font-semibold text-amber-800">Dispute open — funds held</p>
        ) : null}
        <p className="mt-1 font-display text-xl font-bold tabular-nums text-savr-ink">
          {formatKes(deal.priceCents)}
        </p>
        <p className="mt-1 text-xs text-savr-mute">
          Fee {formatKes(fee)} · Seller gets {formatKes(payout)} after confirm
        </p>

        <div className="mt-5 rounded-2xl border border-savr-forest/20 bg-savr-forest/[0.06] px-4 py-3 text-sm text-savr-ink">
          Escrow is the trust layer. Money stays held until the buyer confirms — or either party
          refunds after a problem.
        </div>

        {events.length > 0 && (
          <ol className="mt-5 space-y-3 border-l border-savr-ink/10 pl-4">
            {events.map((ev) => (
              <li key={ev.id} className="relative text-sm">
                <span className="absolute -left-[1.15rem] top-1.5 h-2 w-2 rounded-full bg-savr-forest" />
                <p className="font-semibold capitalize text-savr-ink">
                  {ev.status.replace(/_/g, " ")}
                  {ev.dryRun ? " · dry-run" : ""}
                </p>
                {ev.note ? <p className="mt-0.5 text-savr-mute">{ev.note}</p> : null}
                <p className="mt-0.5 text-[11px] text-savr-mute">
                  {new Date(ev.createdAt).toLocaleString("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </li>
            ))}
          </ol>
        )}

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
            <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => void onCancel()}>
              Cancel deal
            </button>
            <p className="text-xs text-savr-mute">Unpaid deals auto-cancel after 60 minutes.</p>
          </form>
        )}

        {!isBuyer && isParty && deal.status === "pending_pay" && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-savr-mute">
              Waiting for the buyer to pay. Unpaid deals auto-cancel after 60 minutes.
            </p>
            <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => void onCancel()}>
              Cancel deal
            </button>
          </div>
        )}

        {isBuyer && deal.status === "in_escrow" && (
          <div className="mt-6 space-y-3">
            <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void onConfirm()}>
              {busy ? "…" : "I received it — release to seller"}
            </button>
            <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => void onReport()}>
              Report a problem
            </button>
            <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => void onRefund()}>
              Refund &amp; reopen listing
            </button>
          </div>
        )}

        {!isBuyer && isParty && deal.status === "in_escrow" && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-savr-mute">
              In escrow — you’ll be paid when the buyer confirms. Keep your M-Pesa phone saved on
              You → Profile.
            </p>
            <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => void onReport()}>
              Report a problem
            </button>
            <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => void onRefund()}>
              Agree to refund
            </button>
          </div>
        )}

        {deal.status === "refunded" && (
          <p className="mt-6 text-sm text-savr-mute">This deal was refunded. The listing is live again.</p>
        )}

        {deal.status === "released" && share && (
          <div className="mt-6 space-y-3">
            <a
              href={whatsAppShareUrl(share)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary flex w-full items-center justify-center"
            >
              Share on WhatsApp
            </a>
            {myRating != null ? (
              <p className="text-sm font-semibold text-savr-forest">
                You rated this deal {myRating}/5
              </p>
            ) : (
              <>
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
                <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => void onRate()}>
                  Submit rating
                </button>
              </>
            )}
          </div>
        )}

        <Link href={`/listing/${deal.listingId}`} className="mt-8 block text-center text-sm font-semibold text-savr-mute">
          View listing
        </Link>
      </PageShell>
    </PageFrame>
  );
}
