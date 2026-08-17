"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { LoadingBlock } from "@/components/LoadingBlock";
import { askQuote } from "@/lib/intents";
import { formatKes } from "@/lib/types";
import type { BundleBoard } from "@/lib/safaricom-bundles";

export default function BundlesPage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <div className="h-28 animate-pulse bg-savr-fog/80" />
          <PageShell>
            <LoadingBlock rows={3} />
          </PageShell>
        </PageFrame>
      }
    >
      <BundlesInner />
    </Suspense>
  );
}

function BundlesInner() {
  const askText = (useSearchParams().get("ask") ?? "").trim();
  const [board, setBoard] = useState<BundleBoard | null>(null);

  useEffect(() => {
    void fetch("/api/bundles/safaricom", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: BundleBoard) => setBoard(data))
      .catch(() => setBoard(null));
  }, []);

  return (
    <PageFrame>
      <PageHero
        theme="bundles"
        title={askText ? "Data & airtime — confirm live" : "Safaricom data packs"}
        subtitle={
          askText
            ? `For “${askQuote(askText)}” — Savr will not invent a bundle price.`
            : "Kenya’s second-biggest monthly spend after food. Official Safaricom rates only."
        }
        action={{ href: "/basket?staples=1", label: "Grocery basket" }}
      />
      <div className="page-band">
        <PageShell>
          <div className="space-y-6">
            <p className="rounded-2xl border border-savr-forest/20 bg-savr-forest/[0.06] px-4 py-3 text-sm text-savr-ink">
              {board?.note ?? "Loading Safaricom offers…"}
            </p>
            {!board && <LoadingBlock rows={3} />}
            {board && (
              <ul className="divide-y divide-savr-ink/[0.06] overflow-hidden rounded-2xl border border-savr-ink/[0.08] bg-white">
                {board.bundles.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div>
                      <p className="font-semibold text-savr-ink">{b.name}</p>
                      <p className="text-xs text-savr-mute">{b.validity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold tabular-nums text-savr-forest">
                        {b.priceCents != null ? formatKes(b.priceCents) : "Confirm live"}
                      </p>
                      <a
                        href={b.buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-savr-ink hover:text-savr-forest"
                      >
                        Open Safaricom →
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-savr-mute">
              Dial <span className="font-semibold text-savr-ink">*544#</span> or use MySafaricom. Fuel
              ceilings are on{" "}
              <Link href="/fuel" className="font-semibold text-savr-forest underline">
                Fuel
              </Link>
              .
            </p>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
