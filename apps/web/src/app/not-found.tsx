import Link from "next/link";
import { PageFrame, PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageFrame>
      <PageShell narrow>
        <h1 className="page-title text-2xl">That page isn’t here</h1>
        <p className="mt-3 text-sm leading-relaxed text-savr-mute">
          Sell something in 60 seconds, or find a second-hand deal with escrow.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/sell" className="btn-primary">
            Sell something
          </Link>
          <Link href="/search" className="btn-ghost">
            Find a deal
          </Link>
        </div>
      </PageShell>
    </PageFrame>
  );
}
