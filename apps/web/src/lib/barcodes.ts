/** Barcode / QR → product resolve for shelf tips. */

import { WEEKLY_30 } from "./weekly-30";

const LEARNED_KEY = "savr_barcode_map_v1";

export type BarcodeHit = {
  productId: string;
  via: "savr_qr" | "known" | "learned";
  raw: string;
};

function normalizeCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

/** Savr-controlled QR payloads we can mint without factory EANs. */
export function encodeSavrProductQr(productId: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "https://savr-teal.vercel.app");
  return `${base}/prices?id=${encodeURIComponent(productId)}`;
}

export function parseSavrProductPayload(raw: string): string | null {
  const t = normalizeCode(raw);
  const mSavr = /^savr:p:([0-9a-f-]{36})$/i.exec(t);
  if (mSavr) return mSavr[1]!.toLowerCase();

  try {
    const url = new URL(t);
    const id = url.searchParams.get("id");
    if (id && /^[0-9a-f-]{36}$/i.test(id) && url.pathname.includes("/prices")) {
      return id.toLowerCase();
    }
  } catch {
    /* not a URL */
  }

  if (/^[0-9a-f-]{36}$/i.test(t)) {
    // Bare UUID — treat as product id when it's a Weekly 30 / known catalog id.
    const lower = t.toLowerCase();
    if (WEEKLY_30.some((s) => s.id === lower)) return lower;
  }
  return null;
}

export function loadLearnedBarcodes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LEARNED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v)) {
        out[normalizeCode(k)] = v.toLowerCase();
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function learnBarcode(barcode: string, productId: string): void {
  const code = normalizeCode(barcode);
  if (!code || code.length < 4) return;
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return;
  try {
    const prev = loadLearnedBarcodes();
    prev[code] = productId.toLowerCase();
    localStorage.setItem(LEARNED_KEY, JSON.stringify(prev));
  } catch {
    /* private mode */
  }
}

/**
 * Seed / known factory barcodes.
 * Soft launch: mostly empty until shelf walks record EANs; learned map fills the gap.
 */
export const KNOWN_BARCODES: Record<string, string> = {
  // Add real EANs as you walk — key = digits only, value = product UUID.
};

export function resolveBarcode(raw: string): BarcodeHit | null {
  const code = normalizeCode(raw);
  if (!code) return null;

  const fromQr = parseSavrProductPayload(code);
  if (fromQr) return { productId: fromQr, via: "savr_qr", raw: code };

  const digits = code.replace(/\D/g, "");
  if (digits.length >= 8) {
    const known = KNOWN_BARCODES[digits];
    if (known) return { productId: known, via: "known", raw: digits };
    const learned = loadLearnedBarcodes()[digits] ?? loadLearnedBarcodes()[code];
    if (learned) return { productId: learned, via: "learned", raw: digits || code };
  }

  const learnedAny = loadLearnedBarcodes()[code];
  if (learnedAny) return { productId: learnedAny, via: "learned", raw: code };

  return null;
}
