"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadWallet } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { formatKes } from "@/lib/compare";

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
    return <p className="text-savr-ink/60">Loading wallet…</p>;
  }

  if (error === "signed_out" || !user) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-4xl">Wallet</h1>
        <p className="text-savr-ink/70">Sign in to see savings cashback.</p>
        <Link href="/login" className="inline-block bg-savr-forest px-4 py-2 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-savr-clay">Savr Wallet</p>
        <h1 className="mt-2 font-display text-4xl">Savings cashback</h1>
        <p className="mt-2 text-savr-ink/70">Live ledger from your account.</p>
      </div>

      <div className="border border-savr-forest/30 bg-savr-mint/40 px-6 py-8">
        <p className="text-sm uppercase tracking-wide text-savr-forest">Available</p>
        <p className="mt-2 font-display text-5xl">{formatKes(balanceCents)}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-savr-ink/60">Ledger</h2>
        {ledger.length === 0 ? (
          <p className="mt-3 text-sm text-savr-ink/60">
            No earnings yet. Compare a basket and choose the recommendation.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-savr-ink/10 border-y border-savr-ink/10">
            {ledger.map((e, i) => (
              <li key={`${e.when}-${i}`} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{e.note ?? "Cashback"}</p>
                  <p className="text-savr-ink/50">{e.when}</p>
                </div>
                <p className="font-semibold text-savr-forest">+{formatKes(e.amountCents)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
