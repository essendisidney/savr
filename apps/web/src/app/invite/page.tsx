"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatKes } from "@/lib/compare";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SavingsMoment } from "@/components/SavingsMoment";

function InviteInner() {
  const params = useSearchParams();
  const saveKes = Math.max(0, Number(params.get("save") ?? "0") || 0);
  const store = (params.get("store") ?? "Savr").slice(0, 40);
  const cents = Math.round(saveKes * 100);

  return (
    <PageFrame>
      <PageHero
        theme="wallet"
        title="Look what we saved"
        subtitle="A friend checked Savr before they spent — your turn."
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
