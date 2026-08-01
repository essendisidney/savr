import { formatKes } from "./types";

export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export function inviteUrl(savingsKes: number, store: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://savr-teal.vercel.app";
  const params = new URLSearchParams({
    save: String(Math.max(0, Math.round(savingsKes))),
    store: store || "Savr",
  });
  return `${origin}/invite?${params.toString()}`;
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
    url: `${origin}/invite?save=${Math.round(lifetimeSavingsCents / 100)}&store=Savr`,
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
