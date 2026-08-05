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
  return !s || s === "seed" || s === "ops" || s === "catalog" || s === "fallback" || s === "scrape";
}

function isEpra(source: string | null | undefined): boolean {
  return (source ?? "").toLowerCase().trim() === "epra";
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
      label: "mixed tips",
      banner: null,
    };
  }
  return {
    mode: "seed",
    label: "shelf prices",
    banner: null,
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
  if (stations.some((s) => isEpra(s.source)) && tipLike === 0) {
    return {
      mode: "mixed",
      label: "EPRA max",
      banner:
        "Live Nairobi EPRA ceiling this cycle. Same max at every pump until someone tips a real pump price.",
    };
  }
  if (stations.every((s) => isSeedish(s.source))) {
    return {
      mode: "seed",
      label: "pump prices",
      banner: null,
    };
  }
  return {
    mode: "mixed",
    label: "mixed tips",
    banner: null,
  };
}

/** True when we should not invent “save on a tank” from seed/demo fuel. */
export function fuelSavingsCredible(
  stations: FuelStation[],
  listSource: string | null | undefined,
): boolean {
  const h = fuelHonesty(stations, listSource);
  if (h.mode === "tips") return true;
  // EPRA ceiling alone is the same at every station — don't invent tank savings.
  if (stations.some((s) => isEpra(s.source)) && stations.every((s) => !isTipOrMerchant(s.source))) {
    return false;
  }
  return h.mode === "mixed";
}
