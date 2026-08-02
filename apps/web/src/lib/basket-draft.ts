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
