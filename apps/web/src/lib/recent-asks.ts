const KEY = "savr_recent_asks_v1";
const MAX = 6;

export function loadRecentAsks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim().slice(0, 80))
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushRecentAsk(raw: string): void {
  if (typeof window === "undefined") return;
  const q = raw.trim().slice(0, 80);
  if (!q) return;
  try {
    const prev = loadRecentAsks().filter((x) => x.toLowerCase() !== q.toLowerCase());
    localStorage.setItem(KEY, JSON.stringify([q, ...prev].slice(0, MAX)));
  } catch {
    /* private mode */
  }
}
