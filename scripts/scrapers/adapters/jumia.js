/** Jumia Kenya public catalog search (HTML). Polite User-Agent; no auth bypass. */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SavrPriceBot/0.1 (+https://savr-teal.vercel.app; soft-launch research)";

function parseKes(text) {
  const m = String(text || "").replace(/,/g, "").match(/KSh\s*([\d]+(?:\.\d+)?)/i);
  if (!m) return null;
  return Math.round(Number(m[1]) * 100);
}

function decode(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * @param {string} query
 * @returns {Promise<{ name: string, brand: string, priceCents: number, url: string, sku?: string }[]>}
 */
async function searchJumia(query) {
  const url = `https://www.jumia.co.ke/catalog/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-KE,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Jumia HTTP ${res.status}`);
  }
  const html = await res.text();
  if (html.length < 2000) {
    throw new Error("Jumia returned an empty/blocked page");
  }

  const articles = [...html.matchAll(/<article[^>]*class="prd[\s\S]*?<\/article>/g)];
  const out = [];
  for (const m of articles) {
    const a = m[0];
    const name = decode((a.match(/data-ga4-item_name="([^"]+)"/) || [])[1] || "");
    const brand = decode((a.match(/data-ga4-item_brand="([^"]+)"/) || [])[1] || "");
    const sku = (a.match(/data-sku="([^"]+)"/) || [])[1];
    const prc = (a.match(/class="prc[^"]*"[^>]*>([^<]+)/) || [])[1];
    const href = (a.match(/href="(\/[^"]+\.html)"/) || [])[1];
    const priceCents = parseKes(prc);
    if (!name || !priceCents) continue;
    out.push({
      name: name.trim(),
      brand: brand.trim(),
      priceCents,
      url: href ? `https://www.jumia.co.ke${href}` : url,
      sku,
    });
  }
  return out;
}

module.exports = { searchJumia };
