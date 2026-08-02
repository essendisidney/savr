type TrackProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    va?: (event: "event", payload: { name: string; data?: TrackProps }) => void;
  }
}

/** Best-effort product analytics — Vercel + durable savr_events when signed in. No PII. */
export function track(name: string, data?: TrackProps): void {
  try {
    if (typeof window === "undefined") return;
    window.va?.("event", { name, data });
    void persistDurable(name, data);
  } catch {
    /* ignore */
  }
}

async function persistDurable(name: string, data?: TrackProps): Promise<void> {
  try {
    const { recordSavrEvent } = await import("./actions");
    // Skip names already written by server actions to cut duplicate rows.
    if (
      name === "basket_confirm" ||
      name === "watch_product" ||
      name === "unwatch_product" ||
      name === "fuel_tip" ||
      name === "basket_coverage_tip"
    ) {
      return;
    }
    await recordSavrEvent(name, data);
  } catch {
    /* ignore */
  }
}
