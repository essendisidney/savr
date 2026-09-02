"use client";

import Link from "next/link";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { KenyaStoreStrip } from "@/components/KenyaStoreStrip";
import { KENYA_JOBS, KENYA_QUICK_ASKS, KENYA_BASKET_PACKS } from "@/lib/kenya-life";
import { SPEND_INTENTS, withAskParam } from "@/lib/intents";

export default function ComparePage() {
  return (
    <PageFrame>
      <PageHero
        theme="prices"
        title="Kenya, before you spend"
        subtitle="Supermarkets, Jumia, data, fuel, and a taxi — listed prices only. Confirm at the shop."
      />

      <PageShell>
        <div className="space-y-8">
          <section>
            <p className="page-eyebrow">Supermarkets & shops</p>
            <div className="mt-3">
              <KenyaStoreStrip note />
            </div>
          </section>

          <section>
            <p className="page-eyebrow">Kenya life</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {KENYA_JOBS.map((job) => (
                <li key={job.id}>
                  <Link href={withAskParam(job.href, job.label)} className="kenya-job">
                    <span className="kenya-job-mark" aria-hidden>
                      {job.mark}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-savr-ink">{job.label}</span>
                      <span className="text-[13px] text-savr-mute">{job.hint}</span>
                    </span>
                    <span className="text-sm font-semibold text-savr-forest">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="page-eyebrow">Kenya carts</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {KENYA_BASKET_PACKS.map((pack) => (
                <Link key={pack.id} href={pack.href} className="home-chip">
                  {pack.label}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className="page-eyebrow">Tap an ask</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {KENYA_QUICK_ASKS.map((ask) => (
                <Link key={ask.label} href={ask.href} className="home-chip">
                  {ask.label}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className="page-eyebrow">All jobs</p>
            <ul className="mt-3 space-y-2">
              {SPEND_INTENTS.map((intent) => (
                <li key={intent.id}>
                  <Link
                    href={withAskParam(intent.href, intent.label)}
                    className="card flex items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <span>
                      <span className="block font-semibold text-savr-ink">{intent.label}</span>
                      <span className="text-[13px] text-savr-mute">{intent.hint}</span>
                    </span>
                    <span className="text-sm font-semibold text-savr-forest">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-sm text-savr-mute">
              Prefer to type?{" "}
              <Link href="/" className="font-semibold text-savr-forest hover:underline">
                Ask on Home
              </Link>
            </p>
          </section>
        </div>
      </PageShell>
    </PageFrame>
  );
}
