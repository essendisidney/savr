type TrackProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    va?: (event: "event", payload: { name: string; data?: TrackProps }) => void;
  }
}

/** Best-effort product analytics — no PII. */
export function track(name: string, data?: TrackProps): void {
  try {
    if (typeof window === "undefined") return;
    window.va?.("event", { name, data });
  } catch {
    /* ignore */
  }
}
