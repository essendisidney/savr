"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageFrame, PageShell } from "@/components/PageShell";
import { ASK_PLACEHOLDERS, SPEND_INTENTS, routeAskQuery } from "@/lib/intents";

export default function AskPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(ASK_PLACEHOLDERS[0]);

  useEffect(() => {
    let i = 0;
    const t = window.setInterval(() => {
      i = (i + 1) % ASK_PLACEHOLDERS.length;
      setPlaceholder(ASK_PLACEHOLDERS[i]);
    }, 3800);
    return () => window.clearInterval(t);
  }, []);

  function onAsk(e: FormEvent) {
    e.preventDefault();
    router.push(routeAskQuery(query));
  }

  return (
    <PageFrame>
      <div className="border-b border-savr-ink/[0.05]">
        <div className="mx-auto max-w-2xl px-4 pb-8 pt-10 md:px-6 md:pt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-savr-forest">
            Ask Savr
          </p>
          <h1 className="mt-2 font-display text-[1.85rem] font-bold tracking-tightish text-savr-ink md:text-4xl">
            What do you need to decide?
          </h1>
          <p className="mt-3 text-[15px] text-savr-mute">
            Speak like a human. Savr routes you to the best compare surface — basket, rides, fuel,
            map, or a single price.
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
            />
            <button type="submit" className="btn-primary shrink-0">
              Ask
            </button>
          </div>
        </form>

        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
          I want to…
        </p>
        <ul className="mt-3 space-y-2">
          {SPEND_INTENTS.map((intent) => (
            <li key={intent.id}>
              <Link
                href={intent.href}
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
