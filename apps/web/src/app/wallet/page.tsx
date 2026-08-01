"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadWallet, type CompareHistoryItem } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const [balanceCents, setBalanceCents] = useState(0);
  const [lifetimeSavingsCents, setLifetimeSavingsCents] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [history, setHistory] = useState<CompareHistoryItem[]>([]);
  const [ledger, setLedger] = useState<{ note: string | null; amountCents: number; when: string }[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError("signed_out");
      return;
    }
    loadWallet().then((w) => {
      setBalanceCents(w.balanceCents);
      setLifetimeSavingsCents(w.lifetimeSavingsCents);
      setCompareCount(w.compareCount);
      setHistory(w.history);
      setLedger(w.ledger);
      setError(w.error === "signed_out" ? "signed_out" : w.error ?? null);
      setLoading(false);
    });
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <PageFrame>
        <div className="h-52 animate-pulse bg-savr-night/80" />
        <PageShell>
          <div className="h-32 animate-pulse bg-savr-fog" />
        </PageShell>
      </PageFrame>
    );
  }

  if (error === "signed_out" || !user) {
    return (
      <PageFrame>
        <PageHero
          theme="wallet"
          title="Saved with Savr"
          subtitle="Sign in to track lifetime savings and cashback from smarter choices."
          action={{ href: "/login", label: "Sign in" }}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="wallet"
        title="Saved with Savr"
        subtitle={
          compareCount > 0
            ? `${compareCount} smart shop${compareCount === 1 ? "" : "s"} · cashback ready to use`
            : "Every smarter basket adds up here."
        }
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            <div className="savings-moment animate-rise relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,197,24,0.55),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(14,159,95,0.4),transparent_50%)]" />
              <div className="relative px-6 py-8 md:px-8 md:py-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-savr-ink/70">
                  Lifetime price savings
                </p>
                <p className="mt-2 font-display text-6xl font-extrabold tracking-tightish tabular-nums text-savr-ink md:text-7xl">
                  {formatKes(lifetimeSavingsCents)}
                </p>
                <p className="mt-3 max-w-sm text-[15px] font-medium text-savr-ink/75">
                  What you kept vs the priciest basket each time you locked in a choice.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="animate-rise border border-savr-ink/[0.08] bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                  Wallet cashback
                </p>
                <p className="mt-2 font-display text-3xl font-bold tracking-tightish tabular-nums text-savr-forest">
                  {formatKes(balanceCents)}
                </p>
              </div>
              <div
                className="animate-rise border border-savr-ink/[0.08] bg-white px-5 py-5"
                style={{ animationDelay: "0.06s" }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                  Compares locked in
                </p>
                <p className="mt-2 font-display text-3xl font-bold tracking-tightish tabular-nums text-savr-ink">
                  {compareCount}
                </p>
              </div>
            </div>

            <section className="animate-rise-delay">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-bold tracking-tightish">Shopping history</h2>
                <Link href="/basket" className="text-sm font-semibold text-savr-forest hover:underline">
                  New compare →
                </Link>
              </div>
              {history.length === 0 ? (
                <div className="mt-4 border border-dashed border-savr-forest/40 bg-white px-5 py-8 text-center">
                  <p className="text-[15px] text-savr-mute">
                    Nothing yet —{" "}
                    <Link href="/basket" className="font-semibold text-savr-forest hover:underline">
                      compare a basket
                    </Link>{" "}
                    and choose a store to start your streak.
                  </p>
                </div>
              ) : (
                <ol className="mt-3 space-y-3">
                  {history.map((item, i) => (
                    <li
                      key={item.id}
                      className={`animate-rise relative overflow-hidden border ${
                        item.followedAdvice
                          ? "border-transparent bg-savr-night text-white"
                          : "border-savr-ink/[0.08] bg-white"
                      }`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {item.followedAdvice && (
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-savr-signal" />
                      )}
                      <div className="px-4 py-4 sm:px-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={`font-display text-xl font-bold tracking-tightish ${
                                item.followedAdvice ? "text-white" : "text-savr-ink"
                              }`}
                            >
                              {item.chosenMerchant}
                            </p>
                            <p
                              className={`mt-0.5 text-xs font-semibold ${
                                item.followedAdvice ? "text-savr-signal" : "text-savr-mute"
                              }`}
                            >
                              {item.followedAdvice
                                ? "Followed Savr pick"
                                : `Savr suggested ${item.recommendedMerchant}`}
                              <span className="mx-1.5 opacity-40">·</span>
                              {item.when}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-display text-xl font-bold tabular-nums ${
                                item.followedAdvice ? "text-savr-signal" : "text-savr-forest"
                              }`}
                            >
                              {formatKes(item.savingsCents)}
                            </p>
                            <p
                              className={`text-xs ${
                                item.followedAdvice ? "text-white/55" : "text-savr-mute"
                              }`}
                            >
                              saved
                              {item.cashbackCents > 0
                                ? ` · +${formatKes(item.cashbackCents)} CB`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section>
              <h2 className="font-display text-lg font-bold tracking-tightish">Cashback activity</h2>
              {ledger.length === 0 ? (
                <p className="mt-3 text-sm text-savr-mute">
                  Cashback credits appear here when you lock in a recommended basket.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.08] bg-white shadow-[0_12px_40px_-28px_rgba(4,36,25,0.45)]">
                  {ledger.map((e, i) => (
                    <li
                      key={`${e.when}-${i}`}
                      className="flex items-center justify-between gap-3 px-4 py-4"
                    >
                      <div>
                        <p className="text-[15px] font-medium">{e.note ?? "Cashback"}</p>
                        <p className="text-xs text-savr-mute">{e.when}</p>
                      </div>
                      <p className="font-display text-xl font-bold text-savr-forest tabular-nums">
                        +{formatKes(e.amountCents)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
