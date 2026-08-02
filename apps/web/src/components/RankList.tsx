"use client";

import { useState } from "react";
import { formatKes } from "@/lib/compare";
import type { BasketResult, LineItemPrice } from "@/lib/types";

export function RankList({
  results,
  onChoose,
  busy,
  chooseLabel,
  getLineItems,
  preferredMerchantIds = [],
}: {
  results: BasketResult[];
  onChoose?: (merchantId: string) => void;
  busy?: boolean;
  chooseLabel?: (name: string) => string;
  getLineItems?: (merchantId: string) => LineItemPrice[];
  preferredMerchantIds?: string[];
}) {
  const [openId, setOpenId] = useState<string | null>(
    results.find((r) => r.isRecommended)?.merchantId ?? null,
  );
  const maxTotal = Math.max(...results.map((r) => r.totalCents), 1);

  return (
    <ol className="space-y-4">
      {results.map((r, i) => {
        const width = Math.max(14, (r.totalCents / maxTotal) * 100);
        const open = openId === r.merchantId;
        const lines = open && getLineItems ? getLineItems(r.merchantId) : [];
        const preferred = preferredMerchantIds.includes(r.merchantId);

        return (
          <li
            key={r.merchantId}
            className={`animate-rise group relative overflow-hidden border transition duration-300 ${
              r.isRecommended
                ? "border-transparent bg-savr-night text-white shadow-[0_18px_40px_-24px_rgba(4,36,25,0.65)]"
                : "border-savr-ink/[0.08] bg-white hover:border-savr-forest/35"
            }`}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {r.isRecommended && (
              <div className="absolute inset-y-0 left-0 w-1.5 bg-savr-signal" />
            )}

            <div className="px-4 py-5 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center font-display text-sm font-bold ${
                      r.isRecommended
                        ? "bg-savr-signal text-savr-ink"
                        : "bg-savr-fog text-savr-mute"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p
                      className={`font-display text-2xl font-bold tracking-tightish ${
                        r.isRecommended ? "text-white" : "text-savr-ink"
                      }`}
                    >
                      {r.merchantName}
                    </p>
                    {r.branchName && (
                      <p
                        className={`text-xs ${
                          r.isRecommended ? "text-white/65" : "text-savr-mute"
                        }`}
                      >
                        {r.branchName}
                      </p>
                    )}
                    <p
                      className={`mt-0.5 text-xs font-semibold ${
                        r.isRecommended ? "text-savr-signal" : "text-savr-mute"
                      }`}
                    >
                      {r.isRecommended
                        ? "Winner · best total value"
                        : `${Math.round(r.coverage * 100)}% list coverage`}
                      {preferred ? (r.isRecommended ? " · Your store" : " · Your preferred") : ""}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-display text-2xl font-bold tracking-tightish tabular-nums ${
                    r.isRecommended ? "text-white" : "text-savr-ink"
                  }`}
                >
                  {formatKes(r.totalCents)}
                </p>
              </div>

              <div
                className={`mt-4 h-2 overflow-hidden ${
                  r.isRecommended ? "bg-white/15" : "bg-savr-fog"
                }`}
              >
                <div
                  className={`rank-bar h-full animate-barGrow ${
                    r.isRecommended ? "bg-savr-signal" : "bg-savr-forest/70"
                  }`}
                  style={{ width: `${width}%`, animationDelay: `${0.12 + i * 0.08}s` }}
                />
              </div>

              <p
                className={`mt-3 text-sm ${
                  r.isRecommended ? "text-white/70" : "text-savr-mute"
                }`}
              >
                Cashback {formatKes(r.cashbackCents)}
                <span className="mx-1.5 opacity-40">·</span>
                Net{" "}
                <span
                  className={
                    r.isRecommended ? "font-semibold text-white" : "font-semibold text-savr-ink"
                  }
                >
                  {formatKes(r.netCents)}
                </span>
              </p>

              {getLineItems && (
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.merchantId)}
                  className={`mt-3 text-sm font-semibold ${
                    r.isRecommended ? "text-savr-signal" : "text-savr-forest"
                  }`}
                >
                  {open ? "Hide items ▲" : "See item prices ▼"}
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
                  {lines.map((line) => (
                    <li
                      key={line.productId}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                    >
                      <span className={r.isRecommended ? "text-white/85" : "text-savr-ink"}>
                        {line.name}
                        {line.quantity > 1 ? (
                          <span className="opacity-60"> ×{line.quantity}</span>
                        ) : null}
                      </span>
                      <span
                        className={`shrink-0 font-semibold tabular-nums ${
                          line.lineCents == null
                            ? r.isRecommended
                              ? "text-white/45"
                              : "text-savr-mute"
                            : r.isRecommended
                              ? "text-white"
                              : "text-savr-ink"
                        }`}
                      >
                        {line.lineCents == null ? "No price" : formatKes(line.lineCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <a
                  href={r.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm font-semibold ${
                    r.isRecommended ? "text-savr-signal" : "text-savr-forest"
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
