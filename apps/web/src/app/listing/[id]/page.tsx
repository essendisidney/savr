"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PageFrame, PageShell } from "@/components/PageShell";
import { LoadingBlock } from "@/components/LoadingBlock";
import { useAuth } from "@/lib/auth";
import {
  buildListingShare,
  formatKes,
  feeCentsFor,
  formatSellerRating,
  isBoosted,
  whatsAppShareUrl,
  type MarketplaceListing,
} from "@/lib/marketplace";
import { loadListing, startDeal } from "@/lib/marketplace-actions";

function ListingInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id ?? "");
  const posted = searchParams.get("posted") === "1";
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDemo = id.startsWith("demo-");

  useEffect(() => {
    if (!id) return;
    void loadListing(id).then((row) => {
      setListing(row);
      setLoading(false);
    });
  }, [id]);

  async function onBuy() {
    setError(null);
    if (isDemo) {
      setError("Sample listing — post yours to sell for real.");
      return;
    }
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/listing/${id}`)}`);
      return;
    }
    setBusy(true);
    const res = await startDeal(id);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.push(`/deals/${res.dealId}`);
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

  if (!listing) {
    return (
      <PageFrame>
        <PageShell narrow>
          <h1 className="page-title text-2xl">Listing gone</h1>
          <p className="mt-2 text-sm text-savr-mute">It may have sold or been removed.</p>
          <Link href="/search" className="btn-primary mt-6 inline-flex">
            Find a deal
          </Link>
        </PageShell>
      </PageFrame>
    );
  }

  const fee = feeCentsFor(listing.priceCents);
  const share = buildListingShare({
    id: listing.id,
    title: listing.title,
    priceCents: listing.priceCents,
  });
  const rating = formatSellerRating(listing);

  return (
    <PageFrame>
      <div className="mx-auto max-w-lg md:max-w-2xl">
        <div className="aspect-[4/3] bg-savr-fog">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
      </div>
      <PageShell narrow>
        {posted && !isDemo ? (
          <div className="mb-4 rounded-2xl border border-savr-forest/25 bg-savr-forest/[0.08] px-4 py-3 text-sm text-savr-ink">
            <p className="font-semibold text-savr-forest">You’re live</p>
            <p className="mt-1 text-savr-mute">Share on WhatsApp so buyers can find it.</p>
          </div>
        ) : null}

        {isDemo ? (
          <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Sample listing — post yours to sell with real escrow.
          </div>
        ) : null}

        <p className="font-display text-3xl font-extrabold tabular-nums tracking-tightish text-savr-forest">
          {formatKes(listing.priceCents)}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightish text-savr-ink">
          {listing.title}
        </h1>
        <p className="mt-2 text-sm text-savr-mute">
          {listing.city}
          {listing.sellerName ? ` · ${listing.sellerName}` : ""}
          {listing.verified ? " · Verified" : ""}
          {isBoosted(listing) ? " · Boosted" : ""}
          {rating ? ` · ★ ${rating}` : ""}
        </p>

        <div className="mt-5 rounded-2xl border border-savr-forest/20 bg-savr-forest/[0.06] px-4 py-3 text-sm text-savr-ink">
          Buy with M-Pesa escrow. Savr holds {formatKes(listing.priceCents)} until you confirm.
          Platform fee {formatKes(fee)} (3%) when released to the seller.
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-amber-800">{error}</p>}

        {posted && !isDemo ? (
          <a
            href={whatsAppShareUrl(share)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-6 flex w-full items-center justify-center"
          >
            Share on WhatsApp
          </a>
        ) : (
          <button
            type="button"
            onClick={() => void onBuy()}
            disabled={busy || listing.status !== "live" || isDemo}
            className="btn-primary mt-6 w-full disabled:opacity-60"
          >
            {isDemo ? "Sample — can’t buy" : busy ? "Starting…" : "Buy with M-Pesa (escrow)"}
          </button>
        )}

        {!posted || isDemo ? (
          <a
            href={whatsAppShareUrl(share)}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost mt-3 flex w-full items-center justify-center"
          >
            Share on WhatsApp
          </a>
        ) : (
          <button
            type="button"
            onClick={() => void onBuy()}
            disabled={busy || listing.status !== "live"}
            className="btn-ghost mt-3 w-full disabled:opacity-60"
          >
            {busy ? "Starting…" : "Buy with M-Pesa (escrow)"}
          </button>
        )}

        {isDemo ? (
          <Link href="/sell" className="btn-ghost mt-3 flex w-full items-center justify-center">
            Sell something · 60 seconds
          </Link>
        ) : null}

        <Link href="/search" className="mt-3 block text-center text-sm font-semibold text-savr-mute">
          Back to search
        </Link>
      </PageShell>
    </PageFrame>
  );
}

export default function ListingDetailPage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <PageShell>
            <LoadingBlock rows={4} />
          </PageShell>
        </PageFrame>
      }
    >
      <ListingInner />
    </Suspense>
  );
}
