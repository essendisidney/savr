"use client";

import { useState } from "react";
import { formatKes } from "@/lib/compare";
import { savingsBuys } from "@/lib/intents";
import { sharePayload, type SharePayload } from "@/lib/share";

export function SavingsMoment({
  amountLabel,
  amountCents,
  detail,
  share,
  paidCents,
  averageCents,
}: {
  amountLabel: string;
  amountCents: number;
  detail: string;
  share?: SharePayload;
  /** What you'd pay at the recommended store (net). */
  paidCents?: number;
  /** Average net across compared stores. */
  averageCents?: number;
}) {
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const buys = savingsBuys(amountCents);
  const beat =
    paidCents != null &&
    averageCents != null &&
    averageCents > paidCents &&
    amountCents > 0;

  async function onShare() {
    if (!share) return;
    const result = await sharePayload(share);
    if (result === "shared") setShareStatus("Shared");
    else if (result === "copied") setShareStatus("Link copied");
    else setShareStatus(null);
  }

  return (
    <div className="savings-moment animate-rise relative overflow-hidden rounded-card-lg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,197,24,0.55),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(14,159,95,0.45),transparent_50%)]" />
      <div className="relative flex flex-col gap-4 px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-savr-ink/70">
              {amountLabel}
            </p>
            <p className="mt-1 font-display text-5xl font-extrabold tracking-tightish tabular-nums text-savr-ink md:text-6xl">
              {formatKes(amountCents)}
            </p>
            {buys && (
              <p className="mt-2 text-sm font-semibold text-savr-ink/75">{buys}</p>
            )}
          </div>
          <p className="max-w-xs text-[15px] font-medium leading-snug text-savr-ink/80 sm:text-right">
            {detail}
          </p>
        </div>

        {beat && (
          <div className="rounded-2xl bg-savr-ink/10 px-4 py-3 text-sm text-savr-ink">
            <p className="font-semibold">You beat the pack</p>
            <p className="mt-1 text-savr-ink/80">
              You&apos;d pay {formatKes(paidCents!)} · average compared store{" "}
              {formatKes(averageCents!)} · you keep the difference.
            </p>
          </div>
        )}

        {share && amountCents > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={onShare} className="btn-dark px-4 py-2.5 text-sm">
              Share this save
            </button>
            {shareStatus && (
              <span className="text-sm font-semibold text-savr-ink/70">{shareStatus}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
