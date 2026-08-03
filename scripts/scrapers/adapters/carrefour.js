/**
 * Carrefour Kenya (MAF) — public search attempt.
 * Many environments get bot-challenged (empty HTML). Adapter fails soft;
 * when the JSON API responds, we parse products + prices.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SavrPriceBot/0.1 (+https://savr-teal.vercel.app; soft-launch research)";

function kesToCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Carrefour APIs often return major units (KES).
  return Math.round(n * 100);
}

function pickPrice(product) {
  const candidates = [
    product?.price?.price,
    product?.offers?.[0]?.price,
    product?.price,
    product?.originalPrice,
  ];
  for (const c of candidates) {
    if (c == null) continue;
    if (typeof c === "object" && c.price != null) {
      const cents = kesToCents(c.price);
      if (cents) return cents;
    }
    const cents = kesToCents(c);
    if (cents) return cents;
  }
  return null;
}

/**
 * @param {string} query
 */
async function searchCarrefour(query) {
  const url =
    `https://www.carrefour.ke/api/v8/search?keyword=${encodeURIComponent(query)}` +
    `&currentPage=0&pageSize=12&lang=en&latitude=-1.286389&longitude=36.817223` +
    `&requireSponsProducts=false&displayOffers=false&vertical=grocery&storeId=mafken`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.carrefour.ke/mafken/en/",
      "Accept-Language": "en-KE,en;q=0.9",
    },
    redirect: "follow",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Carrefour HTTP ${res.status}`);
  }
  if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
    throw new Error(
      "Carrefour blocked the bot request (HTML challenge). Use Weekly 30 / merchant upload for Carrefour shelves, or run from a residential IP with cookies.",
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Carrefour returned non-JSON");
  }

  const products =
    data?.products ||
    data?.products?.products ||
    data?.data?.products ||
    data?.hits ||
    [];

  const list = Array.isArray(products) ? products : [];
  const out = [];
  for (const p of list) {
    const name = p.name || p.title || p.productNameEn || "";
    const brand = p.brand?.name || p.brand || p.manufacturer || "";
    const priceCents = pickPrice(p);
    const id = p.id || p.sku || p.code || "";
    if (!name || !priceCents) continue;
    out.push({
      name: String(name).trim(),
      brand: String(brand).trim(),
      priceCents,
      url: p.url
        ? p.url.startsWith("http")
          ? p.url
          : `https://www.carrefour.ke${p.url}`
        : `https://www.carrefour.ke/mafken/en/search?keyword=${encodeURIComponent(query)}`,
      sku: String(id),
    });
  }
  return out;
}

module.exports = { searchCarrefour };
