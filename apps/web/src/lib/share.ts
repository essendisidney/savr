import { buildListSharePath } from "./basket-draft";
import { formatKes } from "./types";
import type { ListItem } from "./types";

export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

const STAPLES_NEXT = "/basket?staples=1";

function resolveNextPath(params?: {
  nextPath?: string | null;
  listName?: string;
  items?: ListItem[];
}): string {
  if (params?.nextPath?.startsWith("/")) return params.nextPath;
  if (params?.items?.length) {
    const path = buildListSharePath(params.listName ?? "Shared list", params.items);
    if (path) return path;
  }
  return STAPLES_NEXT;
}

/** Soft landing for shared punches — open product, not an invite wall. */
export function inviteUrl(
  savingsKes: number,
  store: string,
  nextPath: string = STAPLES_NEXT,
): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://savr-teal.vercel.app";
  const params = new URLSearchParams({
    save: String(Math.max(0, Math.round(savingsKes))),
    store: store || "Savr",
    next: nextPath.startsWith("/") ? nextPath : STAPLES_NEXT,
  });
  return `${origin}/invite?${params.toString()}`;
}

export function whatsAppShareUrl(payload: SharePayload): string {
  const full = `${payload.text}\n${payload.url}`;
  return `https://wa.me/?text=${encodeURIComponent(full)}`;
}

export function buildBasketShare(params: {
  savingsCents: number;
  merchantName: string;
  cashbackCents?: number;
  listName?: string;
  items?: ListItem[];
  nextPath?: string | null;
}): SharePayload {
  const amount = formatKes(params.savingsCents);
  const next = resolveNextPath(params);
  const url = inviteUrl(params.savingsCents / 100, params.merchantName, next);
  const cashback =
    params.cashbackCents && params.cashbackCents > 0
      ? ` Plus ${formatKes(params.cashbackCents)} cashback.`
      : "";
  const listHint =
    next.includes("list=")
      ? " Open the link to compare the same basket."
      : "";
  return {
    title: "Saved with Savr",
    text: `Look what I saved with Savr — ${amount} by shopping smarter at ${params.merchantName}.${cashback}${listHint} Before you spend, Savr it.`,
    url,
  };
}

export function buildLifetimeShare(lifetimeSavingsCents: number): SharePayload {
  const amount = formatKes(lifetimeSavingsCents);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://savr-teal.vercel.app";
  return {
    title: "Saved with Savr",
    text: `I've kept ${amount} with Savr by checking before I spend. Try it before your next shop.`,
    url: `${origin}/invite?save=${Math.round(lifetimeSavingsCents / 100)}&store=Savr&next=${encodeURIComponent(STAPLES_NEXT)}`,
  };
}

export function buildMissedShare(params: {
  missedCents: number;
  paidMerchantName: string;
  bestMerchantName: string;
  listName?: string;
  items?: ListItem[];
  nextPath?: string | null;
}): SharePayload {
  const amount = formatKes(params.missedCents);
  const next = resolveNextPath(params);
  const url = inviteUrl(params.missedCents / 100, params.bestMerchantName, next);
  const listHint =
    next.includes("list=")
      ? " Open the link — same basket, smarter store."
      : "";
  return {
    title: "Could have saved with Savr",
    text: `I just found ${amount} I left on the table at ${params.paidMerchantName} — ${params.bestMerchantName} was cheaper on Savr.${listHint} Next time I'm checking first.`,
    url,
  };
}

/** Rebuild a Check punch from a Saved receipt (no line items needed). */
export function buildReceiptShare(params: {
  paidMerchantName: string;
  bestMerchantName: string;
  paidTotalCents: number;
  missedCents: number;
  alreadyOptimal: boolean;
}): SharePayload {
  if (params.alreadyOptimal || params.missedCents <= 0) {
    return buildWinShare({
      merchantName: params.paidMerchantName,
      paidCents: params.paidTotalCents,
    });
  }
  return buildMissedShare({
    missedCents: params.missedCents,
    paidMerchantName: params.paidMerchantName,
    bestMerchantName: params.bestMerchantName,
  });
}

/** Shared when they already picked the smart store. */
export function buildWinShare(params: {
  merchantName: string;
  cashbackCents?: number;
  paidCents?: number;
  listName?: string;
  items?: ListItem[];
  nextPath?: string | null;
}): SharePayload {
  const next = resolveNextPath(params);
  const url = inviteUrl(
    params.cashbackCents && params.cashbackCents > 0
      ? params.cashbackCents / 100
      : params.paidCents
        ? params.paidCents / 100
        : 0,
    params.merchantName,
    next,
  );
  const cb =
    params.cashbackCents && params.cashbackCents > 0
      ? ` Earned ${formatKes(params.cashbackCents)} cashback.`
      : "";
  const listHint =
    next.includes("list=")
      ? " Open the link to compare the same basket."
      : "";
  return {
    title: "Saved with Savr",
    text: `Savr said ${params.merchantName} was the smart pick — and it was.${cb}${listHint} Before you spend, Savr it.`,
    url,
  };
}

export function buildListShare(params: {
  listName: string;
  url: string;
  itemCount: number;
}): SharePayload {
  const count =
    params.itemCount === 1 ? "1 item" : `${params.itemCount} items`;
  return {
    title: "Savr shopping list",
    text: `Our “${params.listName}” on Savr (${count}) — open the link, add what we need, then compare stores before we shop.`,
    url: params.url,
  };
}

export function buildRideShare(params: {
  savingsCents: number;
  partner: string;
  destination: string;
}): SharePayload {
  const amount = formatKes(params.savingsCents);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://savr-teal.vercel.app";
  return {
    title: "Saved with Savr",
    text: `Savr says take ${params.partner} to ${params.destination} — keep about ${amount} vs the priciest quote. Before you spend, Savr it.`,
    url: `${origin}/rides`,
  };
}

export async function sharePayload(payload: SharePayload): Promise<"shared" | "copied" | "failed"> {
  const full = `${payload.text}\n${payload.url}`;
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return "shared";
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "failed";
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(full);
      return "copied";
    }
  } catch {
    /* fall through */
  }
  return "failed";
}
