"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { appendSharedListItem, loadSharedList } from "@/lib/actions";
import { loadCatalog } from "@/lib/catalog";
import { searchProducts } from "@/lib/compare";
import { track } from "@/lib/track";
import type { Catalog, ListItem } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";
import { LoadingBlock } from "@/components/LoadingBlock";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

export default function SharedListPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const [name, setName] = useState("Shared list");
  const [items, setItems] = useState<ListItem[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([loadSharedList(token), loadCatalog()]).then(([res, c]) => {
      setCatalog(c);
      if ("error" in res) {
        setError(res.error);
      } else {
        setName(res.name);
        setItems(res.items);
      }
      setLoading(false);
    });
  }, [token]);

  const suggestions = useMemo(() => {
    if (!catalog || !query.trim()) return [];
    const exclude = items.map((i) => i.productId);
    return searchProducts(catalog, query, exclude, 8);
  }, [catalog, query, items]);

  function openInBasket() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "savr_shared_list",
        JSON.stringify({ name, items, token }),
      );
    }
    router.push("/basket?shared=1");
  }

  async function addProduct(productId: string, productName: string) {
    if (!token) return;
    setAddingId(productId);
    setStatus(null);
    const res = await appendSharedListItem({ token, productId, quantity: 1 });
    setAddingId(null);
    if ("error" in res) {
      setStatus(res.error);
      return;
    }
    setName(res.name);
    setItems(res.items);
    setQuery("");
    setStatus(`Added ${productName} to the household list.`);
    track("shared_list_append", { productId });
  }

  if (loading) {
    return (
      <PageFrame>
        <div className="h-28 animate-pulse bg-savr-fog/80" />
        <PageShell>
          <LoadingBlock rows={3} />
        </PageShell>
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame>
        <PageHero
          theme="basket"
          title="List not found"
          subtitle={error}
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
        subtitle="Household list — add what you’re out of, then compare once."
      />

      <div className="page-band">
        <PageShell>
          <div className="mx-auto max-w-lg space-y-6">
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold tracking-tightish">Add to this list</h2>
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Milk, bread, avocados…"
                  className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                  aria-label="Search products to add"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full border border-savr-ink/10 bg-white shadow-[0_16px_40px_-20px_rgba(4,36,25,0.55)]">
                    {suggestions.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={addingId === p.id}
                          onClick={() => addProduct(p.id, p.name)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-savr-mist disabled:opacity-60"
                        >
                          <span>
                            <span className="font-medium">{p.name}</span>
                            {p.brand && (
                              <span className="ml-2 text-savr-mute">{p.brand}</span>
                            )}
                          </span>
                          <span className="shrink-0 font-semibold text-savr-forest">
                            {addingId === p.id ? "…" : "Add +"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {status && (
                <p
                  className={`text-sm font-semibold ${
                    status.startsWith("Added") ? "text-savr-forest" : "text-red-700"
                  }`}
                >
                  {status}
                </p>
              )}
            </section>

            {items.length === 0 ? (
              <EmptyState
                title="List is empty"
                body="Search above to add the first staple — everyone with the link can add."
              />
            ) : (
              <ul className="divide-y divide-savr-ink/[0.06] card">
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
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openInBasket}
                disabled={items.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                Open in basket
              </button>
              <Link href="/basket" className="btn-ghost text-center">
                Start fresh
              </Link>
            </div>
            <p className="text-xs text-savr-mute">
              {items.length} item{items.length === 1 ? "" : "s"} · anyone with this link can add
            </p>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
