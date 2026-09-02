/** Kenya life — chains we rank and jobs people actually spend on. */

export type KenyaChain = {
  id: string;
  name: string;
  kind: "shelf" | "online";
  href: string;
};

/** Nairobi + Kenya grocery names shoppers recognise. Shelf ranks need a catalog row. */
export const KENYA_CHAINS: KenyaChain[] = [
  { id: "naivas", name: "Naivas", kind: "shelf", href: "/prices?q=unga" },
  { id: "quickmart", name: "Quickmart", kind: "shelf", href: "/prices?q=milk" },
  { id: "carrefour", name: "Carrefour", kind: "shelf", href: "/prices?q=cooking%20oil" },
  { id: "chandarana", name: "Chandarana", kind: "shelf", href: "/prices?q=sugar" },
  { id: "eastmatt", name: "Eastmatt", kind: "shelf", href: "/prices?q=bread" },
  { id: "cleanshelf", name: "Cleanshelf", kind: "shelf", href: "/prices?q=unga" },
  { id: "magunas", name: "Magunas", kind: "shelf", href: "/prices?q=rice" },
  { id: "gilanis", name: "Gilanis", kind: "shelf", href: "/prices?q=milk" },
  { id: "tumaini", name: "Tumaini", kind: "shelf", href: "/prices?q=sugar" },
  { id: "kassmart", name: "Kassmart", kind: "shelf", href: "/prices?q=cooking%20oil" },
  { id: "game", name: "Game", kind: "shelf", href: "/prices?q=omo" },
  { id: "buyers-choice", name: "Buyers Choice", kind: "shelf", href: "/prices?q=unga" },
  { id: "kamindi", name: "Kamindi", kind: "shelf", href: "/prices?q=sugar" },
  { id: "cielo", name: "Cielo", kind: "shelf", href: "/prices?q=milk" },
  { id: "jumia", name: "Jumia", kind: "online", href: "/market?q=iphone%2013" },
  { id: "kilimall", name: "Kilimall", kind: "online", href: "/market?q=tecno" },
  { id: "carrefour-ke", name: "Carrefour.ke", kind: "online", href: "/market?q=unga" },
  { id: "naivas-online", name: "Naivas.online", kind: "online", href: "/market?q=milk" },
  { id: "jiji", name: "Jiji", kind: "online", href: "/market?q=samsung" },
];

export const KENYA_ONLINE_SHOPS = [
  { id: "jumia-ke", name: "Jumia" },
  { id: "kilimall-ke", name: "Kilimall" },
  { id: "carrefour-ke", name: "Carrefour.ke" },
  { id: "naivas-ke", name: "Naivas.online" },
  { id: "jiji-ke", name: "Jiji" },
] as const;

export type KenyaJob = {
  id: string;
  label: string;
  hint: string;
  href: string;
  mark: string;
};

export const KENYA_JOBS: KenyaJob[] = [
  {
    id: "unga",
    label: "Unga & milk today",
    hint: "Nairobi shelves — Jogoo, Brookside, confirm on aisle",
    href: "/prices?q=maize%20flour",
    mark: "U",
  },
  {
    id: "basket",
    label: "Weekly grocery cart",
    hint: "One list ranked across supermarket branches",
    href: "/basket?pack=weekly",
    mark: "B",
  },
  {
    id: "breakfast",
    label: "Breakfast table",
    hint: "Milk, bread, chai, eggs — ranked before anyone shops",
    href: "/basket?pack=breakfast",
    mark: "M",
  },
  {
    id: "online",
    label: "Kenya shops online",
    hint: "Jumia, Kilimall, Carrefour, Naivas listed prices",
    href: "/market",
    mark: "K",
  },
  {
    id: "data",
    label: "Safaricom data",
    hint: "Official packs — confirm in the MySafaricom app",
    href: "/bundles",
    mark: "D",
  },
  {
    id: "fuel",
    label: "Cheapest litre nearby",
    hint: "EPRA board + tips — confirm at the pump",
    href: "/fuel",
    mark: "F",
  },
  {
    id: "rides",
    label: "Taxi before you request",
    hint: "Bolt, Uber, Little — same road, live in-app fare",
    href: "/rides",
    mark: "T",
  },
  {
    id: "pharmacy",
    label: "Dawa & Panadol",
    hint: "Shelf ranks for everyday pharmacy — confirm at the till",
    href: "/prices?q=panadol",
    mark: "P",
  },
  {
    id: "baby",
    label: "Baby week",
    hint: "Pampers, wipes, milk — ranked across branches",
    href: "/basket?pack=baby",
    mark: "A",
  },
  {
    id: "check",
    label: "After the shop",
    hint: "Could you have kept more? Tip what you paid",
    href: "/check",
    mark: "C",
  },
];

export const KENYA_QUICK_ASKS = [
  { label: "Unga", href: "/prices?q=maize%20flour" },
  { label: "Milk", href: "/prices?q=fresh%20milk" },
  { label: "Cooking oil", href: "/prices?q=cooking%20oil" },
  { label: "Sukuma", href: "/prices?q=sukuma" },
  { label: "Sugar", href: "/prices?q=sugar" },
  { label: "Ndengu", href: "/prices?q=ndengu" },
  { label: "Chai", href: "/prices?q=tea" },
  { label: "Panadol", href: "/prices?q=panadol" },
  { label: "Data", href: "/bundles" },
  { label: "Fuel", href: "/fuel" },
  { label: "iPhone", href: "/market?q=iphone%2013" },
] as const;

export const KENYA_MARKET_STARTERS = [
  { label: "Unga", q: "unga" },
  { label: "Kabras", q: "kabras sugar" },
  { label: "iPhone 13", q: "iphone 13" },
  { label: "Tecno", q: "tecno spark" },
  { label: "Infinix", q: "infinix hot" },
  { label: "Samsung A15", q: "samsung a15" },
  { label: "Always", q: "always pads" },
  { label: "Pampers", q: "pampers" },
  { label: "Omo", q: "omo 1kg" },
  { label: "Royco", q: "royco" },
] as const;

export type KenyaPackId = "weekly" | "breakfast" | "unga" | "baby" | "clean";

export const KENYA_BASKET_PACKS: { id: KenyaPackId; label: string; href: string }[] = [
  { id: "weekly", label: "Weekly", href: "/basket?pack=weekly" },
  { id: "breakfast", label: "Breakfast", href: "/basket?pack=breakfast" },
  { id: "unga", label: "Unga week", href: "/basket?pack=unga" },
  { id: "baby", label: "Baby", href: "/basket?pack=baby" },
  { id: "clean", label: "Clean house", href: "/basket?pack=clean" },
];

/** Official telco pages — never invent a bundle price. */
export const KENYA_TELCO_LINKS = [
  {
    id: "safaricom",
    name: "Safaricom",
    hint: "MySafaricom or *544#",
    href: "https://www.safaricom.co.ke/personal/offers-and-products",
  },
  {
    id: "airtel",
    name: "Airtel",
    hint: "Confirm in the Airtel app",
    href: "https://www.airtelkenya.com/",
  },
  {
    id: "telkom",
    name: "Telkom",
    hint: "Confirm on Telkom’s site",
    href: "https://telkom.co.ke/",
  },
] as const;

export const KENYA_AISLE_LABELS: Record<string, string> = {
  dairy: "Milk",
  staples: "Unga & dry",
  produce: "Sukuma & veg",
  bakery: "Bread",
  household: "Soap",
  baby: "Baby",
  personal_care: "Care",
  beverages: "Chai",
  protein: "Eggs & meat",
  snacks: "Snacks",
  pharmacy: "Dawa",
};

export function aisleLabel(category: string): string {
  return KENYA_AISLE_LABELS[category] ?? category.replace(/_/g, " ");
}
