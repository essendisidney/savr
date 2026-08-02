"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, loadWallet } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";

const CATEGORIES = [
  { label: "Taxi", href: "/rides", icon: "🚕" },
  { label: "Groceries", href: "/basket", icon: "🛒" },
  { label: "Fuel", href: "/fuel", icon: "⛽" },
  { label: "Medicine", href: "/prices?q=panadol", icon: "💊" },
  { label: "Travel", href: "/map", icon: "✈️" },
  { label: "Food", href: "/basket", icon: "🍔" },
  { label: "Shopping", href: "/prices", icon: "🛍" },
] as const;

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
    const from = 0;
    const duration = 700;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (targetCents - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetCents, enabled]);
  return value;
}

export function HomeDecision() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("there");
  const [todayCents, setTodayCents] = useState(0);
  const [yesterdayCents, setYesterdayCents] = useState(0);
  const [lifetimeCents, setLifetimeCents] = useState(0);
  const [tip, setTip] = useState<{ savingsCents: number; merchantName: string } | null>(null);
  const [ready, setReady] = useState(false);

  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = greetingForHour(hour);
  const counted = useCountUp(todayCents, ready);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (authLoading) return;
      if (!user) {
        if (!cancelled) {
          setName("there");
          setTodayCents(0);
          setYesterdayCents(0);
          setLifetimeCents(0);
          setTip(null);
          setReady(true);
        }
        return;
      }
      const [profile, wallet] = await Promise.all([loadProfile(), loadWallet()]);
      if (cancelled) return;
      const full =
        "error" in profile ? (user.user_metadata?.full_name as string | undefined) : profile.fullName;
      setName(firstName(full, user.email));
      setTodayCents(wallet.todaySavingsCents ?? 0);
      setYesterdayCents(wallet.yesterdaySavingsCents ?? 0);
      setLifetimeCents(wallet.lifetimeSavingsCents ?? 0);
      setTip(wallet.lastTip ?? null);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push("/prices");
      return;
    }
    router.push(`/prices?q=${encodeURIComponent(q)}`);
  }

  const deltaPct =
    yesterdayCents > 0
      ? Math.round(((todayCents - yesterdayCents) / yesterdayCents) * 100)
      : todayCents > 0
        ? 100
        : 0;

  return (
    <div className="page-band min-h-[calc(100svh-3.5rem)]">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-16">
        <p className="animate-rise text-[13px] font-semibold tracking-wide text-savr-mute">
          {greeting}
          {name !== "there" ? `, ${name}` : ""}
        </p>
        <h1 className="animate-rise-delay mt-2 font-display text-[1.85rem] font-bold leading-[1.15] tracking-tightish text-savr-ink md:text-4xl">
          What would you like to save on today?
        </h1>

        <form onSubmit={onSearch} className="animate-rise-delay-2 mt-8">
          <label className="sr-only" htmlFor="savr-home-search">
            Search anything
          </label>
          <div className="glass-card flex items-center gap-3 px-4 py-2.5 transition duration-soft focus-within:border-savr-forest/35 focus-within:ring-4 focus-within:ring-savr-forest/10">
            <span className="text-lg text-savr-mute" aria-hidden>
              ⌕
            </span>
            <input
              id="savr-home-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything — rice, fuel, Samsung…"
              className="w-full border-0 bg-transparent py-2.5 text-[15px] text-savr-ink outline-none placeholder:text-savr-mute/60"
              autoComplete="off"
            />
            <button type="submit" className="btn-primary shrink-0 px-4 py-2.5 text-sm">
              Search
            </button>
          </div>
        </form>

        <div className="animate-rise-delay-2 mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-savr-ink/[0.06] bg-white/80 px-3.5 py-2 text-sm font-semibold text-savr-ink shadow-[0_8px_24px_-18px_rgba(11,18,32,0.35)] transition duration-soft hover:border-savr-forest/30 hover:text-savr-forest"
            >
              <span aria-hidden>{c.icon}</span>
              {c.label}
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
              ? "From smarter basket choices you locked in today."
              : user
                ? "Compare a basket to start today’s number growing."
                : "Sign in and compare — this number becomes your habit."}
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

        {tip && tip.savingsCents > 0 ? (
          <section className="animate-rise mt-5 overflow-hidden rounded-card-lg bg-gradient-to-br from-savr-accent to-[#1d4ed8] p-6 text-white shadow-[0_22px_50px_-28px_rgba(37,99,235,0.55)] md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              Your last win
            </p>
            <p className="mt-3 font-display text-xl font-bold leading-snug tracking-tightish md:text-2xl">
              You saved {formatKes(tip.savingsCents)} at {tip.merchantName}.
            </p>
            <p className="mt-2 max-w-md text-sm text-white/75">
              Run another list before you shop — Savr ranks the real total again.
            </p>
            <Link
              href="/basket"
              className="mt-5 inline-flex rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-savr-accent transition duration-soft hover:bg-white/90"
            >
              Compare again →
            </Link>
          </section>
        ) : (
          <section className="animate-rise mt-5 glass-card border-savr-accent/15 p-6 md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-accent">
              Start here
            </p>
            <p className="mt-3 font-display text-xl font-bold tracking-tightish text-savr-ink md:text-2xl">
              Build a grocery basket. See who wins on total cost.
            </p>
            <p className="mt-2 text-sm text-savr-mute">
              One habit. Every shop. That&apos;s how Today&apos;s Savings starts moving.
            </p>
            <Link href="/basket" className="btn-primary mt-5 inline-flex">
              Compare my basket
            </Link>
          </section>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/check"
            className="rounded-card border border-savr-ink/[0.06] bg-white/80 p-5 transition duration-soft hover:border-savr-forest/25 hover:shadow-[0_16px_40px_-28px_rgba(11,18,32,0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-savr-mute">After a shop</p>
            <p className="mt-1 font-display text-lg font-bold text-savr-ink">Could I have saved?</p>
          </Link>
          <Link
            href="/wallet"
            className="rounded-card border border-savr-ink/[0.06] bg-white/80 p-5 transition duration-soft hover:border-savr-forest/25 hover:shadow-[0_16px_40px_-28px_rgba(11,18,32,0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-savr-mute">Rewards</p>
            <p className="mt-1 font-display text-lg font-bold text-savr-ink">See my wallet</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
