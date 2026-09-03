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
  boostedUntil: string | null;
  avgStars: number | null;
  ratingCount: number;
  createdAt: string;
};

export type EscrowEvent = {
  id: string;
  status: string;
  note: string | null;
  dryRun: boolean;
  createdAt: string;
};

export const BOOST_KES = 50;
export const VERIFY_KES = 100;
export const BOOST_DAYS = 7;

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

export function formatSellerRating(
  listing: Pick<MarketplaceListing, "avgStars" | "ratingCount">,
): string | null {
  if (!listing.avgStars || listing.ratingCount < 1) return null;
  return `${listing.avgStars.toFixed(1)} · ${listing.ratingCount}`;
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
function demo(
  id: string,
  sellerName: string,
  title: string,
  priceCents: number,
  imageUrl: string,
  verified: boolean,
  boostedUntil: string | null = null,
): MarketplaceListing {
  return {
    id,
    sellerId: "demo",
    sellerName,
    title,
    priceCents,
    status: "live",
    city: "Nairobi",
    imageUrl,
    verified,
    boostedUntil,
    avgStars: verified ? 4.8 : null,
    ratingCount: verified ? 3 : 0,
    createdAt: new Date().toISOString(),
  };
}

export const DEMO_LISTINGS: MarketplaceListing[] = [
  demo("demo-iphone", "Amina", "iPhone 13 128GB", 4_500_000, DEMO_IMAGES[0], true, new Date(Date.now() + 864e5).toISOString()),
  demo("demo-table", "Brian", "Oak dining table", 850_000, DEMO_IMAGES[1], false),
  demo("demo-dress", "Wanjiku", "Think Twice dress", 80_000, DEMO_IMAGES[2], true),
  demo("demo-tv", "Otieno", "Samsung 43\" Smart TV", 2_200_000, DEMO_IMAGES[3], false),
  demo("demo-laptop", "Faith", "Dell Latitude laptop", 3_500_000, DEMO_IMAGES[4], true),
  demo("demo-car", "Kevin", "Toyota Fielder 2014", 15_000_000, DEMO_IMAGES[5], true),
  demo("demo-shoes", "Njeri", "Nike Air Force 1", 450_000, DEMO_IMAGES[0], false),
  demo("demo-sofa", "Daniel", "3-seater sofa", 1_200_000, DEMO_IMAGES[1], false),
  demo("demo-bike", "Grace", "Mountain bike", 950_000, DEMO_IMAGES[5], false),
  demo("demo-fridge", "Sam", "Double-door fridge", 2_800_000, DEMO_IMAGES[3], true),
  demo("demo-watch", "Lucy", "Casio watch", 250_000, DEMO_IMAGES[0], false),
  demo("demo-speaker", "Ian", "JBL Bluetooth speaker", 380_000, DEMO_IMAGES[4], false),
  demo("demo-jacket", "Mary", "Leather jacket M", 320_000, DEMO_IMAGES[2], false),
  demo("demo-monitor", "Peter", "24\" Dell monitor", 750_000, DEMO_IMAGES[4], true),
  demo("demo-ps5", "Chris", "PlayStation 5 Disc", 5_500_000, DEMO_IMAGES[0], true),
  demo("demo-microwave", "Ann", "Microwave oven", 420_000, DEMO_IMAGES[3], false),
  demo("demo-bed", "Joe", "5x6 bed + mattress", 1_800_000, DEMO_IMAGES[1], false),
  demo("demo-camera", "Tess", "Canon EOS M50", 4_200_000, DEMO_IMAGES[0], true),
  demo("demo-scooter", "Ben", "Electric scooter", 2_100_000, DEMO_IMAGES[5], false),
  demo("demo-bags", "Cathy", "Designer tote bag", 600_000, DEMO_IMAGES[2], false),
];

export function isBoosted(listing: Pick<MarketplaceListing, "boostedUntil">): boolean {
  if (!listing.boostedUntil) return false;
  return new Date(listing.boostedUntil).getTime() > Date.now();
}

export function buildListingShare(params: {
  id: string;
  title: string;
  priceCents: number;
}): { title: string; text: string; url: string } {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://savr-teal.vercel.app";
  const url = `${origin}/listing/${params.id}`;
  return {
    title: params.title,
    text: `Check this on Savr — ${params.title} for ${formatKes(params.priceCents)}. Buy with M-Pesa escrow. Sell. Buy. Trust.`,
    url,
  };
}

export function buildTrustedSaleShare(params: {
  title: string;
  priceCents: number;
  dealId: string;
  dryRun?: boolean;
}): { title: string; text: string; url: string } {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://savr-teal.vercel.app";
  const url = `${origin}/deals/${params.dealId}`;
  const dry = params.dryRun ? " (dry-run escrow)" : "";
  return {
    title: "Sold safely on Savr",
    text: `Sold safely on Savr — ${params.title} for ${formatKes(params.priceCents)}. Money held in escrow until confirm.${dry} Sell. Buy. Trust.`,
    url,
  };
}

export function whatsAppShareUrl(payload: { text: string; url: string }): string {
  return `https://wa.me/?text=${encodeURIComponent(`${payload.text}\n${payload.url}`)}`;
}

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
