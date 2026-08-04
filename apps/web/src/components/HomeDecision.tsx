"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, loadWallet, loadWatchlist } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import {
  homeBasketCta,
  loadBasketDraft,
  loadLastComparedAt,
  type HomeBasketCta,
} from "@/lib/basket-draft";
import { loadCatalog, loadFuelStations } from "@/lib/catalog";
import { compareBasket, formatKes } from "@/lib/compare";
import { cityProofFromCatalog } from "@/lib/city-proof";
import { fuelSavingsCredible } from "@/lib/data-honesty";
import {
  ASK_PLACEHOLDERS,
  POPULAR_ASKS,
  routeAskQuery,
  savingsBuys,
  weekdayPulse,
} from "@/lib/intents";
import { loadRecentAsks, pushRecentAsk } from "@/lib/recent-asks";
import { buildMarketInviteShare, whatsAppShareUrl } from "@/lib/share";

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

type Opportunity = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  amountCents: number;
};

export function HomeDecision() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("there");
  const [balanceCents, setBalanceCents] = useState(0);
  const [todayCents, setTodayCents] = useState(0);
  const [lifetimeCents, setLifetimeCents] = useState(0);
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(ASK_PLACEHOLDERS[0]);
  const [placeholderKey, setPlaceholderKey] = useState(0);
  const [cta, setCta] = useState<HomeBasketCta>(() => homeBasketCta(null, null));
  const [continueSaveCents, setContinueSaveCents] = useState(0);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [nearby, setNearby] = useState({ grocery: 0, fuel: 0 });
  const [recent, setRecent] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [asking, setAsking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [proofChip, setProofChip] = useState<string | null>(null);

  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = greetingForHour(hour);
  const pulse = useMemo(() => weekdayPulse(), []);

  useEffect(() => {
    setRecent(loadRecentAsks());
    setCta(homeBasketCta(loadBasketDraft(), loadLastComparedAt()));
  }, []);

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
    let cancelled = false;
    void (async () => {
      const draft = loadBasketDraft();
      const [catalog, fuel] = await Promise.all([
        loadCatalog(),
        loadFuelStations("petrol"),
      ]);
      if (cancelled) return;

      setProofChip(cityProofFromCatalog(catalog)?.chip ?? null);

      const groceryN = catalog.merchants.filter((m) => m.category === "grocery").length;
      setNearby({ grocery: groceryN, fuel: fuel.stations.length });

      const ways: Opportunity[] = [];
      let saveCents = 0;
      if (draft?.items.length) {
        const ranks = compareBasket(catalog, draft.items);
        const best = ranks.find((r) => r.isRecommended) ?? ranks[0];
        const worst = ranks[ranks.length - 1];
        if (best && worst) saveCents = Math.max(0, worst.netCents - best.netCents);
        setContinueSaveCents(saveCents);
        if (saveCents >= 500) {
          ways.push({
            id: "basket",
            eyebrow: "Basket",
            title: "Your list could keep this",
            body: savingsBuys(saveCents) ?? "Compare before anyone shops.",
            href: "/basket",
            cta: "Continue basket →",
            amountCents: saveCents,
          });
        }
      } else {
        setContinueSaveCents(0);
      }

      const prices = fuel.stations
        .map((s) => s.priceCentsPerLitre)
        .filter((p) => Number.isFinite(p) && p > 0);
      if (prices.length >= 2 && fuelSavingsCredible(fuel.stations, fuel.source)) {
        const lo = Math.min(...prices);
        const hi = Math.max(...prices);
        const perLitre = hi - lo;
        if (perLitre >= 200) {
          const tank = perLitre * 40;
          ways.push({
            id: "fuel",
            eyebrow: "Fuel",
            title: "Cheaper petrol is nearby",
            body: `Up to ${formatKes(perLitre)}/L vs the priciest station — about ${formatKes(tank)} on a 40L fill. Confirm at the board.`,
            href: "/fuel",
            cta: "See stations →",
            amountCents: tank,
          });
        }
      }

      if (authLoading) {
        setOpportunities(ways.slice(0, 3));
        setReady(true);
        return;
      }

      if (!user) {
        setName("there");
        setBalanceCents(0);
        setTodayCents(0);
        setLifetimeCents(0);
        setOpportunities(ways.slice(0, 3));
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
      setBalanceCents(wallet.balanceCents ?? 0);
      setTodayCents(wallet.todaySavingsCents ?? 0);
      setLifetimeCents(wallet.lifetimeSavingsCents ?? 0);

      const drop =
        watchRes.drops?.find((d) => d.unread) ?? watchRes.drops?.[0] ?? null;
      if (drop && drop.dropCents >= 500) {
        ways.unshift({
          id: "drop",
          eyebrow: "Price drop",
          title: `${drop.productName} got cheaper`,
          body: `${formatKes(drop.dropCents)} below your watch${
            drop.merchantName ? ` · ${drop.merchantName}` : ""
          }`,
          href: drop.unread ? "/alerts" : drop.href,
          cta: "See drop →",
          amountCents: drop.dropCents,
        });
      }

      if ((wallet.todaySavingsCents ?? 0) >= 500 && !ways.some((w) => w.id === "today")) {
        const kept = wallet.todaySavingsCents ?? 0;
        ways.push({
          id: "today",
          eyebrow: "Today",
          title: "Already locked in",
          body: savingsBuys(kept) ?? "From smarter choices you made today.",
          href: "/wallet",
          cta: "Open wallet →",
          amountCents: kept,
        });
      }

      setOpportunities(ways.slice(0, 3));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  function goAsk(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      router.push("/ask");
      return;
    }
    pushRecentAsk(trimmed);
    setRecent(loadRecentAsks());
    setAsking(true);
    window.setTimeout(() => {
      router.push(routeAskQuery(trimmed));
    }, 520);
  }

  function onAsk(e: FormEvent) {
    e.preventDefault();
    goAsk(query);
  }

  function onVoice() {
    setVoiceError(null);
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as unknown as {
            SpeechRecognition?: new () => SpeechRecognitionLike;
            webkitSpeechRecognition?: new () => SpeechRecognitionLike;
          }).SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
            .webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognition) {
      setVoiceError("Voice isn’t supported in this browser — type instead.");
      inputRef.current?.focus();
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-KE";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);
    rec.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript?.trim() ?? "";
      setListening(false);
      if (text) {
        setQuery(text);
        goAsk(text);
      }
    };
    rec.onerror = () => {
      setListening(false);
      setVoiceError("Couldn’t hear that — try again or type.");
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
    } catch {
      setListening(false);
      setVoiceError("Microphone blocked — type instead.");
    }
  }

  const primary = opportunities[0] ?? null;
  const waysTotal = opportunities.reduce((s, o) => s + o.amountCents, 0);
  const nearbyOffers = nearby.grocery + nearby.fuel;

  return (
    <div className="home-stage relative min-h-[calc(100svh-3.5rem)] overflow-hidden">
      <div className="home-stage-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="home-stage-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="home-city pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-[0.08]" aria-hidden />

      <div className="relative z-10 mx-auto flex max-w-lg flex-col px-4 pb-28 pt-11 md:px-6 md:pb-32 md:pt-16">
        <p className="home-eyebrow animate-rise">
          {greeting}
          {name !== "there" ? `, ${name}` : ""}
        </p>

        <p className="home-brand animate-rise mt-3">Savr</p>

        {proofChip && (
          <p className="animate-rise mt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-savr-forest">
            Nairobi open · {proofChip}
          </p>
        )}

        <p className="animate-rise-delay mt-5 max-w-md text-[1.2rem] font-medium leading-[1.35] tracking-tightish text-savr-ink/80 md:text-[1.35rem]">
          {ready && primary
            ? "Before you spend anything today — Savr already sees where you can save."
            : "Before you spend anything today, Ask Savr."}
        </p>
        {!primary && (
          <p className="animate-rise-delay mt-2 text-[13px] leading-relaxed text-savr-mute/90">
            {pulse}
          </p>
        )}

        {/* HERO — Ask */}
        <form onSubmit={onAsk} className="animate-rise-delay-2 mt-8">
          <label className="sr-only" htmlFor="savr-home-ask">
            Ask Savr
          </label>
          <div className={`home-ask animate-breathe ${asking || listening ? "home-ask-busy" : ""}`}>
            <div className="flex w-full items-center gap-2 px-3.5 sm:gap-3 sm:px-5">
              <span className="home-ask-label hidden sm:inline">Ask Savr</span>
              <div className="relative min-h-[1.55rem] min-w-0 flex-1">
                <input
                  ref={inputRef}
                  id="savr-home-ask"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full border-0 bg-transparent py-1 text-[16.5px] font-medium tracking-tightish text-savr-ink outline-none placeholder:text-transparent"
                  autoComplete="off"
                  autoFocus
                  disabled={asking}
                />
                {!query && (
                  <span
                    key={placeholderKey}
                    className="home-ask-placeholder pointer-events-none absolute inset-0 flex items-center text-[15px] text-savr-mute/50 sm:text-[16px]"
                    aria-hidden
                  >
                    {placeholder}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onVoice}
                disabled={asking || listening}
                className={`home-ask-icon ${listening ? "home-ask-icon-live" : ""}`}
                aria-label="Voice ask"
                title="Voice"
              >
                <MicIcon active={listening} />
              </button>
              <Link
                href="/scan"
                className="home-ask-icon"
                aria-label="Scan barcode to tip a shelf"
                title="Scan to tip"
              >
                <ScanIcon />
              </Link>
              <button
                type="submit"
                disabled={asking}
                className="home-ask-go disabled:opacity-70"
              >
                {asking ? "…" : "Go"}
              </button>
            </div>
          </div>
          {(asking || listening) && (
            <p className="home-status mt-3.5">
              <span className="home-status-dot" aria-hidden />
              {listening ? "Listening…" : "Savr is looking for the smartest path…"}
            </p>
          )}
          {voiceError && (
            <p className="mt-2 text-sm text-amber-800/90">{voiceError}</p>
          )}
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {POPULAR_ASKS.map((chip) => (
            <button
              key={chip.q}
              type="button"
              disabled={asking}
              onClick={() => goAsk(chip.q)}
              className="home-chip"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="home-stack alive-stack animate-rise-delay-2 mt-9">
          {/* Opportunity — rule-based, not AI theatre */}
          {ready && opportunities.length >= 2 ? (
            <div className="home-card-hero alive-card">
              <p className="home-eyebrow home-eyebrow-on-light">Today’s opportunity</p>
              <p className="mt-2.5 font-display text-xl font-bold tracking-tightish text-savr-ink md:text-[1.65rem]">
                I found {opportunities.length} ways you can save today
              </p>
              <p className="home-amount mt-2">{formatKes(waysTotal)}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-savr-mute">
                Potential across basket, fuel, and watches — not a promise, a path. Confirm on shelf.
              </p>
              <ul className="mt-5 space-y-2">
                {opportunities.map((o) => (
                  <li key={o.id}>
                    <Link href={o.href} className="home-way-row">
                      <span>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                          {o.eyebrow}
                        </span>
                        <span className="text-[14px] font-semibold text-savr-ink">{o.title}</span>
                      </span>
                      <span className="shrink-0 font-display text-[15px] font-bold tabular-nums text-savr-forest">
                        {formatKes(o.amountCents)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : primary ? (
            <Link href={primary.href} className="home-card-hero alive-card block">
              <p className="home-eyebrow home-eyebrow-on-light">Today’s opportunity</p>
              <p className="home-amount mt-3">{formatKes(primary.amountCents)}</p>
              <p className="mt-2.5 font-display text-lg font-bold tracking-tightish text-savr-ink">
                {primary.title}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-savr-mute">{primary.body}</p>
              <p className="mt-4 text-[13px] font-semibold text-savr-forest">{primary.cta}</p>
            </Link>
          ) : null}

          {/* Continue — medium */}
          <div className="home-card-mid alive-card">
            <Link href={cta.href} className="flex items-start justify-between gap-3">
              <div>
                <p className="home-eyebrow home-eyebrow-mute">Continue</p>
                <p className="mt-2 font-display text-[1.15rem] font-bold tracking-tightish text-savr-ink">
                  {cta.label}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-savr-mute">{cta.detail}</p>
              </div>
              {continueSaveCents >= 500 ? (
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                    Potential
                  </p>
                  <p className="mt-0.5 font-display text-2xl font-extrabold tabular-nums tracking-tightish text-savr-forest">
                    {formatKes(continueSaveCents)}
                  </p>
                </div>
              ) : (
                <span className="pt-1 text-sm font-semibold text-savr-forest">→</span>
              )}
            </Link>
            {cta.secondaryHref && cta.secondaryLabel && (
              <Link
                href={cta.secondaryHref}
                className="mt-3.5 inline-block text-[13px] font-semibold text-savr-mute transition hover:text-savr-forest"
              >
                {cta.secondaryLabel} →
              </Link>
            )}
          </div>

          {/* Wallet — medium */}
          <Link href="/wallet" className="home-card-mid alive-card block">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="home-eyebrow home-eyebrow-mute">Wallet</p>
                <p className="mt-2 font-display text-[1.15rem] font-bold tracking-tightish text-savr-ink">
                  {user
                    ? balanceCents > 0
                      ? `${formatKes(balanceCents)} cashback`
                      : todayCents > 0
                        ? `${formatKes(todayCents)} kept today`
                        : "Your savings ledger"
                    : "Sign in to keep cashback"}
                </p>
              </div>
              <span className="text-sm font-semibold text-savr-forest">→</span>
            </div>
          </Link>

          <Link href="/scan" className="home-card-sm alive-card block">
            <p className="home-eyebrow home-eyebrow-mute">Capture</p>
            <p className="mt-2 font-display text-[1.15rem] font-bold tracking-tightish text-savr-ink">
              Scan to tip
            </p>
            <p className="mt-1 text-[13px] text-savr-mute">
              Barcode or Savr QR → confirm KES → same tip as Prices
            </p>
          </Link>

          {/* Recent — small */}
          {recent.length > 0 && (
            <div className="home-card-sm">
              <p className="home-eyebrow home-eyebrow-mute">Recent</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => goAsk(r)}
                    className="home-chip"
                  >
                    {r.length > 28 ? `${r.slice(0, 28)}…` : r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nearby map preview — medium */}
          <Link href="/map" className="home-card-map alive-card block">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="home-eyebrow home-eyebrow-on-light">Nearby</p>
                <p className="mt-2 font-display text-[1.15rem] font-bold tracking-tightish text-savr-ink">
                  {nearbyOffers > 0
                    ? `${nearby.grocery} supermarket${nearby.grocery === 1 ? "" : "s"} · ${nearby.fuel} fuel`
                    : "Value map"}
                </p>
                <p className="mt-1 text-[13px] text-savr-mute">
                  {nearbyOffers > 0
                    ? `${nearbyOffers} places Savr can rank near you`
                    : "See where Nairobi saves"}
                </p>
              </div>
              <span className="home-map-thumb" aria-hidden />
            </div>
          </Link>

          {/* Lifetime — small */}
          {ready && lifetimeCents > 0 && (
            <div className="home-card-sm flex items-center justify-between gap-3">
              <div>
                <p className="home-eyebrow home-eyebrow-mute">Lifetime saved</p>
                <p className="mt-1.5 font-display text-xl font-bold tabular-nums tracking-tightish text-savr-ink">
                  {formatKes(lifetimeCents)}
                </p>
              </div>
              <Link
                href="/wallet"
                className="text-[13px] font-semibold text-savr-forest transition hover:text-savr-ink"
              >
                Wallet →
              </Link>
            </div>
          )}

          {/* Market share */}
          <div className="home-card-sm space-y-3">
            <div>
              <p className="home-eyebrow home-eyebrow-mute">Share Savr</p>
              <p className="mt-1.5 text-[14px] font-semibold text-savr-ink">
                Invite a Nairobi shopper
              </p>
              <p className="mt-1 text-[13px] text-savr-mute">
                Basket compare is open — tippers make prices honest.
              </p>
            </div>
            <a
              href={whatsAppShareUrl(buildMarketInviteShare())}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex text-sm"
            >
              WhatsApp invite →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onresult: ((event: { results?: SpeechRecognitionResultList }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
      />
      <path
        d="M6 11a6 6 0 0 0 12 0M12 17v3"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 8V5h3M16 5h3v3M19 16v3h-3M8 19H5v-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 12h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
