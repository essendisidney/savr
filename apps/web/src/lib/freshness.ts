const STALE_MS = 7 * 24 * 60 * 60 * 1000;

export function formatPriceFreshness(
  observedAt: string | null | undefined,
  _source?: string | null,
): { label: string; stale: boolean } {
  if (!observedAt) {
    return { label: "", stale: false };
  }
  const then = new Date(observedAt).getTime();
  if (!Number.isFinite(then)) {
    return { label: "", stale: false };
  }
  const age = Date.now() - then;
  const stale = age > STALE_MS;
  let when: string;
  if (age < 60_000) when = "just now";
  else if (age < 3_600_000) when = `${Math.max(1, Math.round(age / 60_000))}m ago`;
  else if (age < 86_400_000) when = `${Math.max(1, Math.round(age / 3_600_000))}h ago`;
  else when = `${Math.max(1, Math.round(age / 86_400_000))}d ago`;

  return {
    label: stale ? `Updated ${when} · may be stale` : `Updated ${when}`,
    stale,
  };
}

export function freshnessClassName(stale: boolean, tone: "dark" | "light" = "light"): string {
  if (stale) return tone === "dark" ? "text-amber-300" : "text-amber-700";
  return tone === "dark" ? "text-white/55" : "text-savr-mute";
}
