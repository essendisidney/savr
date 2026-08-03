import type { Catalog, FuelStation } from "./types";

export type DataHonesty = {
  mode: "tips" | "seed" | "demo" | "mixed";
  /** Short label for heroes / chips */
  label: string;
  /** Amber banner when shoppers might over-trust the numbers */
  banner: string | null;
};

function isTipOrMerchant(source: string | null | undefined): boolean {
  const s = (source ?? "").toLowerCase().trim();
  return (
    s === "merchant" ||
    s === "partner" ||
    s === "verified" ||
    s === "crowdsource" ||
    s === "tip" ||
    s === "user"
  );
}

function isSeedish(source: string | null | undefined): boolean {
  const s = (source ?? "").toLowerCase().trim();
  return !s || s === "seed" || s === "ops" || s === "catalog" || s === "fallback";
}

/** Grocery catalog honesty for Prices / Basket / Home. */
export function catalogHonesty(catalog: Catalog | null | undefined): DataHonesty {
  if (!catalog) {
    return { mode: "demo", label: "loading", banner: null };
  }
  if (catalog.source === "fallback") {
    return {
      mode: "demo",
      label: "offline demo",
      banner:
        "Offline demo shelves — not live Nairobi boards. Tip a tag or upload a Weekly 30 walk to replace them.",
    };
  }
  const prices = catalog.prices;
  if (!prices.length) {
    return {
      mode: "seed",
      label: "empty catalog",
      banner: "No shelf prices yet — run a Weekly 30 walk or tip what you see.",
    };
  }
  const tipLike = prices.filter((p) => isTipOrMerchant(p.source)).length;
  const tipRatio = tipLike / prices.length;
  if (tipRatio >= 0.7) {
    return { mode: "tips", label: "tips + merchant", banner: null };
  }
  if (tipRatio >= 0.25) {
    return {
      mode: "mixed",
      label: "mixed seed + tips",
      banner:
        "Some shelves are still catalog seed — tip what you see before you treat ranks as gospel.",
    };
  }
  return {
    mode: "seed",
    label: "catalog seed",
    banner:
      "Most prices are catalog seed — not a just-walked shelf. Tip a tag or run Weekly 30 to raise accuracy.",
  };
}

/** Fuel list honesty for Fuel / Home / Map. */
export function fuelHonesty(
  stations: FuelStation[],
  listSource: string | null | undefined,
): DataHonesty {
  if (listSource === "fallback" || !stations.length) {
    return {
      mode: "demo",
      label: "demo nearby prices",
      banner:
        "Illustrative seed pump prices — not live boards. Tip a real station when the catalog is online.",
    };
  }
  const tipLike = stations.filter((s) => isTipOrMerchant(s.source)).length;
  const tipRatio = tipLike / stations.length;
  if (tipRatio >= 0.5) {
    return { mode: "tips", label: "tips + catalog", banner: null };
  }
  if (stations.every((s) => isSeedish(s.source))) {
    return {
      mode: "seed",
      label: "catalog seed",
      banner:
        "Pump prices are still catalog seed — confirm at the board before you fill up on Savr’s rank alone.",
    };
  }
  return {
    mode: "mixed",
    label: "mixed seed + tips",
    banner: "Some pumps are still seed — tip the board price when you fill.",
  };
}

/** True when we should not invent “save on a tank” from seed/demo fuel. */
export function fuelSavingsCredible(
  stations: FuelStation[],
  listSource: string | null | undefined,
): boolean {
  const h = fuelHonesty(stations, listSource);
  return h.mode === "tips" || h.mode === "mixed";
}
