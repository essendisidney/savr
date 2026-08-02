import type { FuelType } from "./types";

const FUEL_KEY = "savr_fuel_prefs_v1";

export type FuelPrefsDraft = {
  fuelType: FuelType;
  sort: "price" | "distance" | "value";
  updatedAt: number;
};

const SORTS = new Set(["price", "distance", "value"]);

export function loadFuelPrefsDraft(): FuelPrefsDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FUEL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FuelPrefsDraft>;
    const fuelType = parsed.fuelType === "diesel" ? "diesel" : "petrol";
    const sort =
      typeof parsed.sort === "string" && SORTS.has(parsed.sort)
        ? (parsed.sort as FuelPrefsDraft["sort"])
        : "value";
    return {
      fuelType,
      sort,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveFuelPrefsDraft(
  fuelType: FuelType,
  sort: FuelPrefsDraft["sort"],
): void {
  if (typeof window === "undefined") return;
  try {
    const draft: FuelPrefsDraft = {
      fuelType,
      sort,
      updatedAt: Date.now(),
    };
    localStorage.setItem(FUEL_KEY, JSON.stringify(draft));
  } catch {
    /* private mode / quota */
  }
}
