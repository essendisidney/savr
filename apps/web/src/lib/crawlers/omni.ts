import type { MarketCountry, MarketCurrency, MarketListing } from "./types";
import { decodeHtml, parseAmountCents } from "./http";

/**
 * Honest omni extract: listed schema.org / Open Graph offers only.
 * Never sniff the first number on the page, never mix USD with KES,
 * never invent a price when JSON-LD is missing.
 */
export type OmniContext = {
  shopId: string;
  shop: string;
  country: MarketCountry;
  currency: MarketCurrency;
  pageUrl: string;
  limit?: number;
};

type JsonRec = Record<string, unknown>;

function asRec(v: unknown): JsonRec | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as JsonRec) : null;
}

function asList(v: unknown): unknown[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function typeOf(node: JsonRec): string[] {
  const raw = node["@type"];
  if (typeof raw === "string") return [raw.toLowerCase()];
  if (Array.isArray(raw)) return raw.map((t) => String(t).toLowerCase());
  return [];
}

function isType(node: JsonRec, want: string[]): boolean {
  const types = typeOf(node);
  return want.some((w) => types.includes(w));
}

function brandName(raw: unknown): string | null {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const rec = asRec(raw);
  const name = rec && typeof rec.name === "string" ? rec.name.trim() : "";
  return name || null;
}

function textName(raw: unknown): string {
  if (typeof raw === "string") return decodeHtml(raw).trim();
  const rec = asRec(raw);
  if (rec && typeof rec.name === "string") return decodeHtml(rec.name).trim();
  return "";
}

function hostAllowsImpliedCurrency(pageUrl: string, country: MarketCountry): boolean {
  let host = "";
  try {
    host = new URL(pageUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return false;
  }
  const known: Record<MarketCountry, string[]> = {
    ke: ["jumia.co.ke", "kilimall.co.ke", "carrefour.ke", "naivas.online", "naivas.co.ke", "jiji.co.ke"],
    ng: ["jumia.com.ng", "jiji.ng"],
    ug: ["jumia.ug", "jiji.ug"],
    tz: ["jumia.co.tz"],
    gh: ["jumia.com.gh"],
  };
  return (known[country] ?? []).some((h) => host === h || host.endsWith(`.${h}`));
}

function currencyMatches(raw: unknown, expected: MarketCurrency): boolean {
  const u = String(raw ?? "")
    .replace(/[\s.]/g, "")
    .toUpperCase();
  if (!u) return false;
  if (u === expected) return true;
  if (expected === "KES") return u === "KE" || u === "KSH" || u === "KSHS" || u === "KENYANSHILLING";
  if (expected === "NGN") return u === "NG" || u === "NAIRA";
  if (expected === "UGX") return u === "UG" || u === "USH";
  if (expected === "TZS") return u === "TZ" || u === "TSH";
  if (expected === "GHS") return u === "GH" || u === "CEDI" || u === "CEDIS" || u === "GH₵";
  return false;
}

function hrefFrom(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  const rec = asRec(raw);
  if (!rec) return "";
  if (typeof rec.url === "string") return rec.url.trim();
  const id = rec["@id"];
  if (typeof id === "string" && /^https?:\/\//i.test(id)) return id.trim();
  return "";
}

function absUrl(href: string | null | undefined, pageUrl: string): string | null {
  const raw = (href || "").trim();
  if (!raw || raw.startsWith("javascript:") || raw.startsWith("mailto:")) return null;
  try {
    return new URL(raw, pageUrl).toString().split("#")[0];
  } catch {
    return null;
  }
}

function walkJson(node: unknown, acc: JsonRec[]): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const item of node) walkJson(item, acc);
    return;
  }
  const rec = asRec(node);
  if (!rec) return;
  acc.push(rec);
  walkJson(rec["@graph"], acc);
  walkJson(rec.itemListElement, acc);
  walkJson(rec.item, acc);
  walkJson(rec.offers, acc);
  walkJson(rec.itemOffered, acc);
  walkJson(rec.mainEntity, acc);
  walkJson(rec.hasVariant, acc);
}

function parseJsonLdBlocks(html: string): JsonRec[] {
  const blocks = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  const nodes: JsonRec[] = [];
  for (const block of blocks) {
    const raw = decodeHtml(block[1] || "")
      .replace(/^\s*<!--[\s\S]*?-->/, "")
      .trim();
    try {
      walkJson(JSON.parse(raw), nodes);
    } catch {
      /* shop emitted invalid JSON-LD */
    }
  }
  return nodes;
}

function offerPrice(offer: JsonRec, expected: MarketCurrency, impliedOk: boolean): number | null {
  const currency = offer.priceCurrency ?? offer.priceCurrencyCode ?? offer.currency;
  const amount = offer.lowPrice ?? offer.price ?? offer.highPrice;
  const declared = String(currency ?? "").trim();
  if (declared) {
    if (!currencyMatches(declared, expected)) return null;
  } else if (!impliedOk) {
    return null;
  }
  return parseAmountCents(String(amount ?? ""));
}

function metaContent(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const a = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
  );
  if (a?.[1]) return decodeHtml(a[1]).trim();
  const b = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  );
  return b?.[1] ? decodeHtml(b[1]).trim() : null;
}

function fromOpenGraph(
  html: string,
  ctx: OmniContext,
): MarketListing[] {
  const amount =
    metaContent(html, "product:price:amount") ||
    metaContent(html, "og:price:amount") ||
    metaContent(html, "product:price:standard_amount");
  const currency =
    metaContent(html, "product:price:currency") ||
    metaContent(html, "og:price:currency") ||
    metaContent(html, "product:price:standard_currency");
  const title = metaContent(html, "og:title") || metaContent(html, "twitter:title");
  const url = absUrl(metaContent(html, "og:url"), ctx.pageUrl) ?? ctx.pageUrl;
  const priceCents = parseAmountCents(amount || "");
  if (!title || !priceCents || !currencyMatches(currency, ctx.currency)) return [];
  return [
    {
      id: `${ctx.shopId}:${url}`,
      shop: ctx.shop,
      shopId: ctx.shopId,
      country: ctx.country,
      name: title.replace(/\s*[|\-–].{0,40}$/, "").trim() || title,
      brand: null,
      priceCents,
      currency: ctx.currency,
      url,
      observedAt: new Date().toISOString(),
    },
  ];
}

function listingsFromJsonLd(nodes: JsonRec[], ctx: OmniContext): MarketListing[] {
  const now = new Date().toISOString();
  const out: MarketListing[] = [];
  const seen = new Set<string>();
  const limit = ctx.limit ?? 12;
  const impliedOk = hostAllowsImpliedCurrency(ctx.pageUrl, ctx.country);

  for (const node of nodes) {
    if (out.length >= limit) break;
    if (!isType(node, ["product", "productgroup", "individualproduct"])) continue;
    const name = textName(node.name);
    if (name.length < 3) continue;
    const offers = asList(node.offers).map(asRec).filter(Boolean) as JsonRec[];
    let priceCents: number | null = null;
    let offerUrl: string | null = null;
    for (const offer of offers) {
      priceCents = offerPrice(offer, ctx.currency, impliedOk);
      if (priceCents) {
        offerUrl = absUrl(hrefFrom(offer.url), ctx.pageUrl);
        break;
      }
    }
    if (!priceCents) {
      const ownCurrency = node.priceCurrency ?? node.priceCurrencyCode;
      const declared = String(ownCurrency ?? "").trim();
      if (declared ? currencyMatches(declared, ctx.currency) : impliedOk) {
        priceCents = parseAmountCents(String(node.price ?? node.lowPrice ?? ""));
      }
    }
    if (!priceCents) continue;
    const url =
      absUrl(hrefFrom(node.url), ctx.pageUrl) ||
      offerUrl ||
      ctx.pageUrl;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({
      id: `${ctx.shopId}:${String(node.sku || node.productID || url)}`,
      shop: ctx.shop,
      shopId: ctx.shopId,
      country: ctx.country,
      name,
      brand: brandName(node.brand),
      priceCents,
      currency: ctx.currency,
      url,
      observedAt: now,
    });
  }

  if (out.length) return out;

  for (const node of nodes) {
    if (out.length >= limit) break;
    if (!isType(node, ["offer", "aggregateoffer"])) continue;
    const priceCents = offerPrice(node, ctx.currency, impliedOk);
    const name = textName(node.name || node.itemOffered);
    if (!priceCents || name.length < 3) continue;
    const url = absUrl(hrefFrom(node.url), ctx.pageUrl) || ctx.pageUrl;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({
      id: `${ctx.shopId}:${url}`,
      shop: ctx.shop,
      shopId: ctx.shopId,
      country: ctx.country,
      name,
      brand: null,
      priceCents,
      currency: ctx.currency,
      url,
      observedAt: now,
    });
  }

  return out;
}

/** Structured listed offers from public HTML. Empty means we don't know — never a guessed price. */
export function extractListingsFromHtml(html: string, ctx: OmniContext): MarketListing[] {
  if (!html || html.length < 80) return [];
  const fromLd = listingsFromJsonLd(parseJsonLdBlocks(html), ctx);
  if (fromLd.length) return fromLd.slice(0, ctx.limit ?? 24);
  return fromOpenGraph(html, ctx).slice(0, ctx.limit ?? 24);
}

export function mergeListedOffers(groups: MarketListing[][], limit = 24): MarketListing[] {
  const byUrl = new Map<string, MarketListing>();
  for (const group of groups) {
    for (const row of group) {
      if (!row.name || !row.priceCents) continue;
      if (/\/(cart|checkout|login|customer|wishlist|account)\b/i.test(row.url)) continue;
      const key = row.url.replace(/\/+$/, "").toLowerCase().split("?")[0];
      if (!key || byUrl.has(key)) continue;
      byUrl.set(key, row);
    }
  }
  return [...byUrl.values()].slice(0, limit);
}

export function withHtmlOmniFallback(
  dedicated: MarketListing[],
  html: string,
  ctx: OmniContext,
): MarketListing[] {
  return dedicated.length ? dedicated : extractListingsFromHtml(html, { ...ctx, limit: ctx.limit ?? 24 });
}
