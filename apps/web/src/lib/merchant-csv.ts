import type { Product } from "./types";

export type CsvPriceRow = {
  line: number;
  productId: string | null;
  skuName: string;
  brand: string;
  priceKes: number;
  matchedProduct: Product | null;
  error: string | null;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function csvTemplate(products: Product[]): string {
  const header = "product_id,sku_name,brand,price_kes";
  const rows = products.slice(0, 20).map((p) => {
    const name = `"${p.name.replace(/"/g, '""')}"`;
    const brand = p.brand ? `"${p.brand.replace(/"/g, '""')}"` : "";
    return `${p.id},${name},${brand},`;
  });
  return [header, ...rows].join("\n");
}

export function parsePriceCsv(text: string, products: Product[]): CsvPriceRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idxId = header.findIndex((h) => h === "product_id" || h === "id");
  const idxName = header.findIndex((h) => h === "sku_name" || h === "name" || h === "product");
  const idxBrand = header.findIndex((h) => h === "brand");
  const idxPrice = header.findIndex((h) => h === "price_kes" || h === "price" || h === "kes");

  if (idxPrice < 0) {
    return [
      {
        line: 1,
        productId: null,
        skuName: "",
        brand: "",
        priceKes: 0,
        matchedProduct: null,
        error: "CSV needs a price_kes column",
      },
    ];
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const byName = new Map(
    products.map((p) => [`${p.name.toLowerCase()}|${(p.brand ?? "").toLowerCase()}`, p]),
  );

  const rows: CsvPriceRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const productId = idxId >= 0 ? cols[idxId] || null : null;
    const skuName = idxName >= 0 ? cols[idxName] ?? "" : "";
    const brand = idxBrand >= 0 ? cols[idxBrand] ?? "" : "";
    const priceRaw = cols[idxPrice] ?? "";
    const priceKes = Number(String(priceRaw).replace(/,/g, ""));

    let matched: Product | null = productId ? byId.get(productId) ?? null : null;
    if (!matched && skuName) {
      matched =
        byName.get(`${skuName.toLowerCase()}|${brand.toLowerCase()}`) ??
        products.find((p) => p.name.toLowerCase() === skuName.toLowerCase()) ??
        null;
    }

    let error: string | null = null;
    if (!Number.isFinite(priceKes) || priceKes < 0) error = "Invalid price_kes";
    else if (!matched) error = "No matching catalog product";

    rows.push({
      line: i + 1,
      productId: matched?.id ?? productId,
      skuName: matched?.name ?? skuName,
      brand: matched?.brand ?? brand,
      priceKes,
      matchedProduct: matched,
      error,
    });
  }
  return rows;
}
