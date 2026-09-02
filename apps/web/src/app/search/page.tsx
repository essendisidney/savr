"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { ListingCard } from "@/components/ListingCard";
import { LoadingBlock } from "@/components/LoadingBlock";
import { searchListings } from "@/lib/marketplace-actions";
import type { MarketplaceListing } from "@/lib/marketplace";

function SearchInner() {
  const params = useSearchParams();
  const initial = (params.get("q") ?? "").trim();
  const [query, setQuery] = useState(initial);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void searchListings(initial).then((rows) => {
      setListings(rows);
      setLoading(false);
    });
  }, [initial]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = query.trim();
    window.history.replaceState(null, "", next ? `/search?q=${encodeURIComponent(next)}` : "/search");
    setLoading(true);
    void searchListings(next).then((rows) => {
      setListings(rows);
      setLoading(false);
    });
  }

  return (
    <PageFrame>
      <PageHero theme="market" title="Find a deal" subtitle="Search second-hand listings across Kenya." />
      <PageShell>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            className="field flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="iPhone, sofa, dress…"
            autoComplete="off"
          />
          <button type="submit" className="btn-primary shrink-0" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {loading ? (
          <div className="mt-6">
            <LoadingBlock rows={3} />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && (
          <p className="mt-8 text-center text-sm text-savr-mute">No listings match — try a shorter word.</p>
        )}
      </PageShell>
    </PageFrame>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <div className="h-28 animate-pulse bg-savr-fog/80" />
          <PageShell>
            <LoadingBlock rows={3} />
          </PageShell>
        </PageFrame>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
