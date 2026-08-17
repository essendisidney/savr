import { SAVR_BOT_UA } from "./crawlers/types";

export type DataBundle = {
  id: string;
  name: string;
  dataLabel: string;
  validity: string;
  buyUrl: string;
  priceCents: number | null;
};

export type BundleBoard = {
  source: "safaricom-page" | "official-link";
  observedAt: string | null;
  buyUrl: string;
  bundles: DataBundle[];
  note: string;
};

const BUY_URL = "https://www.safaricom.co.ke/personal/offers-and-products";

function parseBundleCards(html: string): DataBundle[] {
  const out: DataBundle[] = [];
  const seen = new Set<string>();
  const re = /(\d+(?:\.\d+)?)\s*(GB|MB)\b[\s\S]{0,120}?KSh\s*([\d,]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) && out.length < 16) {
    const qty = match[1];
    const unit = match[2].toUpperCase();
    const price = Math.round(Number(String(match[3]).replace(/,/g, "")) * 100);
    if (!Number.isFinite(price) || price <= 0) continue;
    const dataLabel = `${qty} ${unit}`;
    if (seen.has(dataLabel + price)) continue;
    seen.add(dataLabel + price);
    out.push({
      id: `${dataLabel}-${price}`,
      name: `Safaricom ${dataLabel}`,
      dataLabel,
      validity: "Confirm in MySafaricom",
      buyUrl: BUY_URL,
      priceCents: price,
    });
  }
  return out;
}

export async function loadSafaricomBundles(): Promise<BundleBoard> {
  try {
    const res = await fetch("https://www.safaricom.co.ke/personal/offers-and-products", {
      headers: {
        "User-Agent": SAVR_BOT_UA,
        Accept: "text/html",
        "Accept-Language": "en-KE,en;q=0.9",
      },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    } as RequestInit & { next?: { revalidate: number } });
    const html = await res.text();
    const bundles = res.ok ? parseBundleCards(html) : [];
    if (bundles.length) {
      return {
        source: "safaricom-page",
        observedAt: new Date().toISOString(),
        buyUrl: BUY_URL,
        bundles,
        note: "Parsed from Safaricom’s public offers page. Confirm in MySafaricom or dial *544# before you buy.",
      };
    }
  } catch {
    /* fall through */
  }

  return {
    source: "official-link",
    observedAt: null,
    buyUrl: BUY_URL,
    bundles: [
      { id: "1gb", name: "1GB data", dataLabel: "1 GB", validity: "Confirm live", buyUrl: BUY_URL, priceCents: null },
      { id: "5gb", name: "5GB data", dataLabel: "5 GB", validity: "Confirm live", buyUrl: BUY_URL, priceCents: null },
      { id: "10gb", name: "10GB data", dataLabel: "10 GB", validity: "Confirm live", buyUrl: BUY_URL, priceCents: null },
    ],
    note: "Safaricom doesn’t publish a stable public HTML price table. Open their official offers page or *544# — Savr will not invent bundle prices.",
  };
}
