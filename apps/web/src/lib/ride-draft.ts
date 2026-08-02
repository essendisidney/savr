const ROUTE_KEY = "savr_ride_route_v1";

export type RideRouteDraft = {
  pickup: string;
  destination: string;
  updatedAt: number;
};

export function loadRideRouteDraft(): RideRouteDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ROUTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RideRouteDraft;
    if (
      !parsed ||
      typeof parsed.pickup !== "string" ||
      typeof parsed.destination !== "string" ||
      !parsed.pickup.trim() ||
      !parsed.destination.trim()
    ) {
      return null;
    }
    return {
      pickup: parsed.pickup.trim().slice(0, 80),
      destination: parsed.destination.trim().slice(0, 80),
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveRideRouteDraft(pickup: string, destination: string): void {
  if (typeof window === "undefined") return;
  const from = pickup.trim().slice(0, 80);
  const to = destination.trim().slice(0, 80);
  if (!from || !to) return;
  try {
    const draft: RideRouteDraft = {
      pickup: from,
      destination: to,
      updatedAt: Date.now(),
    };
    localStorage.setItem(ROUTE_KEY, JSON.stringify(draft));
  } catch {
    /* private mode / quota */
  }
}
