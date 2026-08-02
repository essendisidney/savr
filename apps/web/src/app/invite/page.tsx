"use client";

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
        title="Welcome to Savr"
        subtitle="Enter your invite code to unlock Nairobi shopping, rides, and fuel."
      />

      <div className="page-band">
        <PageShell>
          <div className="mx-auto max-w-lg space-y-8">
            {cents > 0 && (
              <SavingsMoment
                amountLabel={store === "Savr" ? "Kept with Savr" : `Smarter at ${store}`}
                amountCents={cents}
                detail="Price savings vs the priciest option on their list"
              />
            )}

            <form onSubmit={redeemCode} className="panel space-y-4 p-5 sm:p-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                  Invite code
                </p>
                <p className="mt-1 text-sm text-savr-mute">
                  One code unlocks the full product on this device.
                </p>
              </div>
              <label className="block">
                <span className="sr-only">Invite code</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="field font-display text-lg tracking-[0.12em]"
                  placeholder="YOUR CODE"
                  autoComplete="off"
                  autoFocus
                  required
                />
              </label>
              {error && <p className="text-sm font-medium text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {busy ? "Checking…" : "Continue"}
              </button>
            </form>
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
          <div className="h-28 animate-pulse bg-savr-fog/80" />
        </PageFrame>
      }
    >
      <InviteInner />
    </Suspense>
  );
}
