"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { submitCrowdsourcePrice } from "@/lib/actions";
import { formatKes } from "@/lib/compare";
import { formatPriceFreshness, freshnessClassName, formatBasketTrend, formatPriceTrend, trendClassName } from "@/lib/freshness";
import { formatDistanceKm } from "@/lib/geo";
import { track } from "@/lib/track";
import type { BasketResult, LineItemPrice } from "@/lib/types";

export function RankList({
  results,
  onChoose,
  busy,
  chooseLabel,
  getLineItems,
  preferredMerchantIds = [],
  canTip = false,
  onPriceTipped,
}: {
  results: BasketResult[];
  onChoose?: (merchantId: string) => void;
  busy?: boolean;
  chooseLabel?: (name: string) => string;
  getLineItems?: (merchantId: string) => LineItemPrice[];
  preferredMerchantIds?: string[];
  canTip?: boolean;
  onPriceTipped?: () => void | Promise<void>;
}) {
  const firstIncomplete =
    results.find((r) => r.coverage < 1 && r.coverage > 0)?.merchantId ??
    results.find((r) => r.coverage < 1)?.merchantId ??
    null;
  const [openId, setOpenId] = useState<string | null>(
    firstIncomplete ?? results.find((r) => r.isRecommended)?.merchantId ?? null,
  );
  const [tipKey, setTipKey] = useState<string | null>(null);
  const [tipPrice, setTipPrice] = useState("");
  const [tipBusy, setTipBusy] = useState(false);
  const [tipStatus, setTipStatus] = useState<string | null>(null);

  const maxTotal = Math.max(...results.map((r) => r.totalCents), 1);

  async function onTip(
    e: FormEvent,
    merchantId: string,
    productId: string,
  ) {
    e.preventDefault();
    setTipBusy(true);
    setTipStatus(null);
    const res = await submitCrowdsourcePrice({
      merchantId,
      productId,
      priceKes: Number(tipPrice),
    });
    setTipBusy(false);
    if ("error" in res) {
      setTipStatus(res.error);
      return;
    }
    setTipStatus("Thanks — price updated.");
    setTipKey(null);
    setTipPrice("");
    track("basket_coverage_tip", { merchantId, productId });
    await onPriceTipped?.();
  }

  return (
    <ol className="space-y-4">
      {results.map((r, i) => {
        const width = Math.max(14, (r.totalCents / maxTotal) * 100);
        const open = openId === r.merchantId;
        const allLines = getLineItems ? getLineItems(r.merchantId) : [];
        const lines = open ? allLines : [];
        const missing = allLines.filter((l) => l.lineCents == null);
        const preferred = preferredMerchantIds.includes(r.merchantId);
        const distanceLabel = formatDistanceKm(r.distanceKm);
        const gapCount = missing.length;

        return (
          <li
            key={r.merchantId}
            className={`animate-rise group relative overflow-hidden border transition duration-300 ${
              r.isRecommended
                ? "card-winner"
                : "card hover:border-savr-forest/30"
            }`}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {r.isRecommended && (
              <div className="absolute inset-y-0 left-0 w-1.5 bg-savr-forest" />
            )}

            <div className="px-4 py-5 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${
                      r.isRecommended
                        ? "bg-savr-forest text-white"
                        : "bg-savr-fog text-savr-mute"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p
                      className={`font-display text-2xl font-bold tracking-tightish ${
                        r.isRecommended ? "text-savr-ink" : "text-savr-ink"
                      }`}
                    >
                      {r.merchantName}
                    </p>
                    {r.branchName && (
                      <p
                        className={`text-xs ${
                          r.isRecommended ? "text-savr-mute" : "text-savr-mute"
                        }`}
                      >
                        {r.branchName}
                      </p>
                    )}
                    <p
                      className={`mt-0.5 text-xs font-semibold ${
                        r.isRecommended ? "text-savr-forest" : "text-savr-mute"
                      }`}
                    >
                      {r.isRecommended
                        ? "Winner · best total value"
                        : `${Math.round(r.coverage * 100)}% list coverage`}
                      {preferred ? (r.isRecommended ? " · Your store" : " · Your preferred") : ""}
                      {r.coverage < 1
                        ? ` · ${gapCount || "some"} missing`
                        : ""}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-display text-2xl font-bold tracking-tightish tabular-nums ${
                    r.isRecommended ? "text-savr-ink" : "text-savr-ink"
                  }`}
                >
                  {formatKes(r.totalCents)}
                </p>
              </div>

              <div
                className={`mt-4 h-2 overflow-hidden ${
                  r.isRecommended ? "bg-savr-forest/15" : "bg-savr-fog"
                }`}
              >
                <div
                  className={`rank-bar h-full animate-barGrow ${
                    r.isRecommended ? "bg-savr-forest" : "bg-savr-forest/70"
                  }`}
                  style={{ width: `${width}%`, animationDelay: `${0.12 + i * 0.08}s` }}
                />
              </div>

              <p
                className={`mt-3 text-sm ${
                  r.isRecommended ? "text-savr-mute" : "text-savr-mute"
                }`}
              >
                {r.promoCents > 0 && (
                  <>
                    Promo −{formatKes(r.promoCents)}
                    {r.promoLabel ? ` · ${r.promoLabel}` : ""}
                    <span className="mx-1.5 opacity-40">·</span>
                  </>
                )}
                Cashback {formatKes(r.cashbackCents)}
                <span className="mx-1.5 opacity-40">·</span>
                Net{" "}
                <span
                  className={
                    "font-semibold text-savr-ink"
                  }
                >
                  {formatKes(r.netCents)}
                </span>
                {distanceLabel && (
                  <>
                    <span className="mx-1.5 opacity-40">·</span>
                    {distanceLabel}
                  </>
                )}
              </p>

              {(() => {
                const basketTrend = formatBasketTrend(r.weekDeltaCents);
                if (!basketTrend.label) return null;
                return (
                  <p
                    className={`mt-1.5 text-xs font-semibold ${trendClassName(
                      basketTrend.direction,
                      "light",
                    )}`}
                  >
                    {basketTrend.label}
                  </p>
                );
              })()}

              {r.coverage < 1 && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    r.isRecommended ? "text-amber-800" : "text-amber-800"
                  }`}
                >
                  Incomplete prices weaken this rank — tip shelf prices you saw.
                </p>
              )}

              {getLineItems && (
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.merchantId)}
                  className={`mt-3 text-sm font-semibold ${
                    "text-savr-forest"
                  }`}
                >
                  {open
                    ? "Hide items ▲"
                    : r.coverage < 1
                      ? "Tip missing prices ▼"
                      : "See item prices ▼"}
                </button>
              )}

              {open && lines.length > 0 && (
                <ul
                  className={`mt-3 divide-y border ${
                    r.isRecommended
                      ? "divide-white/10 border-white/15 bg-white/5"
                      : "divide-savr-ink/[0.06] border-savr-ink/[0.08] bg-savr-mist/60"
                  }`}
                >
                  {lines.map((line) => {
                    const key = `${r.merchantId}:${line.productId}`;
                    const tipping = tipKey === key;
                    const missingLine = line.lineCents == null;
                    const fresh =
                      !missingLine && line.observedAt
                        ? formatPriceFreshness(line.observedAt, line.source)
                        : null;
                    const trend =
                      !missingLine && line.unitCents != null
                        ? formatPriceTrend(
                            line.unitCents,
                            line.prevPriceCents,
                            line.prevObservedAt,
                          )
                        : null;
                    return (
                      <li key={line.productId} className="px-3 py-2.5 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className={r.isRecommended ? "text-savr-ink" : "text-savr-ink"}>
                            {line.name}
                            {line.quantity > 1 ? (
                              <span className="opacity-60"> ×{line.quantity}</span>
                            ) : null}
                            {fresh?.label ? (
                              <span
                                className={`mt-0.5 block text-[11px] font-medium ${freshnessClassName(
                                  fresh.stale,
                                  "light",
                                )}`}
                              >
                                {fresh.label}
                              </span>
                            ) : null}
                            {trend?.label ? (
                              <span
                                className={`mt-0.5 block text-[11px] font-semibold ${trendClassName(
                                  trend.direction,
                                  "light",
                                )}`}
                              >
                                {trend.label}
                              </span>
                            ) : null}
                          </span>
                          <span
                            className={`shrink-0 font-semibold tabular-nums ${
                              missingLine ? "text-amber-800" : "text-savr-ink"
                            }`}
                          >
                            {missingLine
                              ? "No price"
                              : line.promoCents && line.promoCents > 0
                                ? `${formatKes(line.lineCents! - line.promoCents)}`
                                : formatKes(line.lineCents!)}
                            {line.promoCents && line.promoCents > 0 ? (
                              <span
                                className={`ml-1.5 text-xs font-medium ${
                                  "text-savr-forest"
                                }`}
                              >
                                −{formatKes(line.promoCents)}
                              </span>
                            ) : null}
                          </span>
                        </div>
                        {missingLine && (
                          <div className="mt-2">
                            {!canTip ? (
                              <Link
                                href="/login?next=/basket"
                                className={`text-xs font-semibold ${
                                  "text-savr-forest"
                                } hover:underline`}
                              >
                                Sign in to tip this price
                              </Link>
                            ) : !tipping ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setTipKey(key);
                                  setTipPrice("");
                                  setTipStatus(null);
                                }}
                                className={`text-xs font-semibold ${
                                  "text-savr-forest"
                                } hover:underline`}
                              >
                                Tip shelf price
                              </button>
                            ) : (
                              <form
                                className="mt-1 flex flex-wrap items-center gap-2"
                                onSubmit={(e) => onTip(e, r.merchantId, line.productId)}
                              >
                                <input
                                  value={tipPrice}
                                  onChange={(ev) => setTipPrice(ev.target.value)}
                                  inputMode="numeric"
                                  placeholder="KES"
                                  aria-label={`Tip price for ${line.name}`}
                                  className="w-24 rounded-xl border border-savr-ink/15 bg-white px-2 py-1.5 text-sm text-savr-ink outline-none"
                                  autoFocus
                                />
                                <button
                                  type="submit"
                                  disabled={tipBusy || !tipPrice.trim()}
                                  className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                                >
                                  {tipBusy ? "…" : "Submit"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTipKey(null);
                                    setTipStatus(null);
                                  }}
                                  className={`text-xs font-semibold ${
                                    r.isRecommended ? "text-savr-mute" : "text-savr-mute"
                                  }`}
                                >
                                  Cancel
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {open && tipStatus && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    tipStatus.startsWith("Thanks")
                      ? r.isRecommended
                        ? "text-savr-signal"
                        : "text-savr-forest"
                      : "text-red-600"
                  }`}
                >
                  {tipStatus}
                </p>
              )}

              {open && missing.length > 0 && canTip && tipKey == null && (
                <p
                  className={`mt-2 text-xs ${
                    r.isRecommended ? "text-savr-mute" : "text-savr-mute"
                  }`}
                >
                  {missing.length} item{missing.length === 1 ? "" : "s"} without a price — tip any
                  shelf tag you remember.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <a
                  href={r.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm font-semibold ${
                    "text-savr-forest"
                  }`}
                >
                  Directions →
                </a>
                {r.isRecommended && onChoose && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onChoose(r.merchantId)}
                    className="btn-primary w-full sm:ml-auto sm:w-auto"
                  >
                    {busy
                      ? "Locking in…"
                      : chooseLabel?.(r.merchantName) ?? `Choose ${r.merchantName}`}
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
