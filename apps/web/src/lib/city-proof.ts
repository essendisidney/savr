import type { Catalog } from "./types";

export type CityProof = {
  productCount: number;
  groceryBranches: number;
  groceryChains: number;
  tipShelves: number;
  merchantShelves: number;
  scrapeShelves: number;
  seedShelves: number;
  /** Short chip for home / invite */
  chip: string;
  /** One-line proof for GTM */
  line: string;
};

/** Nairobi coverage proof from the live catalog (client-safe). */
export function cityProofFromCatalog(catalog: Catalog | null | undefined): CityProof | null {
  if (!catalog || catalog.source === "fallback") return null;

  const grocery = catalog.merchants.filter((m) => m.category === "grocery");
  const chains = new Set(grocery.map((m) => m.id));
  const branches = grocery.filter((m) => m.locationId || m.location?.id).length;

  let tipShelves = 0;
  let merchantShelves = 0;
  let scrapeShelves = 0;
  let seedShelves = 0;
  for (const p of catalog.prices) {
    const s = (p.source ?? "seed").toLowerCase();
    if (s === "crowdsource" || s === "tip" || s === "user") tipShelves += 1;
    else if (s === "merchant" || s === "partner" || s === "verified") merchantShelves += 1;
    else if (s === "scrape") scrapeShelves += 1;
    else seedShelves += 1;
  }

  const productCount = catalog.products.length;
  const trusted = tipShelves + merchantShelves;
  const chip =
    trusted > 0
      ? `${trusted} tip/merchant shelves · ${branches} branches`
      : `${productCount} staples · ${branches} branches`;

  const line =
    trusted > 0
      ? `Nairobi open · ${productCount} staples · ${branches} grocery branches · ${trusted} tip/merchant shelves (confirm on aisle).`
      : `Nairobi open · ${productCount} staples across ${branches} grocery branches.`;

  return {
    productCount,
    groceryBranches: branches,
    groceryChains: chains.size,
    tipShelves,
    merchantShelves,
    scrapeShelves,
    seedShelves,
    chip,
    line,
  };
}
