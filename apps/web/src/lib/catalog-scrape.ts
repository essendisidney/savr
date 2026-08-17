import type { MarketListing } from "./crawlers/types";
import { bestListingMatch } from "./listing-match";
import { createAdminClient } from "./supabase-admin";

const PROTECTED = new Set(["merchant", "partner", "verified", "crowdsource", "tip", "user", "receipt"]);
const JUMIA_ID = "11111111-1111-1111-1111-111111111190";

const SHOP_SLUG: Record<string, string> = {
  "jumia-ke": "jumia",
  "carrefour-ke": "carrefour",
  "naivas-ke": "naivas",
  "kilimall-ke": "kilimall",
};

type MerchantTarget = { id: string; locationId: string; slug: string };

async function resolveMerchant(slug: string): Promise<MerchantTarget | null> {
  const admin = createAdminClient();
  if (slug === "jumia") {
    const { data: existing } = await admin.from("merchants").select("id").eq("slug", "jumia").maybeSingle();
    let merchantId = existing?.id as string | undefined;
    if (!merchantId) {
      const { data, error } = await admin
        .from("merchants")
        .upsert(
          { id: JUMIA_ID, name: "Jumia", slug: "jumia", category: "grocery", is_verified: false },
          { onConflict: "id" },
        )
        .select("id")
        .single();
      if (error || !data?.id) return null;
      merchantId = String(data.id);
    }
    const { data: loc } = await admin
      .from("merchant_locations")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    let locationId = loc?.id as string | undefined;
    if (!locationId) {
      const { data: created, error } = await admin
        .from("merchant_locations")
        .insert({
          merchant_id: merchantId,
          name: "Jumia Kenya · Online",
          city: "Nairobi",
          address: "jumia.co.ke",
          is_active: true,
        })
        .select("id")
        .single();
      if (error || !created?.id) return null;
      locationId = String(created.id);
    }
    return { id: merchantId, locationId, slug };
  }

  const { data: merchant, error } = await admin
    .from("merchants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !merchant?.id) return null;
  const { data: loc } = await admin
    .from("merchant_locations")
    .select("id")
    .eq("merchant_id", merchant.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!loc?.id) return null;
  return { id: String(merchant.id), locationId: String(loc.id), slug: String(merchant.slug ?? slug) };
}

/** Write matching online crawls onto catalog prices as source=scrape. Never clobbers tips/merchant. */
export async function applyOnlineScrapesToCatalog(
  listings: MarketListing[],
  products: { id: string; name: string; brand: string }[],
): Promise<{ written: number; skipped: number; matched: number }> {
  if (!listings.length || !products.length) return { written: 0, skipped: 0, matched: 0 };

  const bySlug = new Map<string, MarketListing[]>();
  for (const row of listings) {
    const slug = SHOP_SLUG[row.shopId];
    if (!slug) continue;
    const list = bySlug.get(slug) ?? [];
    list.push(row);
    bySlug.set(slug, list);
  }

  const admin = createAdminClient();
  let written = 0;
  let skipped = 0;
  let matched = 0;

  for (const [slug, shopListings] of bySlug) {
    const merchant = await resolveMerchant(slug);
    if (!merchant) continue;

    for (const sku of products) {
      const pick = bestListingMatch(sku, shopListings);
      if (!pick) continue;
      matched += 1;

      const { data: existing } = await admin
        .from("merchant_prices")
        .select("id, source, price_cents, observed_at, tip_count")
        .eq("merchant_id", merchant.id)
        .eq("location_id", merchant.locationId)
        .eq("product_id", sku.id)
        .maybeSingle();

      const src = String(existing?.source ?? "").toLowerCase();
      if (existing && PROTECTED.has(src)) {
        skipped += 1;
        continue;
      }

      const payload: Record<string, unknown> = {
        merchant_id: merchant.id,
        location_id: merchant.locationId,
        product_id: sku.id,
        price_cents: pick.listing.priceCents,
        source: "scrape",
        observed_at: new Date().toISOString(),
        tip_count: existing?.tip_count ?? 0,
      };
      if (existing && existing.price_cents !== pick.listing.priceCents) {
        payload.prev_price_cents = existing.price_cents;
        payload.prev_observed_at = existing.observed_at;
      }

      const { error } = await admin.from("merchant_prices").upsert(payload, {
        onConflict: "merchant_id,location_id,product_id",
      });
      if (!error) written += 1;
    }
  }

  return { written, skipped, matched };
}
