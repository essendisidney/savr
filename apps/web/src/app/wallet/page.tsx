"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadWallet } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const [balanceCents, setBalanceCents] = useState(0);
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
          title="Your savings stash"
          subtitle="Sign in to see cashback from smarter choices."
          action={{ href: "/login", label: "Sign in" }}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="wallet"
        title="Earned by choosing well"
        subtitle="Savings cashback from every smarter decision."
      />

      <div className="page-band">
        <PageShell>
          <div className="space-y-8">
            <div className="savings-moment animate-rise relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,197,24,0.5),transparent_55%)]" />
              <div className="relative px-6 py-8 md:px-8 md:py-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-savr-ink/70">
                  Available now
                </p>
                <p className="mt-2 font-display text-6xl font-extrabold tracking-tightish tabular-nums text-savr-ink md:text-7xl">
                  {formatKes(balanceCents)}
                </p>
              </div>
            </div>

            <section className="animate-rise-delay">
              <h2 className="font-display text-lg font-bold tracking-tightish">Activity</h2>
              {ledger.length === 0 ? (
                <div className="mt-4 border border-dashed border-savr-forest/40 bg-white px-5 py-8 text-center">
                  <p className="text-[15px] text-savr-mute">
                    Nothing yet —{" "}
                    <Link href="/basket" className="font-semibold text-savr-forest hover:underline">
                      compare a basket
                    </Link>{" "}
                    and pick the winner.
                  </p>
                </div>
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
