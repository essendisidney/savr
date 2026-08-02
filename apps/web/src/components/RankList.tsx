"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { submitCrowdsourcePrice } from "@/lib/actions";
import { formatKes } from "@/lib/compare";
import { formatPriceFreshness, freshnessClassName, formatBasketTrend, formatPriceTrend, trendClassName, confidenceClassName } from "@/lib/freshness";
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
  chooseLabel?: (name: string, isRecommended: boolean, cashbackCents: number) => string;
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
  const nets = results.map((r) => r.netCents);
  const bestNet = nets.length ? Math.min(...nets) : 0;
  const worstNet = nets.length ? Math.max(...nets) : 0;

  function valueScore(netCents: number): number {
    if (worstNet === bestNet) return 96;
    return Math.round(72 + (30 * (worstNet - netCents)) / (worstNet - bestNet));
  }

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
        const score = valueScore(r.netCents);
        const saveVsWorst = Math.max(0, worstNet - r.netCents);

        return (
          <li
            key={r.merchantId}
            className={`animate-rise group relative overflow-hidden transition duration-soft ${
              r.isRecommended
                ? "card-winner scale-[1.01] p-1 shadow-[0_28px_60px_-28px_rgba(0,200,83,0.55)]"
                : "card hover:border-savr-forest/30"
            }`}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {r.isRecommended && (
              <div className="absolute inset-y-0 left-0 w-1.5 bg-savr-forest" />
            )}

            <div className={`px-4 py-5 sm:px-5 ${r.isRecommended ? "sm:px-6 sm:py-7" : ""}`}>
              {r.isRecommended && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-savr-forest px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Best value
                  </span>
                  <span className="rounded-full bg-savr-forest/10 px-3 py-1 text-[11px] font-bold tabular-nums text-savr-forest">
                    Score {score}
                  </span>
                  {saveVsWorst > 0 && (
                    <span className="rounded-full bg-savr-fog px-3 py-1 text-[11px] font-semibold text-savr-ink">
                      Save {formatKes(saveVsWorst)} vs priciest
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-display text-base font-bold ${
                      r.isRecommended
                        ? "bg-savr-forest text-white"
                        : "bg-savr-fog text-savr-mute"
                    }`}
                  >
                    {r.isRecommended ? score : i + 1}
                  </span>
                  <div>
                    <p
                      className={`font-display font-bold tracking-tightish text-savr-ink ${
                        r.isRecommended ? "text-3xl md:text-4xl" : "text-2xl"
                      }`}
                    >
                      {r.merchantName}
                    </p>
                    {r.branchName && (
                      <p className="text-xs text-savr-mute">{r.branchName}</p>
                    )}
                    <p
                      className={`mt-0.5 text-xs font-semibold ${
                        r.isRecommended ? "text-savr-forest" : "text-savr-mute"
                      }`}
                    >
                      {r.isRecommended
                        ? "Winner · best total value"
                        : `${Math.round(r.coverage * 100)}% list coverage · score ${score}`}
                      {preferred ? (r.isRecommended ? " · Your store" : " · Your preferred") : ""}
                      {r.coverage < 1 ? ` · ${gapCount || "some"} missing` : ""}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-display font-bold tracking-tightish tabular-nums text-savr-ink ${
                    r.isRecommended ? "text-3xl md:text-4xl" : "text-2xl"
                  }`}
                >
                  {formatKes(r.totalCents)}
                </p>
              </div>

              {r.isRecommended && (
                <ul className="mt-5 grid gap-2 rounded-2xl bg-savr-forest/[0.06] px-4 py-3 text-sm text-savr-ink sm:grid-cols-2">
                  <li>
                    <span className="text-savr-mute">Net after rewards </span>
                    <span className="font-semibold">{formatKes(r.netCents)}</span>
                  </li>
                  <li>
                    <span className="text-savr-mute">Cashback </span>
                    <span className="font-semibold">{formatKes(r.cashbackCents)}</span>
                  </li>
                  {r.promoCents > 0 && (
                    <li>
                      <span className="text-savr-mute">Promo </span>
                      <span className="font-semibold">
                        −{formatKes(r.promoCents)}
                        {r.promoLabel ? ` · ${r.promoLabel}` : ""}
                      </span>
                    </li>
                  )}
                  {distanceLabel && (
                    <li>
                      <span className="text-savr-mute">Distance </span>
                      <span className="font-semibold">{distanceLabel}</span>
                    </li>
                  )}
                  <li>
                    <span className="text-savr-mute">Coverage </span>
                    <span className="font-semibold">{Math.round(r.coverage * 100)}% of list</span>
                  </li>
                  {r.confidenceLabel && (
                    <li className="sm:col-span-2">
                      <span className="text-savr-mute">Price trust </span>
                      <span
                        className={`font-semibold ${confidenceClassName(
                          r.confidenceLevel ?? "medium",
                          "light",
                        )}`}
                      >
                        {r.confidenceLabel}
                      </span>
                    </li>
                  )}
                </ul>
              )}

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
                if (!basketTrend.label && !r.confidenceLabel) return null;
                return (
                  <div className="mt-1.5 space-y-0.5">
                    {basketTrend.label ? (
                      <p
                        className={`text-xs font-semibold ${trendClassName(
                          basketTrend.direction,
                          "light",
                        )}`}
                      >
                        {basketTrend.label}
                      </p>
                    ) : null}
                    {!r.isRecommended && r.confidenceLabel ? (
                      <p
                        className={`text-xs font-medium ${confidenceClassName(
                          r.confidenceLevel ?? "medium",
                          "light",
                        )}`}
                      >
                        {r.confidenceLabel}
                      </p>
                    ) : null}
                  </div>
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
                {onChoose && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onChoose(r.merchantId)}
                    className={
                      r.isRecommended
                        ? "btn-primary w-full sm:ml-auto sm:w-auto"
                        : "btn-ghost w-full sm:ml-auto sm:w-auto"
                    }
                  >
                    {busy
                      ? "Locking in…"
                      : chooseLabel?.(r.merchantName, r.isRecommended, r.cashbackCents) ??
                        (r.isRecommended
                          ? `Lock ${r.merchantName}`
                          : `Shop ${r.merchantName}`)}
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
