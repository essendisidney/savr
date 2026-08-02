"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { formatKes } from "@/lib/compare";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";

function InviteInner() {
  const params = useSearchParams();
  const router = useRouter();
  const saveKes = Math.max(0, Number(params.get("save") ?? "0") || 0);
  const store = (params.get("store") ?? "Savr").slice(0, 40);
  const nextPath = params.get("next") || "/basket";
  const cents = Math.round(saveKes * 100);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function redeemCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not redeem code");
        setBusy(false);
        return;
      }
      router.replace(nextPath.startsWith("/") ? nextPath : "/basket");
      router.refresh();
    } catch {
      setError("Network error — try again");
      setBusy(false);
    }
  }

  return (
    <PageFrame>
      <PageHero
        theme="wallet"
        title="Look what we saved"
        subtitle="Enter your invite code to continue."
      />

      <div className="page-band">
        <PageShell>
          <div className="mx-auto max-w-xl space-y-8">
            <SavingsMoment
              amountLabel={store === "Savr" ? "Kept with Savr" : `Smarter at ${store}`}
              amountCents={cents > 0 ? cents : 25000}
              detail={
                cents > 0
                  ? "Price savings vs the priciest option on their list"
                  : "Households in Nairobi keep money every week by ranking the full basket first"
              }
            />

            <form onSubmit={redeemCode} className="space-y-3 border border-savr-ink/[0.08] bg-white p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                Invite code
              </p>
              <label className="block">
                <span className="sr-only">Invite code</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="field"
                  placeholder="Your code"
                  autoComplete="off"
                  required
                />
              </label>
              {error && <p className="text-sm font-medium text-red-700">{error}</p>}
              <button type="submit" disabled={busy || !code.trim()} className="btn-primary disabled:opacity-50">
                {busy ? "Checking…" : "Continue"}
              </button>
            </form>

            <div className="space-y-3 text-center sm:text-left">
              <h2 className="font-display text-2xl font-bold tracking-tightish text-savr-ink md:text-3xl">
                Before you spend, Savr it.
              </h2>
              <p className="text-[15px] leading-relaxed text-savr-mute">
                Compare your weekly list across Naivas, Quickmart, and Carrefour — then pick the best
                total value, not the loudest aisle.
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link href="/basket" className="btn-primary">
                  Compare my basket
                </Link>
                <Link href="/prices" className="btn-ghost">
                  Check one price
                </Link>
              </div>
              {cents > 0 && (
                <p className="pt-2 text-xs text-savr-mute">
                  Shared save · {formatKes(cents)}
                  {store !== "Savr" ? ` · ${store}` : ""}
                </p>
              )}
            </div>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <div className="h-52 animate-pulse bg-savr-night/80" />
        </PageFrame>
      }
    >
      <InviteInner />
    </Suspense>
  );
}
