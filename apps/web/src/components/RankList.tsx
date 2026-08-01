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
    <ol className="space-y-3">
      {results.map((r, i) => {
        const width = Math.max(12, (r.totalCents / maxTotal) * 100);
        return (
          <li
            key={r.merchantId}
            className={`animate-rise surface overflow-hidden border px-4 py-4 transition ${
              r.isRecommended
                ? "border-savr-leaf ring-1 ring-savr-leaf/30"
                : "border-savr-ink/[0.07]"
            }`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center font-display text-sm font-bold ${
                    r.isRecommended
                      ? "bg-savr-forest text-white"
                      : "bg-savr-fog text-savr-mute"
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-xl font-bold tracking-tightish">{r.merchantName}</p>
                  {r.isRecommended ? (
                    <p className="mt-0.5 text-xs font-semibold text-savr-forest">Best total value</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-savr-mute">
                      {Math.round(r.coverage * 100)}% list coverage
                    </p>
                  )}
                </div>
              </div>
              <p className="font-display text-xl font-bold tracking-tightish tabular-nums">
                {formatKes(r.totalCents)}
              </p>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden bg-savr-fog">
              <div
                className={`rank-bar h-full animate-barGrow ${
                  r.isRecommended ? "bg-savr-forest" : "bg-savr-ink/20"
                }`}
                style={{ width: `${width}%`, animationDelay: `${0.15 + i * 0.08}s` }}
              />
            </div>

            <p className="mt-2.5 text-sm text-savr-mute">
              Cashback {formatKes(r.cashbackCents)}
              <span className="mx-1.5 text-savr-ink/20">·</span>
              Net <span className="font-semibold text-savr-ink">{formatKes(r.netCents)}</span>
            </p>

            {r.isRecommended && onChoose && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onChoose(r.merchantId)}
                className="btn-primary mt-4 w-full sm:w-auto"
              >
                {busy
                  ? "Locking in…"
                  : chooseLabel?.(r.merchantName) ?? `Choose ${r.merchantName}`}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
