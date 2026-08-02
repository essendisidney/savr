"use client";

import { useState } from "react";
import { formatKes } from "@/lib/compare";
import { savingsBuys } from "@/lib/intents";
import { sharePayload, whatsAppShareUrl, type SharePayload } from "@/lib/share";
import { track } from "@/lib/track";

export function SavingsMoment({
  amountLabel,
  amountCents,
  detail,
  share,
  paidCents,
  averageCents,
  shareLabel = "Share this save",
  emphasizeShare = false,
}: {
  amountLabel: string;
  amountCents: number;
  detail: string;
  share?: SharePayload;
  /** What you'd pay at the recommended store (net). */
  paidCents?: number;
  /** Average net across compared stores. */
  averageCents?: number;
  shareLabel?: string;
  /** Make WhatsApp the primary action (post-shop viral loop). */
  emphasizeShare?: boolean;
}) {
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const buys = savingsBuys(amountCents);
  const beat =
    paidCents != null &&
    averageCents != null &&
    averageCents > paidCents &&
    amountCents > 0;
  const canShare = Boolean(share);

  async function onShare() {
    if (!share) return;
    track("share_save", { via: "sheet", amountKes: Math.round(amountCents / 100) });
    const result = await sharePayload(share);
    if (result === "shared") setShareStatus("Shared");
    else if (result === "copied") setShareStatus("Link copied");
    else setShareStatus(null);
  }

  function onWhatsApp() {
    if (!share) return;
    track("share_save", { via: "whatsapp", amountKes: Math.round(amountCents / 100) });
    window.open(whatsAppShareUrl(share), "_blank", "noopener,noreferrer");
    setShareStatus("Opening WhatsApp…");
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
              {formatKes(Math.max(0, amountCents))}
            </p>
            {buys && amountCents > 0 && (
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

        {canShare && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onWhatsApp}
              className={
                emphasizeShare
                  ? "btn-primary px-4 py-2.5 text-sm"
                  : "btn-dark px-4 py-2.5 text-sm"
              }
            >
              WhatsApp this
            </button>
            <button
              type="button"
              onClick={onShare}
              className={
                emphasizeShare
                  ? "btn-dark px-4 py-2.5 text-sm"
                  : "btn-ghost px-4 py-2.5 text-sm"
              }
            >
              {shareLabel}
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
