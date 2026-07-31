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
        <p className="animate-pulse text-savr-ink/50">Opening wallet…</p>
      </PageShell>
    );
  }

  if (error === "signed_out" || !user) {
    return (
      <PageShell>
        <div className="animate-rise space-y-5">
          <h1 className="font-display text-4xl font-extrabold">Your savings stash</h1>
          <p className="text-savr-ink/65">Sign in to see cashback from smarter choices.</p>
          <Link href="/login" className="btn-primary">
            Sign in to wallet
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-8">
        <div className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-savr-forest">
            Savr Wallet
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Money you earned by choosing well
          </h1>
        </div>

        <div className="animate-countPop border-2 border-savr-leaf bg-white/70 px-6 py-8">
          <p className="text-xs font-bold uppercase tracking-wide text-savr-forest">Available</p>
          <p className="mt-2 font-display text-5xl font-extrabold md:text-6xl">
            {formatKes(balanceCents)}
          </p>
        </div>

        <div className="animate-rise-delay">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-savr-ink/45">
            Activity
          </h2>
          {ledger.length === 0 ? (
            <p className="mt-4 text-sm text-savr-ink/60">
              Empty for now —{" "}
              <Link href="/basket" className="font-semibold text-savr-forest hover:underline">
                compare a basket
              </Link>{" "}
              and choose the winner.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-savr-ink/10 border-y border-savr-ink/10 bg-white/50">
              {ledger.map((e, i) => (
                <li key={`${e.when}-${i}`} className="flex items-center justify-between px-3 py-3.5 text-sm">
                  <div>
                    <p className="font-medium">{e.note ?? "Cashback"}</p>
                    <p className="text-savr-ink/45">{e.when}</p>
                  </div>
                  <p className="font-display text-lg font-bold text-savr-forest">
                    +{formatKes(e.amountCents)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
