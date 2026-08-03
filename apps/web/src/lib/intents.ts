/** Intent routing — how humans think, not category menus. */

export type SpendIntent = {
  id: string;
  label: string;
  href: string;
  hint: string;
};

export const SPEND_INTENTS: SpendIntent[] = [
  {
    id: "family",
    label: "Feed my family",
    href: "/basket?staples=1",
    hint: "Compare a full grocery basket",
  },
  {
    id: "work",
    label: "Get to work",
    href: "/rides",
    hint: "Rank taxi quotes before you request",
  },
  {
    id: "fuel",
    label: "Fill up",
    href: "/fuel",
    hint: "Cheapest litre nearby",
  },
  {
    id: "medicine",
    label: "Need medicine",
    href: "/prices?q=panadol",
    hint: "Panadol and OTC shelf prices",
  },
  {
    id: "watch",
    label: "Watch a price",
    href: "/saved",
    hint: "Catch drops on staples you care about",
  },
  {
    id: "map",
    label: "See nearby value",
    href: "/map",
    hint: "Green / yellow / red — where Nairobi saves",
  },
  {
    id: "phone",
    label: "Buy a phone",
    href: "/prices?q=samsung",
    hint: "Compare one item across stores",
  },
  {
    id: "check",
    label: "Could I have saved?",
    href: "/check",
    hint: "After a shop — missed savings",
  },
  {
    id: "bills",
    label: "Pay less this week",
    href: "/basket?staples=1",
    hint: "Start with the weekly staples list",
  },
];

export const ASK_PLACEHOLDERS = [
  "Weekly groceries under KES 5,000…",
  "Find the cheapest cooking oil…",
  "Best taxi to the airport…",
  "Where is fuel cheapest near me…",
  "Need medicine tonight…",
  "Could I have saved on my last shop…",
];

/** Route free-text Ask Savr queries to the right surface (rules, not LLM). */
export function routeAskQuery(raw: string): string {
  const q = raw.trim().toLowerCase();
  if (!q) return "/ask";

  if (/\b(taxi|uber|bolt|little|ride|airport|cbd)\b/.test(q)) {
    return "/rides";
  }
  if (/\b(fuel|petrol|diesel|fill\s*up|station)\b/.test(q)) {
    return "/fuel";
  }
  if (/\b(watch|wishlist|alert|drop|notify)\b/.test(q)) {
    return "/saved";
  }
  if (/\b(map|nearby|near me|directions)\b/.test(q)) {
    return "/map";
  }
  if (/\b(family|basket|grocer|weekly shop|feed|staples|milk|bread|rice)\b/.test(q)) {
    return "/basket?staples=1";
  }
  if (/\b(missed|could i|receipt|after)\b/.test(q)) {
    return "/check";
  }
  return `/prices?q=${encodeURIComponent(raw.trim())}`;
}

/** Rough “what that save buys” — emotional framing, not a receipt. */
export function savingsBuys(amountCents: number): string | null {
  if (amountCents < 2000) return null;
  const kes = amountCents / 100;
  if (kes >= 800) {
    const tanks = Math.max(1, Math.round(kes / 400));
    return tanks === 1
      ? "That’s roughly a tank of fuel for a small car."
      : `That’s roughly ${tanks} small tanks of fuel.`;
  }
  if (kes >= 200) {
    const litres = Math.max(1, Math.round(kes / 180));
    return litres === 1
      ? "That’s about 1 litre of cooking oil."
      : `That’s about ${litres} litres of cooking oil.`;
  }
  const milk = Math.max(1, Math.round(kes / 70));
  return milk === 1
    ? "That’s about a litre of fresh milk."
    : `That’s about ${milk} litres of fresh milk.`;
}
