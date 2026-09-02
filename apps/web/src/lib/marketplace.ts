/** Marketplace types + demo seed + client helpers. */

export type ListingStatus = "draft" | "live" | "reserved" | "sold" | "removed";

export type DealStatus =
  | "pending_pay"
  | "in_escrow"
  | "released"
  | "refunded"
  | "cancelled";

export type MarketplaceListing = {
  id: string;
  sellerId: string;
  sellerName: string | null;
  title: string;
  priceCents: number;
  status: ListingStatus;
  city: string;
  imageUrl: string | null;
  verified: boolean;
  createdAt: string;
};

export type MarketplaceDeal = {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  sellerId: string;
  priceCents: number;
  feeCents: number;
  status: DealStatus;
  createdAt: string;
  imageUrl: string | null;
};

export const FEE_BPS = 300; // 3%

export function feeCentsFor(priceCents: number): number {
  return Math.max(0, Math.round((priceCents * FEE_BPS) / 10_000));
}

export function sellerPayoutCents(priceCents: number): number {
  return Math.max(100, priceCents - feeCentsFor(priceCents));
}

export function formatKes(cents: number): string {
  return `KES ${Math.round(cents / 100).toLocaleString("en-KE")}`;
}

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80",
];

/** Offline demo board so Home is never empty. */
export const DEMO_LISTINGS: MarketplaceListing[] = [
  { id: "demo-iphone", sellerId: "demo", sellerName: "Amina", title: "iPhone 13 128GB", priceCents: 4_500_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[0], verified: true, createdAt: new Date().toISOString() },
  { id: "demo-table", sellerId: "demo", sellerName: "Brian", title: "Oak dining table", priceCents: 850_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[1], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-dress", sellerId: "demo", sellerName: "Wanjiku", title: "Think Twice dress", priceCents: 80_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[2], verified: true, createdAt: new Date().toISOString() },
  { id: "demo-tv", sellerId: "demo", sellerName: "Otieno", title: "Samsung 43\" Smart TV", priceCents: 2_200_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[3], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-laptop", sellerId: "demo", sellerName: "Faith", title: "Dell Latitude laptop", priceCents: 3_500_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[4], verified: true, createdAt: new Date().toISOString() },
  { id: "demo-car", sellerId: "demo", sellerName: "Kevin", title: "Toyota Fielder 2014", priceCents: 15_000_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[5], verified: true, createdAt: new Date().toISOString() },
  { id: "demo-shoes", sellerId: "demo", sellerName: "Njeri", title: "Nike Air Force 1", priceCents: 450_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[0], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-sofa", sellerId: "demo", sellerName: "Daniel", title: "3-seater sofa", priceCents: 1_200_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[1], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-bike", sellerId: "demo", sellerName: "Grace", title: "Mountain bike", priceCents: 950_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[5], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-fridge", sellerId: "demo", sellerName: "Sam", title: "Double-door fridge", priceCents: 2_800_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[3], verified: true, createdAt: new Date().toISOString() },
  { id: "demo-watch", sellerId: "demo", sellerName: "Lucy", title: "Casio watch", priceCents: 250_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[0], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-speaker", sellerId: "demo", sellerName: "Ian", title: "JBL Bluetooth speaker", priceCents: 380_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[4], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-jacket", sellerId: "demo", sellerName: "Mary", title: "Leather jacket M", priceCents: 320_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[2], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-monitor", sellerId: "demo", sellerName: "Peter", title: "24\" Dell monitor", priceCents: 750_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[4], verified: true, createdAt: new Date().toISOString() },
  { id: "demo-ps5", sellerId: "demo", sellerName: "Chris", title: "PlayStation 5 Disc", priceCents: 5_500_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[0], verified: true, createdAt: new Date().toISOString() },
  { id: "demo-microwave", sellerId: "demo", sellerName: "Ann", title: "Microwave oven", priceCents: 420_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[3], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-bed", sellerId: "demo", sellerName: "Joe", title: "5x6 bed + mattress", priceCents: 1_800_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[1], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-camera", sellerId: "demo", sellerName: "Tess", title: "Canon EOS M50", priceCents: 4_200_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[0], verified: true, createdAt: new Date().toISOString() },
  { id: "demo-scooter", sellerId: "demo", sellerName: "Ben", title: "Electric scooter", priceCents: 2_100_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[5], verified: false, createdAt: new Date().toISOString() },
  { id: "demo-bags", sellerId: "demo", sellerName: "Cathy", title: "Designer tote bag", priceCents: 600_000, status: "live", city: "Nairobi", imageUrl: DEMO_IMAGES[2], verified: false, createdAt: new Date().toISOString() },
];

export function searchDemoListings(q: string): MarketplaceListing[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return DEMO_LISTINGS;
  return DEMO_LISTINGS.filter(
    (l) =>
      l.title.toLowerCase().includes(needle) ||
      l.city.toLowerCase().includes(needle) ||
      (l.sellerName ?? "").toLowerCase().includes(needle),
  );
}

export function dealStatusLabel(status: DealStatus): string {
  switch (status) {
    case "pending_pay":
      return "Waiting for M-Pesa";
    case "in_escrow":
      return "In escrow — money held";
    case "released":
      return "Paid to seller";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
  }
}
