"use client";

import Link from "next/link";
import type { MarketplaceListing } from "@/lib/marketplace";
import { formatKes } from "@/lib/marketplace";

export function ListingCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <Link href={`/listing/${listing.id}`} className="group block overflow-hidden rounded-2xl border border-savr-ink/[0.08] bg-white shadow-[0_12px_32px_-28px_rgba(11,18,32,0.45)]">
      <div className="aspect-[4/3] overflow-hidden bg-savr-fog">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-soft group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-savr-mute">No photo</div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="font-display text-[15px] font-bold tabular-nums text-savr-forest">
          {formatKes(listing.priceCents)}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-savr-ink">
          {listing.title}
        </p>
        <p className="mt-1 text-[11px] text-savr-mute">
          {listing.city}
          {listing.verified ? " · Verified seller" : ""}
        </p>
      </div>
    </Link>
  );
}
