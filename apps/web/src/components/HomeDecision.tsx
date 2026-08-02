"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadProfile, loadWallet, loadWatchlist } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import {
  homeBasketCta,
  loadBasketDraft,
  loadLastComparedAt,
  type HomeBasketCta,
} from "@/lib/basket-draft";
import { formatKes } from "@/lib/compare";

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

export function HomeDecision() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("there");
  const [todayCents, setTodayCents] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [cta, setCta] = useState<HomeBasketCta>(() => homeBasketCta(null, null));

  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = greetingForHour(hour);

  useEffect(() => {
    setCta(homeBasketCta(loadBasketDraft(), loadLastComparedAt()));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (authLoading) return;
      if (!user) {
        setName("there");
        setTodayCents(0);
        setAlertCount(0);
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
      setAlertCount(watchRes.unreadCount ?? 0);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

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

      <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-lg flex-col justify-center px-4 py-16 md:px-6 md:py-20">
        <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.2em] text-savr-forest">
          {greeting}
          {name !== "there" ? ` · ${name}` : ""}
        </p>

        <p className="animate-rise mt-4 font-display text-6xl font-extrabold tracking-tightish text-savr-ink md:text-7xl">
          Savr
        </p>

        <h1 className="animate-rise-delay mt-5 max-w-md text-2xl font-medium leading-snug text-savr-ink/90 md:text-3xl">
          Before you spend, check once.
        </h1>

        <p className="animate-rise-delay mt-3 max-w-sm text-[15px] text-savr-mute">
          {cta.detail}
        </p>

        <div className="animate-rise-delay-2 mt-10 space-y-4">
          <Link
            href={cta.href}
            className="btn-primary flex w-full items-center justify-center py-4 text-base"
          >
            {cta.label}
          </Link>

          {cta.secondaryHref && cta.secondaryLabel && (
            <p className="text-center text-sm">
              <Link
                href={cta.secondaryHref}
                className="font-semibold text-savr-mute hover:text-savr-forest hover:underline"
              >
                {cta.secondaryLabel}
              </Link>
            </p>
          )}

          {ready && todayCents > 0 && (
            <p className="text-center text-sm text-savr-mute">
              Today you kept{" "}
              <span className="font-semibold text-savr-forest">{formatKes(todayCents)}</span>
            </p>
          )}

          {ready && alertCount > 0 && (
            <p className="text-center text-sm">
              <Link href="/alerts" className="font-semibold text-savr-forest hover:underline">
                {alertCount === 1 ? "1 watch drop waiting" : `${alertCount} watch drops waiting`}
              </Link>
            </p>
          )}
        </div>

        <p className="animate-rise-delay-2 mt-12 text-center text-sm text-savr-mute">
          Need something else?{" "}
          <Link href="/ask" className="font-semibold text-savr-ink hover:text-savr-forest hover:underline">
            Ask Savr
          </Link>
        </p>
      </div>
    </div>
  );
}
