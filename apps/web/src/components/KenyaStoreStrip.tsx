import Link from "next/link";
import { KENYA_CHAINS } from "@/lib/kenya-life";

export function KenyaStoreStrip({ note = false }: { note?: boolean }) {
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {KENYA_CHAINS.map((chain) => (
          <Link key={chain.id} href={chain.href} className="store-pill shrink-0">
            <span className="store-pill-mark" aria-hidden>
              {chain.name.slice(0, 2)}
            </span>
            {chain.name}
            <span className="store-pill-kind">{chain.kind === "shelf" ? "shelf" : "online"}</span>
          </Link>
        ))}
      </div>
      {note ? (
        <p className="mt-2 text-[12px] text-savr-mute">
          Shelf ranks use catalog + tips. Online ranks public listed pages. Confirm before you pay.
        </p>
      ) : null}
    </div>
  );
}
