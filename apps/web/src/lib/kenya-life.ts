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
    href: "/basket?staples=1",
    mark: "B",
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
];

export const KENYA_QUICK_ASKS = [
  { label: "Unga", href: "/prices?q=maize%20flour" },
  { label: "Milk", href: "/prices?q=fresh%20milk" },
  { label: "Cooking oil", href: "/prices?q=cooking%20oil" },
  { label: "Sukuma", href: "/prices?q=sukuma" },
  { label: "Sugar", href: "/prices?q=sugar" },
  { label: "Ndengu", href: "/prices?q=ndengu" },
  { label: "Data", href: "/bundles" },
  { label: "Fuel", href: "/fuel" },
  { label: "iPhone", href: "/market?q=iphone%2013" },
] as const;

export const KENYA_MARKET_STARTERS = [
  { label: "Unga", q: "unga" },
  { label: "Kabras", q: "kabras sugar" },
  { label: "iPhone 13", q: "iphone 13" },
  { label: "Tecno", q: "tecno spark" },
  { label: "Always", q: "always pads" },
  { label: "Omo", q: "omo 1kg" },
] as const;
