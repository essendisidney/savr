"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { LoadingBlock } from "@/components/LoadingBlock";
import { EmptyState } from "@/components/EmptyState";
import { askQuote } from "@/lib/intents";
import {
  MARKET_COUNTRIES,
  formatMarketMoney,
  formatObservedAge,
  isMarketCountry,
  type MarketCountry,
  type MarketListing,
  type MarketSearchResult,
  type MarketSourceNote,
} from "@/lib/crawlers/types";
import { track } from "@/lib/track";
import { useAuth } from "@/lib/auth";
import { watchMarketListing } from "@/lib/actions";
import { buildMarketBoardShare, buildMarketDealShare, whatsAppShareUrl } from "@/lib/share";

export default function MarketPage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <div className="h-28 animate-pulse bg-savr-fog/80" />
          <PageShell>
            <LoadingBlock rows={4} />
          </PageShell>
        </PageFrame>
      }
    >
      <MarketInner />
    </Suspense>
  );
}

function MarketInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const askText = (searchParams.get("ask") ?? "").trim();
  const qParam = (searchParams.get("q") ?? askText).trim();
  const countryParam = searchParams.get("country");
  const [country, setCountryState] = useState<MarketCountry>(
    isMarketCountry(countryParam) ? countryParam : "ke",
  );
  const [query, setQuery] = useState(qParam);
  const [data, setData] = useState<MarketSearchResult | null>(null);
  const [loading, setLoading] = useState(Boolean(qParam));
  const [error, setError] = useState<string | null>(null);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    if (isMarketCountry(countryParam)) {
      setCountryState(countryParam);
      return;
    }
    void fetch("/api/geo")
      .then((r) => r.json())
      .then((d: { country?: string }) => {
        if (isMarketCountry(d.country)) setCountryState(d.country);
      })
      .catch(() => {
        /* stay Kenya */
      });
  }, [countryParam]);

  const fetchListings = useCallback(async (q: string, c: MarketCountry) => {
    if (!q.trim()) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/market/search?q=${encodeURIComponent(q.trim())}&country=${c}`,
        { cache: "no-store" },
      );
      const body = (await res.json()) as MarketSearchResult & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Search failed");
        setData(null);
        return;
      }
      setData(body);
      track("market_search", { q: q.trim().slice(0, 80), country: c, n: body.listings.length });
    } catch {
      setError("Network error — try again");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchListings(qParam, country);
  }, [qParam, country, fetchListings]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = query.trim();
    if (!next) return;
    const params = new URLSearchParams();
    params.set("q", next);
    params.set("country", country);
    if (askText) params.set("ask", askText);
    router.push(`/market?${params.toString()}`);
  }

  function pickCountry(id: MarketCountry) {
    const q = (query.trim() || qParam).trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("country", id);
    if (askText) params.set("ask", askText);
    router.push(`/market?${params.toString()}`);
  }

  const cheapest = data?.listings[0] ?? null;
  const okSources = data?.sources.filter((s) => s.status === "ok") ?? [];
  const blocked = data?.sources.filter((s) => s.status === "blocked") ?? [];

  return (
    <PageFrame>
      <PageHero
        theme="market"
        title={
          qParam
            ? cheapest
              ? `Cheapest live: ${formatMarketMoney(cheapest.priceCents, cheapest.currency)}`
              : "Live cheapest listings"
            : "Cheapest live listings"
        }
        subtitle={
          askText
            ? `For “${askQuote(askText)}” — public shop pages, ranked by listed price. Confirm at checkout.`
            : "Ask Savr anything to buy. We crawl public Jumia (and Kilimall in Kenya) pages — Savr is not the seller."
        }
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-6">
            <p className="rounded-2xl border border-savr-forest/20 bg-savr-forest/[0.06] px-4 py-3 text-sm text-savr-ink">
              Live public crawl · last listed time on each row. Confirm price and stock on the shop
              site. Savr is not the seller and does not pay a price-match bonus.
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="market-q">
                What to buy
              </label>
              <input
                id="market-q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="iPhone 13, Samsung A15, rice cooker…"
                className="field flex-1"
                autoComplete="off"
              />
              <button type="submit" className="btn-primary shrink-0" disabled={loading}>
                {loading ? "Searching…" : "Find cheapest"}
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {MARKET_COUNTRIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCountry(c.id)}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    country === c.id
                      ? "bg-savr-forest text-white"
                      : "bg-white text-savr-mute ring-1 ring-savr-ink/10 hover:text-savr-ink"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {data?.spread && data.spread.saveCents > 0 && cheapest && (
              <div className="flex flex-col gap-3 rounded-2xl border border-savr-ink/10 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-savr-ink">
                  Cheapest listed at{" "}
                  <span className="font-semibold">{data.spread.cheapestShop}</span>
                  {" · "}
                  {formatMarketMoney(cheapest.priceCents, cheapest.currency)}. Spread vs{" "}
                  {data.spread.priciestShop} in this crawl is{" "}
                  <span className="font-semibold text-savr-forest">
                    {formatMarketMoney(data.spread.saveCents, cheapest.currency)}
                  </span>
                  . Confirm at checkout — not a guaranteed save.
                </p>
                <a
                  href={whatsAppShareUrl(
                    buildMarketBoardShare({
                      query: qParam,
                      shop: cheapest.shop,
                      priceLabel: formatMarketMoney(cheapest.priceCents, cheapest.currency),
                      spreadLabel: formatMarketMoney(data.spread.saveCents, cheapest.currency),
                      path: `/market?q=${encodeURIComponent(qParam)}&country=${country}`,
                    }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("share_save", { via: "whatsapp_market_board", q: qParam.slice(0, 80) })}
                  className="btn-ghost shrink-0 py-2 text-sm"
                >
                  WhatsApp this find
                </a>
              </div>
            )}

            {data && (
              <p className="text-xs text-savr-mute">
                {okSources.length
                  ? `Live from ${okSources.map((s) => s.shop).join(", ")}.`
                  : "No shop returned listings this round."}{" "}
                {blocked.length
                  ? `Skipped: ${blocked.map((s) => `${s.shop} (${sourceHint(s)})`).join(" · ")}.`
                  : null}
                {data.board === "stored" ? " Showing this morning’s stored board." : null}
                {data.board === "mixed" ? " Mixed with this morning’s stored board." : null}
              </p>
            )}

            {error && <p className="text-sm font-semibold text-amber-800">{error}</p>}

            {loading && <LoadingBlock rows={4} />}

            {!loading && qParam && data && data.listings.length === 0 && (
              <EmptyState
                title="No live listings yet"
                body="Shops may have blocked this request, or the query is too specific. Try a shorter name, or compare Nairobi groceries if this is a staple."
                action={
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/prices?q=${encodeURIComponent(qParam)}`} className="btn-ghost">
                      Nairobi shelves
                    </Link>
                    <Link href="/basket?staples=1" className="btn-primary">
                      Weekly groceries
                    </Link>
                  </div>
                }
              />
            )}

            {!loading && data && data.listings.length > 0 && (
              <div className="space-y-3">
                {cheapest && !(data.spread && data.spread.saveCents > 0) ? (
                  <a
                    href={whatsAppShareUrl(
                      buildMarketBoardShare({
                        query: qParam,
                        shop: cheapest.shop,
                        priceLabel: formatMarketMoney(cheapest.priceCents, cheapest.currency),
                        spreadLabel: null,
                        path: `/market?q=${encodeURIComponent(qParam)}&country=${country}`,
                      }),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      track("share_save", { via: "whatsapp_market_board", q: qParam.slice(0, 80) })
                    }
                    className="btn-ghost inline-flex py-2 text-sm"
                  >
                    WhatsApp this find
                  </a>
                ) : null}
                <ol className="divide-y divide-savr-ink/[0.06] overflow-hidden rounded-2xl border border-savr-ink/[0.08] bg-white">
                  {data.listings.map((row, i) => (
                    <li key={row.id}>
                      <ListingRow
                        row={row}
                        rank={i + 1}
                        cheapest={i === 0}
                        boardPath={`/market?q=${encodeURIComponent(qParam)}&country=${country}`}
                        signedIn={Boolean(user)}
                        watching={watched.has(row.url)}
                        onWatch={async () => {
                          const res = await watchMarketListing({
                            url: row.url,
                            name: row.name,
                            shop: row.shop,
                            baselineCents: row.priceCents,
                          });
                          if ("error" in res) {
                            setError(res.error);
                            return;
                          }
                          setWatched((prev) => new Set(prev).add(row.url));
                          track("market_watch", { shop: row.shop });
                        }}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {!qParam && !loading && (
              <EmptyState
                title="Ask what you want to buy"
                body="Phones, appliances, fashion — Savr ranks live public listings. Weekly food still lives on Nairobi shelves."
              />
            )}
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}

function sourceHint(s: MarketSourceNote): string {
  if (s.status === "blocked") return "blocked";
  if (s.status === "empty") return "no match";
  return "ok";
}

function ListingRow({
  row,
  rank,
  cheapest,
  boardPath,
  signedIn,
  watching,
  onWatch,
}: {
  row: MarketListing;
  rank: number;
  cheapest: boolean;
  boardPath: string;
  signedIn: boolean;
  watching: boolean;
  onWatch: () => void;
}) {
  const priceLabel = formatMarketMoney(row.priceCents, row.currency);
  const share = buildMarketDealShare({
    name: row.name,
    shop: row.shop,
    priceLabel,
    path: boardPath,
  });
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
          #{rank} · {row.shop}
          {cheapest ? " · cheapest listed" : ""}
        </p>
        <p className="mt-0.5 font-semibold text-savr-ink">{row.name}</p>
        <p className="text-xs text-savr-mute">
          Last listed {formatObservedAge(row.observedAt)} · confirm at checkout — not a Savr
          guarantee
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-lg font-bold tabular-nums text-savr-forest">
          {priceLabel}
        </p>
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-savr-ink hover:text-savr-forest"
        >
          Open listing →
        </a>
        <a
          href={whatsAppShareUrl(share)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("share_save", { via: "whatsapp_market_deal", shop: row.shop })}
          className="mt-1.5 block text-[11px] font-semibold text-savr-forest"
        >
          WhatsApp this
        </a>
        {signedIn ? (
          <button
            type="button"
            onClick={() => void onWatch()}
            disabled={watching}
            className="mt-2 block w-full text-[11px] font-semibold text-savr-forest disabled:text-savr-mute"
          >
            {watching ? "Watching" : "Watch for drop"}
          </button>
        ) : (
          <Link href="/login?next=/market" className="mt-2 block text-[11px] font-semibold text-savr-mute">
            Sign in to watch
          </Link>
        )}
      </div>
    </div>
  );
}
