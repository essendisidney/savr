"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, loadWallet, loadWatchlist } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { loadCatalog, loadFuelStations } from "@/lib/catalog";
import { formatKes } from "@/lib/compare";
import { formatPriceTrend } from "@/lib/freshness";
import {
  ASK_PLACEHOLDERS,
  SPEND_INTENTS,
  routeAskQuery,
  savingsBuys,
} from "@/lib/intents";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(full: string | null | undefined, email: string | null | undefined): string {
  const fromProfile = full?.trim().split(/\s+/)[0];
  if (fromProfile) return fromProfile;
  const local = email?.split("@")[0];
  if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  return "there";
}

function useCountUp(targetCents: number, enabled: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setValue(targetCents);
      return;
    }
    const start = performance.now();
    const duration = 700;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(targetCents * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetCents, enabled]);
  return value;
}

type DropSignal = {
  productName: string;
  merchantName: string;
  label: string;
  href: string;
};

type FuelSignal = {
  stationName: string;
  priceLabel: string;
  href: string;
};

export function HomeDecision() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(ASK_PLACEHOLDERS[0]);
  const [name, setName] = useState("there");
  const [todayCents, setTodayCents] = useState(0);
  const [yesterdayCents, setYesterdayCents] = useState(0);
  const [lifetimeCents, setLifetimeCents] = useState(0);
  const [tip, setTip] = useState<{ savingsCents: number; merchantName: string } | null>(null);
  const [drop, setDrop] = useState<DropSignal | null>(null);
  const [fuel, setFuel] = useState<FuelSignal | null>(null);
  const [ready, setReady] = useState(false);

  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = greetingForHour(hour);
  const counted = useCountUp(todayCents, ready);
  const buys = savingsBuys(todayCents > 0 ? todayCents : tip?.savingsCents ?? 0);

  useEffect(() => {
    let i = 0;
    const t = window.setInterval(() => {
      i = (i + 1) % ASK_PLACEHOLDERS.length;
      setPlaceholder(ASK_PLACEHOLDERS[i]);
    }, 4000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [catalog, fuelRes] = await Promise.all([
        loadCatalog(),
        loadFuelStations("petrol"),
      ]);
      if (cancelled) return;

      let bestDrop: DropSignal | null = null;
      let bestAbs = 0;
      for (const price of catalog.prices) {
        if (price.prevPriceCents == null) continue;
        const delta = price.priceCents - price.prevPriceCents;
        if (delta >= 0) continue;
        const abs = Math.abs(delta);
        if (abs < bestAbs) continue;
        const product = catalog.products.find((p) => p.id === price.productId);
        const merchant = catalog.merchants.find((m) => m.id === price.merchantId);
        if (!product || !merchant) continue;
        const trend = formatPriceTrend(
          price.priceCents,
          price.prevPriceCents,
          price.prevObservedAt,
        );
        if (!trend.label || trend.direction !== "down") continue;
        bestAbs = abs;
        bestDrop = {
          productName: product.name,
          merchantName: merchant.name,
          label: trend.label,
          href: `/prices?id=${product.id}&q=${encodeURIComponent(product.name)}`,
        };
      }
      setDrop(bestDrop);

      const cheapest = fuelRes.stations[0];
      if (cheapest) {
        setFuel({
          stationName: cheapest.name,
          priceLabel: `${formatKes(cheapest.priceCentsPerLitre)}/L`,
          href: "/fuel",
        });
      }

      if (authLoading) return;
      if (!user) {
        setName("there");
        setTodayCents(0);
        setYesterdayCents(0);
        setLifetimeCents(0);
        setTip(null);
        setReady(true);
        return;
      }
      const [profile, wallet, watchRes] = await Promise.all([
        loadProfile(),
        loadWallet(),
        loadWatchlist(),
      ]);
      if (cancelled) return;
      const full =
        "error" in profile ? (user.user_metadata?.full_name as string | undefined) : profile.fullName;
      setName(firstName(full, user.email));
      setTodayCents(wallet.todaySavingsCents ?? 0);
      setYesterdayCents(wallet.yesterdaySavingsCents ?? 0);
      setLifetimeCents(wallet.lifetimeSavingsCents ?? 0);
      setTip(wallet.lastTip ?? null);

      const personal = watchRes.drops?.[0];
      if (personal) {
        setDrop({
          productName: personal.productName,
          merchantName: personal.merchantName ?? "Nairobi",
          label:
            personal.dropCents > 0
              ? `↓ ${formatKes(personal.dropCents)} since you watched`
              : personal.weekTrendLabel ?? "Price moved",
          href: personal.href,
        });
      }

      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  function onAsk(e: FormEvent) {
    e.preventDefault();
    router.push(routeAskQuery(query));
  }

  const deltaPct =
    yesterdayCents > 0
      ? Math.round(((todayCents - yesterdayCents) / yesterdayCents) * 100)
      : todayCents > 0
        ? 100
        : 0;

  const liveCards = [
    drop
      ? {
          key: "drop",
          eyebrow: drop.href.includes("prices") && drop.label.includes("watched")
            ? "On your watchlist"
            : "Price move",
          title: `${drop.productName} is cheaper`,
          body: `${drop.label} at ${drop.merchantName}`,
          href: drop.href,
          tone: "forest" as const,
        }
      : null,
    fuel
      ? {
          key: "fuel",
          eyebrow: "Fuel now",
          title: `${fuel.stationName} leads`,
          body: `Petrol from ${fuel.priceLabel} — check before you fill`,
          href: fuel.href,
          tone: "accent" as const,
        }
      : null,
    tip && tip.savingsCents > 0
      ? {
          key: "tip",
          eyebrow: "Your last win",
          title: `You saved ${formatKes(tip.savingsCents)}`,
          body: `At ${tip.merchantName}. Run another list before you shop.`,
          href: "/basket",
          tone: "night" as const,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    eyebrow: string;
    title: string;
    body: string;
    href: string;
    tone: "forest" | "accent" | "night";
  }[];

  return (
    <div className="page-band min-h-[calc(100svh-3.5rem)]">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-16">
        <p className="animate-rise text-[13px] font-semibold tracking-wide text-savr-mute">
          {greeting}
          {name !== "there" ? `, ${name}` : ""}
        </p>
        <h1 className="animate-rise-delay mt-2 font-display text-[1.85rem] font-bold leading-[1.15] tracking-tightish text-savr-ink md:text-4xl">
          What do you need today?
        </h1>

        <form onSubmit={onAsk} className="animate-rise-delay-2 mt-8">
          <label className="sr-only" htmlFor="savr-home-ask">
            Ask Savr
          </label>
          <div className="glass-card flex items-center gap-3 px-4 py-2.5 transition duration-soft focus-within:border-savr-forest/35 focus-within:ring-4 focus-within:ring-savr-forest/10">
            <span className="text-sm font-bold text-savr-forest" aria-hidden>
              Ask
            </span>
            <input
              id="savr-home-ask"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full border-0 bg-transparent py-2.5 text-[15px] text-savr-ink outline-none placeholder:text-savr-mute/55"
              autoComplete="off"
            />
            <button type="submit" className="btn-primary shrink-0 px-4 py-2.5 text-sm">
              Go
            </button>
          </div>
        </form>

        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
          I want to…
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SPEND_INTENTS.slice(0, 6).map((intent) => (
            <Link
              key={intent.id}
              href={intent.href}
              className="inline-flex shrink-0 items-center rounded-full border border-savr-ink/[0.06] bg-white/80 px-3.5 py-2 text-sm font-semibold text-savr-ink shadow-[0_8px_24px_-18px_rgba(11,18,32,0.35)] transition duration-soft hover:border-savr-forest/30 hover:text-savr-forest"
            >
              {intent.label}
            </Link>
          ))}
        </div>

        <section className="animate-rise mt-10 glass-card relative overflow-hidden p-6 md:p-8">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-savr-forest/15 blur-3xl"
            aria-hidden
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-forest">
            Today&apos;s savings
          </p>
          <p className="mt-3 font-display text-5xl font-extrabold tracking-tightish text-savr-ink tabular-nums md:text-6xl">
            {formatKes(counted)}
          </p>
          <p className="mt-2 text-sm text-savr-mute">
            {todayCents > 0
              ? buys ?? "From smarter choices you locked in today."
              : user
                ? "Ask Savr or compare a basket — this number is your habit score."
                : "Sign in and decide smarter — savings become the hero metric."}
          </p>
          {(todayCents > 0 || yesterdayCents > 0) && (
            <p
              className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                deltaPct >= 0
                  ? "bg-savr-forest/10 text-savr-forest"
                  : "bg-amber-500/10 text-amber-800"
              }`}
            >
              {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct)}% vs yesterday
            </p>
          )}
          {lifetimeCents > 0 && (
            <p className="mt-4 text-xs font-medium text-savr-mute">
              Lifetime · {formatKes(lifetimeCents)}
            </p>
          )}
        </section>

        {liveCards.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
              Live for you
            </p>
            {liveCards.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className={`block overflow-hidden rounded-card-lg p-5 text-white shadow-[0_22px_50px_-28px_rgba(11,18,32,0.45)] transition duration-soft ${
                  card.tone === "forest"
                    ? "bg-gradient-to-br from-savr-forest to-[#009624]"
                    : card.tone === "accent"
                      ? "bg-gradient-to-br from-savr-accent to-[#1d4ed8]"
                      : "bg-gradient-to-br from-savr-night to-[#1a1a22]"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  {card.eyebrow}
                </p>
                <p className="mt-2 font-display text-xl font-bold tracking-tightish">{card.title}</p>
                <p className="mt-1 text-sm text-white/75">{card.body}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/map"
            className="card p-5 hover:border-savr-forest/25"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-savr-mute">Value map</p>
            <p className="mt-1 font-display text-lg font-bold text-savr-ink">Where value is</p>
            <p className="mt-1 text-xs text-savr-mute">Green best · yellow mid · red expensive</p>
          </Link>
          <Link
            href="/ask"
            className="card p-5 hover:border-savr-forest/25"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-savr-mute">Decide</p>
            <p className="mt-1 font-display text-lg font-bold text-savr-ink">Open Ask Savr</p>
            <p className="mt-1 text-xs text-savr-mute">All compares live here</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
