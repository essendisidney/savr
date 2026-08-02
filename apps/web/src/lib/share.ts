import { formatKes } from "./types";

export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

/** Soft landing for shared punches — open product, not an invite wall. */
export function inviteUrl(savingsKes: number, store: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://savr-teal.vercel.app";
  const params = new URLSearchParams({
    save: String(Math.max(0, Math.round(savingsKes))),
    store: store || "Savr",
    next: "/basket?staples=1",
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
}): SharePayload {
  const amount = formatKes(params.savingsCents);
  const url = inviteUrl(params.savingsCents / 100, params.merchantName);
  const cashback =
    params.cashbackCents && params.cashbackCents > 0
      ? ` Plus ${formatKes(params.cashbackCents)} cashback.`
      : "";
  return {
    title: "Saved with Savr",
    text: `Look what I saved with Savr — ${amount} by shopping smarter at ${params.merchantName}.${cashback} Before you spend, Savr it.`,
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
    url: `${origin}/invite?save=${Math.round(lifetimeSavingsCents / 100)}&store=Savr&next=${encodeURIComponent("/basket?staples=1")}`,
  };
}

export function buildMissedShare(params: {
  missedCents: number;
  paidMerchantName: string;
  bestMerchantName: string;
}): SharePayload {
  const amount = formatKes(params.missedCents);
  const url = inviteUrl(params.missedCents / 100, params.bestMerchantName);
  return {
    title: "Could have saved with Savr",
    text: `I just found ${amount} I left on the table at ${params.paidMerchantName} — ${params.bestMerchantName} was cheaper on Savr. Next time I'm checking first.`,
    url,
  };
}

/** Shared when they already picked the smart store. */
export function buildWinShare(params: {
  merchantName: string;
  cashbackCents?: number;
  paidCents?: number;
}): SharePayload {
  const url = inviteUrl(
    params.cashbackCents && params.cashbackCents > 0
      ? params.cashbackCents / 100
      : params.paidCents
        ? params.paidCents / 100
        : 0,
    params.merchantName,
  );
  const cb =
    params.cashbackCents && params.cashbackCents > 0
      ? ` Earned ${formatKes(params.cashbackCents)} cashback.`
      : "";
  return {
    title: "Saved with Savr",
    text: `Savr said ${params.merchantName} was the smart pick — and it was.${cb} Before you spend, Savr it.`,
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
