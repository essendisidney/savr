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
    label: "Need toothpaste",
    href: "/prices?q=toothpaste",
    hint: "Compare personal care across stores",
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
    id: "oil",
    label: "Compare cooking oil",
    href: "/prices?q=cooking%20oil",
    hint: "One item across Nairobi shelves",
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
  "Cheapest bread near Westlands…",
  "Could I have saved on my last shop…",
  "Compare rice across Naivas…",
  "Milk prices…",
];

/** Everyday staples people type — prefer Prices over map/rides when present. */
const PRODUCTISH = new Set([
  "bread",
  "milk",
  "rice",
  "oil",
  "sugar",
  "flour",
  "maize",
  "ugali",
  "unga",
  "eggs",
  "egg",
  "tea",
  "soap",
  "detergent",
  "tissue",
  "toothpaste",
  "salt",
  "beans",
  "ndengu",
  "sukuma",
  "tomato",
  "tomatoes",
  "onion",
  "onions",
  "potato",
  "potatoes",
  "banana",
  "bananas",
  "chicken",
  "yoghurt",
  "yogurt",
  "butter",
  "margarine",
  "noodles",
  "spaghetti",
  "peanut",
  "uht",
  "cooking",
  "loaf",
  "panadol",
  "paracetamol",
  "medicine",
  "chai",
]);

/**
 * Broad “I need groceries” language — never a single-SKU dead end.
 * “food” alone should open a staples basket, not “No match”.
 */
const BASKETISH_RE =
  /\b(food|foods|meal|meals|lunch|dinner|breakfast|kitchen|shopping|supermarket|market|provisions|vikapu|family|basket|grocer\w*|weekly\s+shop|feed|staples)\b/;

/**
 * Nairobi vernacular / synonyms → catalog search probe.
 * Keep honest: only map to things we actually stock.
 */
export const ASK_PRODUCT_ALIASES: Record<string, string> = {
  ugali: "maize flour",
  unga: "maize flour",
  posho: "maize flour",
  chai: "tea",
  mandazi: "bread",
  loaf: "bread",
  cookingoil: "cooking oil",
  vegetable: "sukuma",
  veggies: "sukuma",
  vegetables: "sukuma",
  greens: "sukuma",
  ndengu: "green grams",
  detergent: "laundry detergent",
  omo: "laundry detergent",
  tissue: "tissue paper",
  toothpaste: "toothpaste",
  eggs: "eggs",
  chicken: "chicken",
  yoghurt: "yoghurt",
  yogurt: "yoghurt",
};

const ASK_STOP = new Set([
  "a",
  "an",
  "the",
  "to",
  "for",
  "my",
  "me",
  "near",
  "nearby",
  "find",
  "cheapest",
  "cheap",
  "best",
  "where",
  "is",
  "are",
  "need",
  "tonight",
  "under",
  "kes",
  "about",
  "please",
  "want",
  "buy",
  "get",
  "across",
  "compare",
  "price",
  "prices",
  "and",
  "with",
  "westlands",
  "nairobi",
  "naivas",
  "carrefour",
  "quickmart",
  "cbd",
  "airport",
]);

/** Attach original Ask text so destinations can show an answer, not a cold tool. */
export function withAskParam(path: string, raw: string): string {
  const ask = raw.trim().slice(0, 120);
  if (!ask) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}ask=${encodeURIComponent(ask)}`;
}

/** Short quoted Ask for heroes / answer strips. */
export function askQuote(raw: string, max = 72): string {
  const t = raw.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** Meaningful tokens from an Ask string for product matching. */
export function askSearchTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !ASK_STOP.has(t));
}

/** Expand aliases so “ugali” finds maize flour, etc. */
export function resolveAskSearchProbe(raw: string): string {
  const tokens = askSearchTokens(raw);
  if (!tokens.length) return raw.trim().slice(0, 80);
  const expanded: string[] = [];
  for (const t of tokens) {
    const alias = ASK_PRODUCT_ALIASES[t];
    if (alias) {
      for (const part of alias.split(/\s+/)) {
        if (part && !expanded.includes(part)) expanded.push(part);
      }
    } else if (!expanded.includes(t)) {
      expanded.push(t);
    }
  }
  return expanded.slice(0, 6).join(" ");
}

/** Compact q= for Prices — aliases + product tokens when present. */
export function askPriceQuery(raw: string): string {
  const probe = resolveAskSearchProbe(raw);
  if (probe) return probe;
  return raw.trim().slice(0, 80);
}

function hasProductish(q: string): boolean {
  const tokens = q.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);
  return tokens.some((t) => PRODUCTISH.has(t) || Boolean(ASK_PRODUCT_ALIASES[t]));
}

function isBasketish(q: string): boolean {
  return BASKETISH_RE.test(q);
}

function pricesPath(raw: string): string {
  const q = askPriceQuery(raw);
  return withAskParam(`/prices?q=${encodeURIComponent(q)}`, raw);
}

/** Route free-text Ask Savr queries to the right surface (rules, not LLM). */
export function routeAskQuery(raw: string): string {
  const trimmed = raw.trim();
  const q = trimmed.toLowerCase();
  if (!q) return "/ask";

  const productish = hasProductish(q);
  const basketish = isBasketish(q);

  // Broad grocery language with no specific SKU → staples basket (e.g. “food”).
  if (basketish && !productish) {
    if (/\b(watch|wishlist|alert|notify)\b/.test(q)) {
      return withAskParam("/saved", trimmed);
    }
    if (/\b(missed|could i|receipt|after\s+(a\s+)?shop|last\s+shop)\b/.test(q)) {
      return withAskParam("/check", trimmed);
    }
    return withAskParam("/basket?staples=1", trimmed);
  }

  // Product asks win over geo/ride keywords (“bread near me”, “milk in CBD”).
  if (productish) {
    if (/\b(watch|wishlist|alert|notify)\b/.test(q) && !/\b(price\s+drop|drop\s+on)\b/.test(q)) {
      return withAskParam("/saved", trimmed);
    }
    if (/\b(missed|could i|receipt|after\s+(a\s+)?shop|last\s+shop)\b/.test(q)) {
      return withAskParam("/check", trimmed);
    }
    return pricesPath(trimmed);
  }

  if (
    /\b(taxi|uber|bolt|little|ride)\b/.test(q) ||
    (/\b(airport|cbd)\b/.test(q) && /\b(taxi|uber|bolt|little|ride|to|from)\b/.test(q))
  ) {
    return withAskParam("/rides", trimmed);
  }
  // Bare airport only when it’s clearly a trip (not “airport snacks”).
  if (
    /\b(to|from)\s+(the\s+)?airport\b/.test(q) ||
    (/\bairport\b/.test(q) && /\b(taxi|uber|bolt|little|ride)\b/.test(q)) ||
    /\bbest\s+taxi\b/.test(q)
  ) {
    return withAskParam("/rides", trimmed);
  }
  if (/\b(fuel|petrol|diesel|fill\s*up)\b/.test(q) || (/\bstation\b/.test(q) && /\b(fuel|petrol|diesel|gas)\b/.test(q))) {
    return withAskParam("/fuel", trimmed);
  }
  if (/\b(watch|wishlist|alert|notify)\b/.test(q) || /\bprice\s+drop\b/.test(q)) {
    return withAskParam("/saved", trimmed);
  }
  if (/\b(map|nearby|near\s+me|directions)\b/.test(q)) {
    return withAskParam("/map", trimmed);
  }
  if (basketish) {
    return withAskParam("/basket?staples=1", trimmed);
  }
  if (/\b(missed|could i|receipt|after\s+(a\s+)?shop|last\s+shop)\b/.test(q)) {
    return withAskParam("/check", trimmed);
  }
  if (/\b(medicine|panadol|paracetamol|pharmacy)\b/.test(q)) {
    return pricesPath(trimmed);
  }

  // Unknown free text → Prices with recovery UI (never a hard dead end).
  return pricesPath(trimmed);
}

/** Rough “what that save buys” — emotional framing, not a receipt. */
export function savingsBuys(amountCents: number): string | null {
  if (amountCents < 1500) return null;
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

/** Honest weekday pulse — habit nudge, never invented market certainty. */
export function weekdayPulse(day = new Date().getDay()): string {
  switch (day) {
    case 0:
      return "Quiet Sunday — plan next week’s basket before the rush.";
    case 1:
      return "Monday — get ahead of the weekly shop.";
    case 2:
      return "A good day to check a price you watch.";
    case 3:
      return "Midweek — compare before anyone hits the supermarket.";
    case 4:
      return "Thursday — lock this week’s list before the weekend.";
    case 5:
      return "Friday traffic — check a ride before you request.";
    default:
      return "Weekend shop? Compare the basket first.";
  }
}
