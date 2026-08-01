import { formatKes } from "@/lib/compare";

export function SavingsMoment({
  amountLabel,
  amountCents,
  detail,
}: {
  amountLabel: string;
  amountCents: number;
  detail: string;
}) {
  return (
    <div className="savings-moment animate-rise relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,197,24,0.55),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(14,159,95,0.45),transparent_50%)]" />
      <div className="relative flex flex-col gap-2 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-7 sm:py-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-savr-ink/70">
            {amountLabel}
          </p>
          <p className="mt-1 font-display text-5xl font-extrabold tracking-tightish tabular-nums text-savr-ink md:text-6xl">
            {formatKes(amountCents)}
          </p>
        </div>
        <p className="max-w-xs text-[15px] font-medium leading-snug text-savr-ink/80 sm:text-right">
          {detail}
        </p>
      </div>
    </div>
  );
}
