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
import { ASK_PLACEHOLDERS, routeAskQuery } from "@/lib/intents";

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
};

export function HomeDecision() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("there");
  const [todayCents, setTodayCents] = useState(0);
  const [lifetimeCents, setLifetimeCents] = useState(0);
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(ASK_PLACEHOLDERS[0]);
  const [cta, setCta] = useState<HomeBasketCta>(() => homeBasketCta(null, null));
  const [continueSaveCents, setContinueSaveCents] = useState(0);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [ready, setReady] = useState(false);

  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = greetingForHour(hour);

  useEffect(() => {
    let i = 0;
    const t = window.setInterval(() => {
      i = (i + 1) % ASK_PLACEHOLDERS.length;
      setPlaceholder(ASK_PLACEHOLDERS[i]);
    }, 3800);
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
            eyebrow: "Your list",
            title: `You could keep ~${formatKes(saveCents)}`,
            body: "Finish comparing before anyone shops.",
            href: "/basket",
            cta: "Continue →",
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
          eyebrow: "Price drop",
          title: `${drop.productName} is cheaper`,
          body:
            drop.dropCents > 0
              ? `About ${formatKes(drop.dropCents)} below your watch start${
                  drop.merchantName ? ` · ${drop.merchantName}` : ""
                }`
              : "Something moved on a price you watch.",
          href: drop.unread ? "/alerts" : drop.href,
          cta: "See drop →",
        });
      } else if (saveCents >= 500) {
        setInsight({
          eyebrow: "Before you shop",
          title: `Your list could keep ~${formatKes(saveCents)}`,
          body: "Pick the winning branch before anyone spends.",
          href: "/basket",
          cta: "Continue →",
        });
      } else if ((wallet.todaySavingsCents ?? 0) > 0) {
        setInsight({
          eyebrow: "Today",
          title: `You kept ${formatKes(wallet.todaySavingsCents ?? 0)}`,
          body: "From smarter choices you already locked in.",
          href: "/wallet",
          cta: "Open wallet →",
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
    router.push(routeAskQuery(query));
  }

  const workingLine =
    ready && (todayCents > 0 || insight)
      ? insight
        ? "I’ve already found a way to save you money today."
        : `Welcome back — you’ve kept ${formatKes(todayCents)} today.`
      : "How can I help you save today?";

  return (
    <div className="relative min-h-[calc(100svh-3.5rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-savr-mist via-white to-savr-fog/90"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-[28rem] w-[28rem] rounded-full bg-savr-forest/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-savr-signal/25 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-lg flex-col justify-center px-4 py-14 md:px-6 md:py-20">
        <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.2em] text-savr-forest">
          {greeting}
          {name !== "there" ? `, ${name}` : ""}
        </p>

        <p className="animate-rise mt-3 font-display text-6xl font-extrabold tracking-tightish text-savr-ink md:text-7xl">
          Savr
        </p>

        <h1 className="animate-rise-delay mt-5 max-w-md text-2xl font-medium leading-snug text-savr-ink/90 md:text-3xl">
          {workingLine}
        </h1>

        <form onSubmit={onAsk} className="animate-rise-delay-2 mt-8">
          <label className="sr-only" htmlFor="savr-home-ask">
            Ask Savr
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-savr-ink/[0.08] bg-white/90 px-4 py-2.5 shadow-[0_18px_50px_-32px_rgba(4,36,25,0.55)] transition duration-soft focus-within:border-savr-forest/35 focus-within:ring-4 focus-within:ring-savr-forest/10">
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
              autoFocus
            />
            <button type="submit" className="btn-primary shrink-0 px-4 py-2.5 text-sm">
              Go
            </button>
          </div>
        </form>

        <div className="animate-rise-delay-2 mt-8 space-y-5">
          <div className="border-t border-savr-ink/[0.06] pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
              Continue
            </p>
            <Link
              href={cta.href}
              className="mt-2 flex items-start justify-between gap-3 transition hover:opacity-90"
            >
              <div>
                <p className="font-display text-xl font-bold tracking-tightish text-savr-ink">
                  {cta.label}
                </p>
                <p className="mt-1 text-sm text-savr-mute">{cta.detail}</p>
                {continueSaveCents >= 500 && cta.href.startsWith("/basket") && (
                  <p className="mt-2 text-sm font-semibold text-savr-forest">
                    You could keep ~{formatKes(continueSaveCents)}
                  </p>
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

          {insight && insight.href !== cta.href && (
            <Link
              href={insight.href}
              className="block border-t border-savr-ink/[0.06] pt-5 transition hover:border-savr-forest/25"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                {insight.eyebrow}
              </p>
              <p className="mt-2 font-display text-lg font-bold tracking-tightish text-savr-ink">
                {insight.title}
              </p>
              <p className="mt-1 text-sm text-savr-mute">{insight.body}</p>
              <p className="mt-2 text-sm font-semibold text-savr-forest">{insight.cta}</p>
            </Link>
          )}

          {ready && lifetimeCents > 0 && (
            <p className="border-t border-savr-ink/[0.06] pt-5 text-sm text-savr-mute">
              Lifetime kept{" "}
              <Link href="/wallet" className="font-semibold text-savr-ink hover:text-savr-forest">
                {formatKes(lifetimeCents)}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
