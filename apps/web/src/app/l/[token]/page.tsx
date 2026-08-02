"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSharedList } from "@/lib/actions";
import type { ListItem } from "@/lib/types";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

export default function SharedListPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [name, setName] = useState("Shared list");
  const [items, setItems] = useState<ListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    loadSharedList(token).then((res) => {
      if ("error" in res) {
        setError(res.error);
      } else {
        setName(res.name);
        setItems(res.items);
      }
      setLoading(false);
    });
  }, [token]);

  function openInBasket() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "savr_shared_list",
        JSON.stringify({ name, items, token }),
      );
    }
    router.push("/basket?shared=1");
  }

  if (loading) {
    return (
      <PageFrame>
        <div className="h-52 animate-pulse bg-savr-night/80" />
        <PageShell>
          <div className="h-40 animate-pulse bg-savr-fog" />
        </PageShell>
      </PageFrame>
    );
  }

  if (error || items.length === 0) {
    return (
      <PageFrame>
        <PageHero
          theme="basket"
          title="List not found"
          subtitle={error ?? "This share link has no items yet."}
          action={{ href: "/basket", label: "Build my own list" }}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        theme="basket"
        title={name}
        subtitle="A household list shared on Savr — open it, compare, and keep the difference."
      />

      <div className="page-band">
        <PageShell>
          <div className="mx-auto max-w-lg space-y-6">
            <ul className="divide-y divide-savr-ink/[0.06] border border-savr-ink/[0.08] bg-white">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <span className="text-[15px] font-medium">{item.freeText}</span>
                  <span className="text-sm font-bold tabular-nums text-savr-mute">
                    ×{item.quantity}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={openInBasket} className="btn-primary">
                Open in basket
              </button>
              <Link href="/basket" className="btn-ghost text-center">
                Start fresh
              </Link>
            </div>
            <p className="text-xs text-savr-mute">
              {items.length} items · shared for the weekly shop
            </p>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
