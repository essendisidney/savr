"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadWallet } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";
import { PageShell } from "@/components/PageShell";

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
      <PageShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-savr-fog" />
          <div className="h-28 w-full bg-savr-fog" />
        </div>
      </PageShell>
    );
  }

  if (error === "signed_out" || !user) {
    return (
      <PageShell>
        <div className="animate-rise space-y-5">
          <h1 className="font-display text-4xl font-extrabold tracking-tightish">Your wallet</h1>
          <p className="text-[15px] text-savr-mute">
            Sign in to see cashback from smarter choices.
          </p>
          <Link href="/login" className="btn-primary inline-flex">
            Sign in
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-8">
        <header className="animate-rise">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-savr-forest">
            Savr Wallet
          </p>
          <h1 className="mt-2 font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-tightish md:text-5xl">
            Earned by choosing well
          </h1>
        </header>

        <div className="animate-rise-delay border border-savr-leaf/40 bg-savr-night px-6 py-8 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-signal">
            Available
          </p>
          <p className="mt-2 font-display text-5xl font-extrabold tracking-tightish tabular-nums md:text-6xl">
            {formatKes(balanceCents)}
          </p>
        </div>

        <section className="animate-rise-delay-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-mute">
            Activity
          </h2>
          {ledger.length === 0 ? (
            <p className="mt-4 text-[15px] text-savr-mute">
              Nothing yet —{" "}
              <Link href="/basket" className="font-semibold text-savr-forest hover:underline">
                compare a basket
              </Link>{" "}
              and pick the winner.
            </p>
          ) : (
            <ul className="surface mt-3 divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.07]">
              {ledger.map((e, i) => (
                <li
                  key={`${e.when}-${i}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div>
                    <p className="text-[15px] font-medium">{e.note ?? "Cashback"}</p>
                    <p className="text-xs text-savr-mute">{e.when}</p>
                  </div>
                  <p className="font-display text-lg font-bold text-savr-forest tabular-nums">
                    +{formatKes(e.amountCents)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
