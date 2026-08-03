"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { loadCatalog } from "@/lib/catalog";
import { weekly30CsvTemplate } from "@/lib/merchant-csv";
import { loadUnmatchedAsks, type UnmatchedAsk } from "@/lib/unmatched-asks";
import { WEEKLY_30 } from "@/lib/weekly-30";
import { track } from "@/lib/track";

const CHECK_KEY = "savr_soft_launch_checks_v1";

type CheckId =
  | "download"
  | "walk"
  | "upload"
  | "tip"
  | "tippers"
  | "sms"
  | "support";

const STEPS: {
  id: CheckId;
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
}[] = [
  {
    id: "download",
    title: "Download Weekly 30 CSV",
    body: "Empty price_kes column — print or keep on phone for the aisle.",
  },
  {
    id: "walk",
    title: "Walk 2–3 Nairobi branches",
    body: "Naivas / Quickmart / Carrefour near you. Fill price_kes only — don’t invent.",
  },
  {
    id: "upload",
    title: "Upload via Merchant portal",
    body: "Select your branch, Upload CSV, apply rows. source = merchant.",
    href: "/merchant",
    hrefLabel: "Open Merchant →",
  },
  {
    id: "tip",
    title: "Tip one shelf yourself",
    body: "Prices → Tip this shelf → WhatsApp the punch. Prove the loop works.",
    href: "/prices?q=bread&ask=bread",
    hrefLabel: "Tip bread →",
  },
  {
    id: "tippers",
    title: "Invite 5–10 tippers",
    body: "WhatsApp: after a shop, tip one wrong shelf. Unmatched Asks teach aliases.",
  },
  {
    id: "sms",
    title: "SMS OTP live on Vercel",
    body: "TAIFA keys + SMS_BYPASS=false in Production. Hold until you’re ready for phone login.",
  },
  {
    id: "support",
    title: "Support email / WhatsApp",
    body: "NEXT_PUBLIC_SUPPORT_EMAIL and NEXT_PUBLIC_SUPPORT_WHATSAPP on Vercel.",
  },
];

function loadChecks(): Record<CheckId, boolean> {
  if (typeof window === "undefined") return {} as Record<CheckId, boolean>;
  try {
    const raw = localStorage.getItem(CHECK_KEY);
    if (!raw) return {} as Record<CheckId, boolean>;
    return JSON.parse(raw) as Record<CheckId, boolean>;
  } catch {
    return {} as Record<CheckId, boolean>;
  }
}

function saveChecks(next: Record<CheckId, boolean>) {
  try {
    localStorage.setItem(CHECK_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

export default function SoftLaunchOpsPage() {
  const [checks, setChecks] = useState<Record<CheckId, boolean>>({} as Record<CheckId, boolean>);
  const [unmatched, setUnmatched] = useState<UnmatchedAsk[]>([]);
  const [dlStatus, setDlStatus] = useState<string | null>(null);

  useEffect(() => {
    setChecks(loadChecks());
    setUnmatched(loadUnmatchedAsks().slice(0, 10));
  }, []);

  function toggle(id: CheckId) {
    setChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveChecks(next);
      track("soft_launch_check", { id, done: next[id] });
      return next;
    });
  }

  async function downloadWeekly30() {
    setDlStatus("Preparing…");
    const catalog = await loadCatalog();
    const csv = weekly30CsvTemplate(catalog.products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `savr-weekly-30-walk-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDlStatus(`Downloaded ${WEEKLY_30.length} SKUs — fill price_kes on the shelf.`);
    track("weekly30_download", { via: "ops" });
    setChecks((prev) => {
      if (prev.download) return prev;
      const next = { ...prev, download: true };
      saveChecks(next);
      track("soft_launch_check", { id: "download", done: true });
      return next;
    });
  }

  const doneCount = STEPS.filter((s) => checks[s.id]).length;

  return (
    <PageFrame>
      <PageHero
        theme="basket"
        title="Soft launch ops"
        subtitle="Data before polish. Walk shelves, tip once, then invite tippers — M-Pesa stays dry-run."
        action={{ href: "/merchant", label: "Merchant portal" }}
      />

      <div className="page-band">
        <PageShell narrow>
          <div className="space-y-8">
            <p className="text-sm text-savr-mute">
              {doneCount}/{STEPS.length} checked on this device ·{" "}
              <span className="font-semibold text-savr-ink">{WEEKLY_30.length} Weekly 30 SKUs</span>
            </p>

            <section className="card space-y-4 px-4 py-5 sm:px-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
                  Tonight
                </p>
                <h2 className="mt-1 font-display text-xl font-bold tracking-tightish">
                  Weekly 30 shelf walk
                </h2>
                <p className="mt-1.5 text-sm text-savr-mute">
                  Highest leverage left. Real Nairobi prices replace seed — tips and compares get
                  honest.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void downloadWeekly30()} className="btn-primary">
                  Download Weekly 30 CSV
                </button>
                <Link href="/merchant" className="btn-ghost">
                  Upload after walk
                </Link>
              </div>
              {dlStatus && <p className="text-sm font-medium text-savr-forest">{dlStatus}</p>}
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold tracking-tightish">Checklist</h2>
              <ul className="space-y-2">
                {STEPS.map((step) => {
                  const on = Boolean(checks[step.id]);
                  return (
                    <li key={step.id} className="card px-4 py-3.5">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => toggle(step.id)}
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition ${
                            on
                              ? "border-savr-forest bg-savr-forest text-white"
                              : "border-savr-ink/20 bg-white text-transparent"
                          }`}
                          aria-pressed={on}
                          aria-label={on ? `Uncheck ${step.title}` : `Check ${step.title}`}
                        >
                          ✓
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-semibold ${on ? "text-savr-mute line-through" : "text-savr-ink"}`}
                          >
                            {step.title}
                          </p>
                          <p className="mt-0.5 text-sm text-savr-mute">{step.body}</p>
                          {step.href && (
                            <Link
                              href={step.href}
                              className="mt-2 inline-block text-sm font-semibold text-savr-forest hover:underline"
                            >
                              {step.hrefLabel}
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {unmatched.length > 0 && (
              <section className="card space-y-3 px-4 py-5 sm:px-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                    Demand
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold tracking-tightish">
                    Unmatched Asks on this phone
                  </h2>
                  <p className="mt-1 text-sm text-savr-mute">
                    Grow aliases or catalog after Weekly 30 density — don’t chase every word first.
                  </p>
                </div>
                <ul className="divide-y divide-savr-ink/[0.06]">
                  {unmatched.map((row) => (
                    <li
                      key={row.q}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <span className="font-medium text-savr-ink">
                        “{row.q}”
                        {row.requested ? (
                          <span className="ml-2 text-xs font-semibold text-savr-forest">
                            requested
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-savr-mute">×{row.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="text-sm text-savr-mute">
              Hold live M-Pesa (`MPESA_DRY_RUN=true`). Product spine is ready — prices are the gate.
            </p>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
