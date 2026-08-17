"use client";

import Link from "next/link";
import { PageFrame, PageShell } from "@/components/PageShell";
import { SPEND_INTENTS, withAskParam } from "@/lib/intents";

export default function ComparePage() {
  return (
    <PageFrame>
      <div className="page-hero relative overflow-hidden border-b border-white/40">
        <div className="page-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-4 pb-8 pt-10 md:px-6 md:pt-14">
          <p className="page-eyebrow">Compare</p>
          <h1 className="page-title mt-2.5 text-[clamp(1.85rem,4vw,2.5rem)]">
            What are you deciding?
          </h1>
          <p className="mt-3.5 text-[15px] leading-relaxed text-savr-mute">
            Ask from Home, or pick the job. Savr ranks listed prices — confirm at the shop.
          </p>
        </div>
      </div>

      <PageShell narrow>
        <ul className="space-y-2">
          {SPEND_INTENTS.map((intent) => (
            <li key={intent.id}>
              <Link
                href={withAskParam(intent.href, intent.label)}
                className="card flex items-center justify-between gap-3 px-4 py-3.5 hover:border-savr-forest/30"
              >
                <span>
                  <span className="block font-semibold text-savr-ink">{intent.label}</span>
                  <span className="text-xs text-savr-mute">{intent.hint}</span>
                </span>
                <span className="text-sm font-semibold text-savr-forest">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-sm text-savr-mute">
          Prefer to type?{" "}
          <Link href="/" className="font-semibold text-savr-forest hover:underline">
            Ask on Home
          </Link>
        </p>
      </PageShell>
    </PageFrame>
  );
}
