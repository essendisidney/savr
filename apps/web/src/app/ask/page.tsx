"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageFrame, PageShell } from "@/components/PageShell";
import {
  ASK_PLACEHOLDERS,
  POPULAR_ASKS,
  SPEND_INTENTS,
  routeAskQuery,
  withAskParam,
} from "@/lib/intents";
import { loadRecentAsks, pushRecentAsk } from "@/lib/recent-asks";

export default function AskPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(ASK_PLACEHOLDERS[0]);
  const [recent, setRecent] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    setRecent(loadRecentAsks());
    let i = 0;
    const t = window.setInterval(() => {
      i = (i + 1) % ASK_PLACEHOLDERS.length;
      setPlaceholder(ASK_PLACEHOLDERS[i]);
    }, 3800);
    return () => window.clearInterval(t);
  }, []);

  function goAsk(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    pushRecentAsk(trimmed);
    setRecent(loadRecentAsks());
    setAsking(true);
    router.push(routeAskQuery(trimmed));
  }

  function onAsk(e: FormEvent) {
    e.preventDefault();
    goAsk(query);
  }

  return (
    <PageFrame>
      <div className="page-hero relative overflow-hidden border-b border-white/40">
        <div className="page-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-4 pb-8 pt-10 md:px-6 md:pt-14">
          <p className="page-eyebrow">Ask Savr</p>
          <h1 className="page-title mt-2.5 text-[clamp(1.85rem,4vw,2.5rem)]">
            Ask — then see the answer
          </h1>
          <p className="mt-3.5 text-[15px] leading-relaxed text-savr-mute">
            Speak like a human. Savr opens the right compare with your question still on screen —
            basket ranks, a matched price, rides, or fuel.
          </p>
        </div>
      </div>

      <PageShell narrow>
        <form onSubmit={onAsk} className="space-y-4">
          <label className="sr-only" htmlFor="ask-savr">
            Ask Savr
          </label>
          <div className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <input
              id="ask-savr"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full border-0 bg-transparent py-2 text-[16px] text-savr-ink outline-none placeholder:text-savr-mute/55"
              autoComplete="off"
              autoFocus
              disabled={asking}
            />
            <button type="submit" disabled={asking} className="btn-primary shrink-0 disabled:opacity-60">
              {asking ? "…" : "Ask"}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {POPULAR_ASKS.map((chip) => (
            <button
              key={chip.q}
              type="button"
              disabled={asking}
              onClick={() => goAsk(chip.q)}
              className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-savr-ink ring-1 ring-savr-ink/10 transition hover:ring-savr-forest/40 disabled:opacity-60"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {recent.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
              Recent
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={asking}
                  onClick={() => goAsk(r)}
                  className="rounded-full bg-savr-fog/80 px-3.5 py-2 text-sm font-medium text-savr-ink transition hover:bg-savr-mist disabled:opacity-60"
                >
                  {r.length > 32 ? `${r.slice(0, 32)}…` : r}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
          I want to…
        </p>
        <ul className="mt-3 space-y-2">
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
      </PageShell>
    </PageFrame>
  );
}
