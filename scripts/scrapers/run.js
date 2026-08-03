/**
 * Savr public price scrapers — soft-launch ingest.
 *
 * Labels every write as source='scrape' (never merchant/verified).
 * Never overwrites merchant / crowdsource / tip rows.
 *
 * Usage:
 *   node scripts/scrapers/run.js                 # dry-run Weekly 30
 *   node scripts/scrapers/run.js --apply         # upsert to Supabase
 *   node scripts/scrapers/run.js --source=jumia
 *   node scripts/scrapers/run.js --limit=5
 *
 * Requires apps/web/.env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for --apply.
 */

const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { WEEKLY_30 } = require("./weekly-30-data");
const { searchJumia } = require("./adapters/jumia");
const { searchCarrefour } = require("./adapters/carrefour");
const { bestMatch } = require("./match");
const { ensureOnlineMerchant, upsertScrapePrices } = require("./upsert");

function loadEnv() {
  const candidates = [
    path.join(__dirname, "../../apps/web/.env.local"),
    path.join(__dirname, "../../.env.local"),
    path.join(__dirname, "../../.env"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs(argv) {
  const out = { apply: false, source: "all", limit: WEEKLY_30.length };
  for (const a of argv) {
    if (a === "--apply") out.apply = true;
    else if (a.startsWith("--source=")) out.source = a.slice(9);
    else if (a.startsWith("--limit=")) out.limit = Math.max(1, Number(a.slice(8)) || 5);
  }
  return out;
}

const SOURCES = {
  jumia: {
    id: "jumia",
    merchantSlug: "jumia",
    merchantName: "Jumia",
    search: searchJumia,
  },
  carrefour: {
    id: "carrefour",
    merchantSlug: "carrefour",
    merchantName: "Carrefour",
    search: searchCarrefour,
  },
};

async function runSource(source, skus, { politeMs = 1400 } = {}) {
  const hits = [];
  const misses = [];
  const errors = [];

  for (const sku of skus) {
    const q = `${sku.brand} ${sku.name}`.replace(/\s+/g, " ").trim();
    try {
      const listings = await source.search(q);
      const pick = bestMatch(sku, listings);
      if (!pick) {
        misses.push({ sku: sku.name, query: q, reason: "no confident match" });
      } else {
        hits.push({
          productId: sku.id,
          productName: sku.name,
          brand: sku.brand,
          priceCents: pick.listing.priceCents,
          score: pick.score,
          listingName: pick.listing.name,
          listingUrl: pick.listing.url,
          sourceId: source.id,
          merchantSlug: source.merchantSlug,
        });
      }
    } catch (err) {
      errors.push({ sku: sku.name, error: err instanceof Error ? err.message : String(err) });
    }
    await sleep(politeMs);
  }

  return { hits, misses, errors };
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const skus = WEEKLY_30.slice(0, args.limit);
  const sourceIds =
    args.source === "all" ? Object.keys(SOURCES) : [args.source].filter((s) => SOURCES[s]);

  if (!sourceIds.length) {
    console.error("Unknown --source. Use jumia, carrefour, or all.");
    process.exit(1);
  }

  console.log(
    `Savr scrape · sources=${sourceIds.join(",")} · skus=${skus.length} · mode=${
      args.apply ? "APPLY" : "dry-run"
    }`,
  );
  console.log("Honesty: source=scrape · never overwrites merchant/tip shelves.\n");

  const allHits = [];
  const report = [];

  for (const sid of sourceIds) {
    const source = SOURCES[sid];
    console.log(`→ ${source.id}…`);
    const result = await runSource(source, skus);
    allHits.push(...result.hits);
    report.push({ source: sid, ...result });
    console.log(
      `  hits=${result.hits.length} misses=${result.misses.length} errors=${result.errors.length}`,
    );
    for (const h of result.hits.slice(0, 8)) {
      console.log(
        `  ✓ ${h.productName} → KES ${Math.round(h.priceCents / 100)} (${h.score.toFixed(2)}) · ${h.listingName.slice(0, 60)}`,
      );
    }
    for (const e of result.errors.slice(0, 5)) {
      console.log(`  ✗ ${e.sku}: ${e.error}`);
    }
  }

  const outDir = path.join(__dirname, "../../ops");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(outDir, `scrape-report-${stamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ when: new Date().toISOString(), report, hits: allHits }, null, 2));
  console.log(`\nWrote ${reportPath}`);

  if (!args.apply) {
    console.log("Dry-run only. Re-run with --apply to upsert into Supabase.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Group hits by merchant slug
  const byMerchant = new Map();
  for (const h of allHits) {
    const list = byMerchant.get(h.merchantSlug) || [];
    list.push(h);
    byMerchant.set(h.merchantSlug, list);
  }

  let written = 0;
  let skipped = 0;
  for (const [slug, hits] of byMerchant) {
    const name = SOURCES[Object.keys(SOURCES).find((k) => SOURCES[k].merchantSlug === slug)]?.merchantName || slug;
    const merchant = await ensureOnlineMerchant(supabase, { slug, name });
    const res = await upsertScrapePrices(supabase, merchant, hits);
    written += res.written;
    skipped += res.skipped;
    console.log(`Upsert ${slug}: written=${res.written} skipped(protected)=${res.skipped}`);
  }

  console.log(`\nDone. written=${written} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
