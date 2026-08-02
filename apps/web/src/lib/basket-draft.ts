import type { ListItem } from "./types";

const DRAFT_KEY = "savr_basket_draft_v1";

export type BasketDraft = {
  name: string;
  items: ListItem[];
  updatedAt: number;
};

export function loadBasketDraft(): BasketDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BasketDraft;
    if (!parsed || !Array.isArray(parsed.items) || !parsed.items.length) return null;
    const items = parsed.items
      .filter(
        (i) =>
          i &&
          typeof i.productId === "string" &&
          typeof i.freeText === "string" &&
          Number.isFinite(i.quantity) &&
          i.quantity > 0,
      )
      .map((i) => ({
        productId: i.productId,
        freeText: i.freeText,
        quantity: Math.min(99, Math.max(1, Math.round(i.quantity))),
      }));
    if (!items.length) return null;
    return {
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "Weekly shop",
      items,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveBasketDraft(name: string, items: ListItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (!items.length) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    const draft: BasketDraft = {
      name: name.trim() || "Weekly shop",
      items,
      updatedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* private mode / quota */
  }
}

export function clearBasketDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Drop draft lines whose products left the catalog. */
export function hydrateDraftAgainstCatalog(
  draft: BasketDraft,
  productIds: Set<string>,
): BasketDraft | null {
  const items = draft.items.filter((i) => productIds.has(i.productId));
  if (!items.length) return null;
  return { ...draft, items };
}

function toUrlSafeBase64(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromUrlSafeBase64(encoded: string): string | null {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const b64 = padded + pad;
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Compact share payload — no auth required. */
export function encodeListShare(name: string, items: ListItem[]): string | null {
  if (!items.length) return null;
  const compact = {
    n: (name.trim() || "Shared list").slice(0, 60),
    i: items.slice(0, 40).map((item) => [item.productId, item.freeText.slice(0, 80), item.quantity]),
  };
  return toUrlSafeBase64(JSON.stringify(compact));
}

export function decodeListShare(encoded: string): { name: string; items: ListItem[] } | null {
  const json = fromUrlSafeBase64(encoded.trim());
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as {
      n?: string;
      i?: [string, string, number][];
    };
    if (!Array.isArray(parsed.i) || !parsed.i.length) return null;
    const items: ListItem[] = [];
    for (const row of parsed.i.slice(0, 40)) {
      if (!Array.isArray(row) || row.length < 2) continue;
      const [productId, freeText, qty] = row;
      if (typeof productId !== "string" || typeof freeText !== "string") continue;
      const quantity = Number.isFinite(qty) ? Math.min(99, Math.max(1, Math.round(Number(qty)))) : 1;
      items.push({ productId, freeText: freeText.slice(0, 80), quantity });
    }
    if (!items.length) return null;
    return {
      name: typeof parsed.n === "string" && parsed.n.trim() ? parsed.n.trim() : "Shared list",
      items,
    };
  } catch {
    return null;
  }
}

export function buildListShareUrl(name: string, items: ListItem[]): string | null {
  const payload = encodeListShare(name, items);
  if (!payload) return null;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://savr-teal.vercel.app";
  return `${origin}/basket?list=${payload}`;
}
