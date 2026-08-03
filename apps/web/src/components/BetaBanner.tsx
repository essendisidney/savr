import Link from "next/link";

/** Soft-launch honesty strip — prices may lag; redeem still dry-run. */
export function BetaBanner() {
  return (
    <div className="border-b border-savr-ink/10 bg-savr-fog/90 px-4 py-2 text-center text-[12px] leading-snug text-savr-mute">
      Nairobi beta · prices may lag · tip shelves or{" "}
      <Link href="/ops" className="font-semibold text-savr-forest hover:underline">
        Weekly 30
      </Link>{" "}
      · cashback redeem pending M-Pesa
    </div>
  );
}
