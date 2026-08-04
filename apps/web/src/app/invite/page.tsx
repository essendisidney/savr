"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { formatKes } from "@/lib/compare";
import { cityProofFromCatalog } from "@/lib/city-proof";
import { loadCatalog } from "@/lib/catalog";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";
import { supportEmail, supportMailto, supportWhatsAppUrl } from "@/lib/support";
import { buildTipperInviteShare, whatsAppShareUrl } from "@/lib/share";

function InviteInner() {
  const params = useSearchParams();
  const router = useRouter();
  const saveKes = Math.max(0, Number(params.get("save") ?? "0") || 0);
  const store = (params.get("store") ?? "Savr").slice(0, 40);
  const nextPath = params.get("next") || "/basket?staples=1";
  const safeNext = nextPath.startsWith("/") ? nextPath : "/basket?staples=1";
  const carriesBasket = safeNext.includes("list=") || safeNext.startsWith("/l/");
  const cents = Math.round(saveKes * 100);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [proofLine, setProofLine] = useState<string | null>(null);
  const wa = supportWhatsAppUrl();

  useEffect(() => {
    void loadCatalog().then((c) => setProofLine(cityProofFromCatalog(c)?.line ?? null));
  }, []);

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
      router.replace(safeNext);
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
        title="Before you spend, Savr it"
        subtitle="A friend shared what they kept — or left on the table — by checking first."
      />

      <div className="page-band">
        <PageShell>
          <div className="mx-auto max-w-lg space-y-8">
            {cents > 0 ? (
              <SavingsMoment
                amountLabel={store === "Savr" ? "Kept with Savr" : `Smarter at ${store}`}
                amountCents={cents}
                detail={
                  carriesBasket
                    ? safeNext.startsWith("/l/")
                      ? "Same household list — add items together, then compare before you spend."
                      : "Same basket they compared — see where you’d shop before you spend."
                    : "Real Nairobi basket math — compare before your next shop."
                }
              />
            ) : (
              <div className="card px-5 py-6">
                <p className="font-display text-xl font-bold text-savr-ink">
                  Nairobi&apos;s spending check
                </p>
                <p className="mt-2 text-sm text-savr-mute">
                  Compare grocery baskets across branches, tip shelf prices, and see what you keep.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Link href={safeNext} className="btn-primary flex w-full justify-center">
                {safeNext.startsWith("/l/")
                  ? "Open household list"
                  : carriesBasket
                    ? "Compare their basket"
                    : safeNext.includes("staples=1")
                      ? "Compare this week’s staples"
                      : safeNext.startsWith("/scan")
                        ? "Open scan to tip"
                        : "Open Savr"}
              </Link>
              <Link
                href="/check"
                className="btn-ghost flex w-full justify-center text-sm"
              >
                Or check a shop you already did
              </Link>
            </div>

            {proofLine && (
              <p className="text-center text-sm text-savr-mute">{proofLine}</p>
            )}

            <div className="card space-y-3 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                Need help?
              </p>
              <div className="flex flex-wrap gap-2">
                <a href={supportMailto()} className="btn-ghost text-sm">
                  {supportEmail()}
                </a>
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost text-sm"
                  >
                    WhatsApp support
                  </a>
                )}
                <a
                  href={whatsAppShareUrl(buildTipperInviteShare())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dark text-sm"
                >
                  Invite a tipper
                </a>
              </div>
            </div>

            <div className="border-t border-savr-ink/[0.06] pt-6">
              {!showCode ? (
                <button
                  type="button"
                  onClick={() => setShowCode(true)}
                  className="text-sm font-semibold text-savr-mute hover:text-savr-forest hover:underline"
                >
                  Have an invite code?
                </button>
              ) : (
                <form onSubmit={redeemCode} className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                      Invite code
                    </p>
                    <p className="mt-1 text-sm text-savr-mute">
                      Optional — the app is open. Codes matter only if we re-enable the wall.
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
                    />
                  </label>
                  {error && <p className="text-sm font-medium text-red-700">{error}</p>}
                  <button
                    type="submit"
                    disabled={busy || !code.trim()}
                    className="btn-dark w-full disabled:opacity-50"
                  >
                    {busy ? "Checking…" : "Redeem code"}
                  </button>
                </form>
              )}
            </div>

            {cents > 0 && (
              <p className="text-center text-xs text-savr-mute">
                Their save was about {formatKes(cents)}
                {store !== "Savr" ? ` toward ${store}` : ""}. Yours will be your own basket.
              </p>
            )}
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
