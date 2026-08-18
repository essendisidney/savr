"use client";

import Link from "next/link";
import { PageFrame, PageShell } from "@/components/PageShell";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageFrame>
      <PageShell narrow>
        <h1 className="page-title text-2xl">Savr hit a snag</h1>
        <p className="mt-3 text-sm leading-relaxed text-savr-mute">
          Try again. If it keeps happening, open Home and ask from there.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            Home
          </Link>
        </div>
      </PageShell>
    </PageFrame>
  );
}
