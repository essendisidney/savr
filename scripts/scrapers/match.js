/** Fuzzy match scraped listings → Savr Weekly 30 SKUs. */

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 1 && !["the", "and", "for", "with", "pack", "of"].includes(t));
}

function extractSize(s) {
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

function packCount(s) {
  const n = normalize(s);
  const m = n.match(/pack\s*(?:of\s*)?(\d+)/);
  if (m) return Number(m[1]);
  const packs = n.match(/(\d+)\s*packs?\b/);
  if (packs) return Number(packs[1]);
  const x = n.match(/x\s*(\d+)\b/);
  return x ? Number(x[1]) : 1;
}

function scoreListing(sku, listing) {
  const brand = normalize(sku.brand);
  const listingBrand = normalize(listing.brand || "");
  const listingName = normalize(listing.name || "");
  const hay = `${listingBrand} ${listingName}`;

  let score = 0;
  if (brand && brand !== "local") {
    const brandInListing =
      listingBrand === brand ||
      listingBrand.split(/\s+/).includes(brand) ||
      new RegExp(`(?:^|\\s)${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`).test(hay);
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
  // Prefer single units for single-unit SKUs (except noodles 5-pack / tissue 10 / eggs tray).
  if (!/5-pack|tray 30|10 pack/i.test(sku.name) && packs > 1) {
    score -= 0.4;
  }

  // Powder / whipping cream should not win "fresh milk".
  if (/fresh milk|uht milk/i.test(sku.name) && /powder|whipping|condensed/i.test(hay)) {
    score -= 0.5;
  }

  return Math.max(0, Math.min(0.95, score));
}

/**
 * @param {{ id: string, name: string, brand: string }} sku
 * @param {{ name: string, brand?: string, priceCents: number, url?: string }[]} listings
 */
function bestMatch(sku, listings, minScore = 0.52) {
  let best = null;
  for (const listing of listings) {
    if (!listing?.priceCents || listing.priceCents < 500) continue;
    const score = scoreListing(sku, listing);
    if (score < minScore) continue;
    if (!best || score > best.score) best = { listing, score };
  }
  return best;
}

module.exports = { bestMatch, scoreListing, normalize };
