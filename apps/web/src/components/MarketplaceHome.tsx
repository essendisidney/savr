"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import { loadLiveListings } from "@/lib/marketplace-actions";
import type { MarketplaceListing } from "@/lib/marketplace";

export function MarketplaceHome() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void loadLiveListings(24).then((rows) => {
      setListings(rows);
      setReady(true);
    });
  }, []);

  return (
    <div className="home-stage relative min-h-[calc(100svh-3.5rem)] overflow-hidden">
      <div className="home-stage-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 mx-auto flex max-w-lg flex-col px-4 pb-28 pt-8 md:max-w-3xl md:px-6 md:pt-12">
        <p className="home-eyebrow">Kenya</p>
        <h1 className="home-hello mt-2">Sell. Buy. Trust.</h1>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-savr-mute md:text-base">
          Second-hand deals with escrow — money held until you confirm.
        </p>

        <div className="mt-6 grid gap-3">
          <Link href="/sell" className="btn-primary flex min-h-[3.5rem] items-center justify-center text-base">
            Sell something · 60 seconds
          </Link>
          <Link href="/search" className="btn-ghost flex min-h-[3.25rem] items-center justify-center text-[15px]">
            Find a deal
          </Link>
        </div>

        <p className="mt-4 rounded-2xl border border-savr-forest/20 bg-savr-forest/[0.06] px-4 py-3 text-sm text-savr-ink">
          Your money is safe — held in escrow until the buyer confirms.
        </p>

        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <p className="page-eyebrow">Live listings</p>
            <Link href="/search" className="text-xs font-semibold text-savr-forest hover:underline">
              Search →
            </Link>
          </div>
          {!ready ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
