/** Match live listings onto Savr catalog SKUs. Conservative — skip weak hits. */

export type MatchSku = { id: string; name: string; brand: string };
export type MatchListing = { name: string; brand?: string | null; priceCents: number; url?: string };

function normalize(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 1 && !["the", "and", "for", "with", "pack", "of"].includes(t));
}

function extractSize(s: string): { qty: number; unit: string } | null {
  const n = normalize(s);
  const m = n.match(/(\d+(?:\.\d+)?)\s*(ml|l|g|kg|pcs|piece|tray)/);
  if (!m) return null;
  let qty = Number(m[1]);
  let unit = m[2];
  if (unit === "l") {
    qty *= 1000;
    unit = "ml";
  }
  if (unit === "kg") {
    qty *= 1000;
    unit = "g";
  }
  return { qty, unit };
}

function packCount(s: string): number {
  const n = normalize(s);
  const packOf = n.match(/pack\s*(?:of\s*)?(\d+)/);
  if (packOf) return Number(packOf[1]);
  const packs = n.match(/(\d+)\s*packs?\b/);
  if (packs) return Number(packs[1]);
  const x = n.match(/x\s*(\d+)\b/);
  return x ? Number(x[1]) : 1;
}

function scoreListing(sku: MatchSku, listing: MatchListing): number {
  const brand = normalize(sku.brand);
  const listingBrand = normalize(listing.brand || "");
  const listingName = normalize(listing.name || "");
  const hay = `${listingBrand} ${listingName}`;

  let score = 0;
  if (brand && brand !== "local") {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const brandInListing =
      listingBrand === brand ||
      listingBrand.split(/\s+/).includes(brand) ||
      new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(hay);
    if (!brandInListing) return 0;
    score += 0.32;
  }

  const skuToks = tokens(`${sku.brand} ${sku.name}`);
  const hitToks = tokens(hay);
  const overlap = skuToks.filter((t) => hitToks.includes(t)).length;
  score += Math.min(0.4, (overlap / Math.max(skuToks.length, 1)) * 0.5);

  const want = extractSize(sku.name);
  const got = extractSize(listing.name);
  if (want && got) {
    if (want.unit === got.unit && Math.abs(want.qty - got.qty) / want.qty < 0.15) score += 0.18;
    else if (want.unit === got.unit) score -= 0.2;
  } else if (want && !got) {
    score -= 0.05;
  }

  const packs = packCount(listing.name);
  if (!/5-pack|tray 30|10 pack/i.test(sku.name) && packs > 1) {
    score -= 0.4;
  }
  if (/fresh milk|uht milk/i.test(sku.name) && /powder|whipping|condensed/i.test(hay)) {
    score -= 0.5;
  }

  return Math.max(0, Math.min(0.95, score));
}

export function bestListingMatch(
  sku: MatchSku,
  listings: MatchListing[],
  minScore = 0.52,
): { listing: MatchListing; score: number } | null {
  let best: { listing: MatchListing; score: number } | null = null;
  for (const listing of listings) {
    if (!listing?.priceCents || listing.priceCents < 500) continue;
    const score = scoreListing(sku, listing);
    if (score < minScore) continue;
    if (!best || score > best.score) best = { listing, score };
  }
  return best;
}
