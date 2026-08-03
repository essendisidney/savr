"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, loadWallet, loadWatchlist } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import {
  homeBasketCta,
  loadBasketDraft,
  loadLastComparedAt,
  type HomeBasketCta,
} from "@/lib/basket-draft";
import { loadCatalog } from "@/lib/catalog";
import { compareBasket, formatKes } from "@/lib/compare";
import {
  ASK_PLACEHOLDERS,
  routeAskQuery,
  savingsBuys,
  weekdayPulse,
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

type Insight = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  amountCents?: number;
};

export function HomeDecision() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("there");
  const [todayCents, setTodayCents] = useState(0);
  const [lifetimeCents, setLifetimeCents] = useState(0);
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(ASK_PLACEHOLDERS[0]);
  const [placeholderKey, setPlaceholderKey] = useState(0);
  const [cta, setCta] = useState<HomeBasketCta>(() => homeBasketCta(null, null));
  const [continueSaveCents, setContinueSaveCents] = useState(0);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [ready, setReady] = useState(false);
  const [asking, setAsking] = useState(false);

  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = greetingForHour(hour);
  const pulse = useMemo(() => weekdayPulse(), []);

  useEffect(() => {
    let i = 0;
    const t = window.setInterval(() => {
      i = (i + 1) % ASK_PLACEHOLDERS.length;
      setPlaceholder(ASK_PLACEHOLDERS[i]);
      setPlaceholderKey((k) => k + 1);
    }, 3200);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setCta(homeBasketCta(loadBasketDraft(), loadLastComparedAt()));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const draft = loadBasketDraft();
      const catalog = await loadCatalog();
      if (cancelled) return;

      let saveCents = 0;
      if (draft?.items.length) {
        const ranks = compareBasket(catalog, draft.items);
        const best = ranks.find((r) => r.isRecommended) ?? ranks[0];
        const worst = ranks[ranks.length - 1];
        if (best && worst) saveCents = Math.max(0, worst.netCents - best.netCents);
        setContinueSaveCents(saveCents);
      } else {
        setContinueSaveCents(0);
      }

      if (authLoading) return;

      if (!user) {
        setName("there");
        setTodayCents(0);
        setLifetimeCents(0);
        if (saveCents >= 500) {
          setInsight({
            eyebrow: "Today’s opportunity",
            title: "Your list is ready to beat the priciest store",
            body: savingsBuys(saveCents) ?? "Finish comparing before anyone shops.",
            href: "/basket",
            cta: "See where to shop →",
            amountCents: saveCents,
          });
        } else {
          setInsight(null);
        }
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
      setLifetimeCents(wallet.lifetimeSavingsCents ?? 0);

      const drop =
        watchRes.drops?.find((d) => d.unread) ?? watchRes.drops?.[0] ?? null;
      if (drop && drop.dropCents >= 500) {
        setInsight({
          eyebrow: "Today’s opportunity",
          title: `${drop.productName} just got cheaper`,
          body:
            drop.dropCents > 0
              ? `${formatKes(drop.dropCents)} below your watch${
                  drop.merchantName ? ` · ${drop.merchantName}` : ""
                }`
              : "Something moved on a price you watch.",
          href: drop.unread ? "/alerts" : drop.href,
          cta: "See drop →",
          amountCents: drop.dropCents,
        });
      } else if (saveCents >= 500) {
        setInsight({
          eyebrow: "Today’s opportunity",
          title: "Your list is ready to beat the priciest store",
          body: savingsBuys(saveCents) ?? "Pick the winning branch before anyone spends.",
          href: "/basket",
          cta: "Continue →",
          amountCents: saveCents,
        });
      } else if ((wallet.todaySavingsCents ?? 0) > 0) {
        const kept = wallet.todaySavingsCents ?? 0;
        setInsight({
          eyebrow: "Already working",
          title: "You locked in a smarter choice today",
          body: savingsBuys(kept) ?? "From decisions you already made.",
          href: "/wallet",
          cta: "Open wallet →",
          amountCents: kept,
        });
      } else {
        setInsight(null);
      }

      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  function onAsk(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/ask");
      return;
    }
    setAsking(true);
    window.setTimeout(() => {
      router.push(routeAskQuery(trimmed));
    }, 420);
  }

  const heroLine = !ready
    ? "Before you spend anything today…"
    : insight
      ? "Savr already found a way to save you money."
      : todayCents > 0
        ? `You’ve kept ${formatKes(todayCents)} today — ask what’s next.`
        : "Before you spend anything today, ask Savr.";

  const showContinueAsSecondary = Boolean(insight && insight.href === cta.href);
  const showContinueBlock = !insight || insight.href !== cta.href;

  return (
    <div className="home-stage relative min-h-[calc(100svh-3.5rem)] overflow-hidden">
      <div className="home-stage-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="home-city pointer-events-none absolute inset-x-0 bottom-0 h-44 opacity-[0.14]" aria-hidden />

      <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-lg flex-col justify-center px-4 py-12 md:px-6 md:py-16">
        <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.22em] text-savr-forest">
          {greeting}
          {name !== "there" ? `, ${name}` : ""}
        </p>

        <p className="animate-rise mt-3 font-display text-[3.25rem] font-extrabold leading-none tracking-tightish text-savr-ink md:text-6xl">
          Savr
        </p>

        <h1 className="animate-rise-delay mt-5 max-w-md text-[1.35rem] font-medium leading-snug text-savr-ink/85 md:text-2xl">
          {heroLine}
        </h1>

        {!insight && (
          <p className="animate-rise-delay mt-2 max-w-md text-sm text-savr-mute">{pulse}</p>
        )}

        <form onSubmit={onAsk} className="animate-rise-delay-2 mt-8">
          <label className="sr-only" htmlFor="savr-home-ask">
            Ask Savr
          </label>
          <div className={`home-ask ${asking ? "home-ask-busy" : ""}`}>
            <div className="flex items-center gap-3 px-4 sm:px-5">
              <span className="shrink-0 text-[13px] font-bold tracking-wide text-savr-forest">
                Ask Savr
              </span>
              <div className="relative min-h-[1.5rem] w-full">
                <input
                  id="savr-home-ask"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full border-0 bg-transparent py-1 text-[16px] text-savr-ink outline-none placeholder:text-transparent"
                  autoComplete="off"
                  autoFocus
                  disabled={asking}
                />
                {!query && (
                  <span
                    key={placeholderKey}
                    className="home-ask-placeholder pointer-events-none absolute inset-0 flex items-center text-[16px] text-savr-mute/55"
                    aria-hidden
                  >
                    {placeholder}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={asking}
                className="btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-70"
              >
                {asking ? "…" : "Go"}
              </button>
            </div>
          </div>
          {asking && (
            <p className="mt-3 text-sm font-medium text-savr-forest animate-pulse">
              Looking for the smartest path…
            </p>
          )}
        </form>

        <div className="animate-rise-delay-2 mt-10 space-y-6">
          {insight && (
            <Link href={insight.href} className="home-opportunity block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-forest">
                {insight.eyebrow}
              </p>
              {insight.amountCents != null && insight.amountCents >= 500 ? (
                <p className="mt-2 font-display text-4xl font-extrabold tracking-tightish tabular-nums text-savr-ink md:text-5xl">
                  {formatKes(insight.amountCents)}
                </p>
              ) : null}
              <p
                className={`font-display font-bold tracking-tightish text-savr-ink ${
                  insight.amountCents != null && insight.amountCents >= 500
                    ? "mt-1 text-lg"
                    : "mt-2 text-xl"
                }`}
              >
                {insight.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-savr-mute">{insight.body}</p>
              <p className="mt-3 text-sm font-semibold text-savr-forest">{insight.cta}</p>
            </Link>
          )}

          {showContinueBlock && (
            <div className={insight ? "border-t border-savr-ink/[0.06] pt-5" : ""}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                Continue
              </p>
              <Link
                href={cta.href}
                className="mt-2 flex items-start justify-between gap-3 transition hover:opacity-90"
              >
                <div>
                  <p className="font-display text-lg font-bold tracking-tightish text-savr-ink">
                    {cta.label}
                  </p>
                  <p className="mt-1 text-sm text-savr-mute">{cta.detail}</p>
                  {continueSaveCents >= 500 && cta.href.startsWith("/basket") && !insight && (
                    <>
                      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-savr-forest">
                        ~{formatKes(continueSaveCents)}
                      </p>
                      {(() => {
                        const buys = savingsBuys(continueSaveCents);
                        return buys ? <p className="mt-1 text-sm text-savr-mute">{buys}</p> : null;
                      })()}
                    </>
                  )}
                </div>
                <span className="shrink-0 pt-1 text-sm font-semibold text-savr-forest">→</span>
              </Link>
              {cta.secondaryHref && cta.secondaryLabel && (
                <Link
                  href={cta.secondaryHref}
                  className="mt-3 inline-block text-sm font-semibold text-savr-mute transition hover:text-savr-forest hover:underline"
                >
                  {cta.secondaryLabel} →
                </Link>
              )}
            </div>
          )}

          {showContinueAsSecondary && cta.secondaryHref && cta.secondaryLabel && (
            <Link
              href={cta.secondaryHref}
              className="inline-block text-sm font-semibold text-savr-mute transition hover:text-savr-forest hover:underline"
            >
              {cta.secondaryLabel} →
            </Link>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-savr-ink/[0.06] pt-5 text-sm text-savr-mute">
            <Link href="/map" className="font-semibold transition hover:text-savr-forest">
              Nearby value →
            </Link>
            {ready && lifetimeCents > 0 && (
              <Link href="/wallet" className="transition hover:text-savr-forest">
                Lifetime kept{" "}
                <span className="font-semibold text-savr-ink">{formatKes(lifetimeCents)}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
