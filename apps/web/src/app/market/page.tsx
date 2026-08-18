"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { LoadingBlock } from "@/components/LoadingBlock";
import { EmptyState } from "@/components/EmptyState";
import { askQuote } from "@/lib/intents";
import {
  formatMarketMoney,
  formatObservedAge,
  type MarketListing,
  type MarketSearchResult,
  type MarketSourceNote,
} from "@/lib/crawlers/types";
import { track } from "@/lib/track";
import { useAuth } from "@/lib/auth";
import { watchMarketListing } from "@/lib/actions";
import { HaggleFacts } from "@/components/HaggleFacts";
import { buildMarketBoardShare, buildMarketDealShare, whatsAppShareUrl } from "@/lib/share";
import { KenyaStoreStrip } from "@/components/KenyaStoreStrip";
import { KENYA_MARKET_STARTERS } from "@/lib/kenya-life";

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
  const [query, setQuery] = useState(qParam);
  const [data, setData] = useState<MarketSearchResult | null>(null);
  const [loading, setLoading] = useState(Boolean(qParam));
  const [error, setError] = useState<string | null>(null);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [shopFilter, setShopFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    setQuery(qParam);
    setShopFilter("all");
  }, [qParam]);

  const fetchListings = useCallback(async (q: string) => {
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
        `/api/market/search?q=${encodeURIComponent(q.trim())}`,
        { cache: "no-store" },
      );
      const body = (await res.json()) as MarketSearchResult & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Search failed");
        setData(null);
        return;
      }
      setData(body);
      track("market_search", { q: q.trim().slice(0, 80), country: "ke", n: body.listings.length });
    } catch {
      setError("Network error — try again");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchListings(qParam);
  }, [qParam, fetchListings]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = query.trim();
    if (!next) return;
    const params = new URLSearchParams();
    params.set("q", next);
    if (askText) params.set("ask", askText);
    router.push(`/market?${params.toString()}`);
  }

  const cheapest = data?.listings[0] ?? null;
  const priciest =
    data && data.listings.length > 1 ? data.listings[data.listings.length - 1] : null;
  const okSources = data?.sources.filter((s) => s.status === "ok") ?? [];
  const blocked = data?.sources.filter((s) => s.status === "blocked") ?? [];
  const shopsInBoard = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of data?.listings ?? []) {
      if (!seen.has(row.shopId)) seen.set(row.shopId, row.shop);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [data]);
  const displayListings = useMemo(() => {
    if (!data) return [];
    if (shopFilter === "all") return data.listings;
    return data.listings.filter((row) => row.shopId === shopFilter);
  }, [data, shopFilter]);

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
            : "Kenya shops — Jumia, Kilimall, Carrefour.ke, Naivas.online, Jiji. Listed prices only. Confirm at checkout. Savr is not the seller."
        }
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-6">
            <p className="rounded-2xl border border-savr-forest/20 bg-savr-forest/[0.06] px-4 py-3 text-sm text-savr-ink">
              Kenya live crawl · last listed time on each row. Confirm price and stock on the shop
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
                placeholder="Unga, Kabras, iPhone 13…"
                className="field flex-1"
                autoComplete="off"
              />
              <button type="submit" className="btn-primary shrink-0" disabled={loading}>
                {loading ? "Searching…" : "Find cheapest"}
              </button>
            </form>

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
                      path: `/market?q=${encodeURIComponent(qParam)}`,
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

            {!loading && cheapest && qParam && (
              <HaggleFacts
                itemName={cheapest.name}
                listedLabel={`${formatMarketMoney(cheapest.priceCents, cheapest.currency)} at ${cheapest.shop}`}
                highLabel={
                  priciest && data?.spread && data.spread.saveCents > 0
                    ? `${formatMarketMoney(priciest.priceCents, priciest.currency)} at ${priciest.shop}`
                    : null
                }
                path={`/market?q=${encodeURIComponent(qParam)}`}
              />
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
                body="Kenya shops may have blocked this request, or the query is too specific. Try a shorter name, or compare Nairobi groceries if this is a staple."
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

            {!loading && data && data.listings.length > 0 && shopsInBoard.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={shopFilter === "all" ? "chip-active" : "chip"}
                  onClick={() => setShopFilter("all")}
                >
                  All shops
                </button>
                {shopsInBoard.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    className={shopFilter === shop.id ? "chip-active" : "chip"}
                    onClick={() => setShopFilter(shop.id)}
                  >
                    {shop.name}
                  </button>
                ))}
              </div>
            )}

            {!loading && data && data.listings.length > 0 && displayListings.length === 0 && (
              <EmptyState
                title="This shop had no row in this crawl"
                body="Clear the shop filter to see every Kenya listing we got this round."
                action={
                  <button type="button" className="btn-ghost" onClick={() => setShopFilter("all")}>
                    Show all shops
                  </button>
                }
              />
            )}

            {!loading && data && displayListings.length > 0 && (
              <div className="space-y-3">
                {cheapest && !(data.spread && data.spread.saveCents > 0) ? (
                  <a
                    href={whatsAppShareUrl(
                      buildMarketBoardShare({
                        query: qParam,
                        shop: cheapest.shop,
                        priceLabel: formatMarketMoney(cheapest.priceCents, cheapest.currency),
                        spreadLabel: null,
                        path: `/market?q=${encodeURIComponent(qParam)}`,
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
                  {displayListings.map((row, i) => (
                    <li key={row.id}>
                      <ListingRow
                        row={row}
                        rank={i + 1}
                        cheapest={i === 0}
                        boardPath={`/market?q=${encodeURIComponent(qParam)}`}
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
              <div className="space-y-5">
                <KenyaStoreStrip note />
                <EmptyState
                  title="Ask what you want to buy"
                  body="Phones, appliances, unga — Savr ranks live Kenya listings. Weekly food still lives on supermarket shelves."
                  action={
                    <div className="flex flex-wrap gap-2">
                      {KENYA_MARKET_STARTERS.map((ask) => (
                        <Link
                          key={ask.q}
                          href={`/market?q=${encodeURIComponent(ask.q)}`}
                          className="home-chip"
                        >
                          {ask.label}
                        </Link>
                      ))}
                    </div>
                  }
                />
              </div>
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
