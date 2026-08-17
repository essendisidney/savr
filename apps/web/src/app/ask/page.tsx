"use client";

import Link from "next/link";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SPEND_INTENTS, withAskParam } from "@/lib/intents";

export default function ComparePage() {
  return (
    <PageFrame>
      <PageHero
        theme="prices"
        title="What are you deciding?"
        subtitle="Ask from Home, or pick the job. Savr ranks listed prices — confirm at the shop."
      />

      <PageShell narrow>
        <ul className="space-y-2">
          {SPEND_INTENTS.map((intent, i) => (
            <li key={intent.id}>
              <Link
                href={withAskParam(intent.href, intent.label)}
                className="card flex items-center gap-3.5 px-4 py-3.5"
              >
                <span className="intent-index" aria-hidden>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-savr-ink">{intent.label}</span>
                  <span className="text-[13px] text-savr-mute">{intent.hint}</span>
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
