/** Local queue of Ask phrases that missed the catalog — soft-launch demand signal. */

const KEY = "savr_unmatched_asks_v1";
const MAX = 40;

export type UnmatchedAsk = {
  q: string;
  count: number;
  requested: boolean;
  at: string;
};

export function loadUnmatchedAsks(): UnmatchedAsk[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is UnmatchedAsk =>
          !!row &&
          typeof row === "object" &&
          typeof (row as UnmatchedAsk).q === "string" &&
          typeof (row as UnmatchedAsk).count === "number",
      )
      .map((row) => ({
        q: row.q.trim().slice(0, 80),
        count: Math.max(1, row.count),
        requested: Boolean(row.requested),
        at: typeof row.at === "string" ? row.at : new Date().toISOString(),
      }))
      .filter((row) => row.q.length > 0)
      .slice(0, MAX);
  } catch {
    return [];
  }
}

function save(rows: UnmatchedAsk[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX)));
  } catch {
    /* private mode */
  }
}

export function pushUnmatchedAsk(raw: string): void {
  const q = raw.trim().slice(0, 80);
  if (!q || q.length < 2) return;
  const key = q.toLowerCase();
  const prev = loadUnmatchedAsks();
  const hit = prev.find((r) => r.q.toLowerCase() === key);
  const next: UnmatchedAsk[] = hit
    ? [
        { ...hit, count: hit.count + 1, at: new Date().toISOString() },
        ...prev.filter((r) => r.q.toLowerCase() !== key),
      ]
    : [{ q, count: 1, requested: false, at: new Date().toISOString() }, ...prev];
  save(next);
}

export function markAskRequested(raw: string): void {
  const key = raw.trim().toLowerCase().slice(0, 80);
  if (!key) return;
  const next = loadUnmatchedAsks().map((r) =>
    r.q.toLowerCase() === key ? { ...r, requested: true, at: new Date().toISOString() } : r,
  );
  save(next);
}
