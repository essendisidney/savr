import { formatKes } from "@/lib/compare";
import type { BasketResult } from "@/lib/types";

export function RankList({
  results,
  onChoose,
  busy,
  chooseLabel,
}: {
  results: BasketResult[];
  onChoose?: (merchantId: string) => void;
  busy?: boolean;
  chooseLabel?: (name: string) => string;
}) {
  const maxTotal = Math.max(...results.map((r) => r.totalCents), 1);

  return (
    <ol className="space-y-4">
      {results.map((r, i) => {
        const width = Math.max(14, (r.totalCents / maxTotal) * 100);
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
                    <p
                      className={`mt-0.5 text-xs font-semibold ${
                        r.isRecommended ? "text-savr-signal" : "text-savr-mute"
                      }`}
                    >
                      {r.isRecommended
                        ? "Winner · best total value"
                        : `${Math.round(r.coverage * 100)}% list coverage`}
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
                <span className={r.isRecommended ? "font-semibold text-white" : "font-semibold text-savr-ink"}>
                  {formatKes(r.netCents)}
                </span>
              </p>

              {r.isRecommended && onChoose && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onChoose(r.merchantId)}
                  className="btn-primary mt-5 w-full sm:w-auto"
                >
                  {busy
                    ? "Locking in…"
                    : chooseLabel?.(r.merchantName) ?? `Choose ${r.merchantName}`}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
