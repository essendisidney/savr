import Link from "next/link";
import { PageFrame, PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageFrame>
      <PageShell narrow>
        <h1 className="page-title text-2xl">That page isn’t here</h1>
        <p className="mt-3 text-sm leading-relaxed text-savr-mute">
          Ask Savr what you want to buy in Kenya, or open today’s grocery basket.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/" className="btn-primary">
            Ask Savr
          </Link>
          <Link href="/basket?staples=1" className="btn-ghost">
            Weekly groceries
          </Link>
        </div>
      </PageShell>
    </PageFrame>
  );
}
