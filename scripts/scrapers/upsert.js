/** Ensure merchant + location, upsert scrape prices without clobbering tips/merchant. */

const PROTECTED = new Set(["merchant", "partner", "verified", "crowdsource", "tip", "user"]);

const JUMIA_ID = "11111111-1111-1111-1111-111111111190";

async function ensureOnlineMerchant(supabase, { slug, name }) {
  if (slug === "jumia") {
    const { data: existing } = await supabase
      .from("merchants")
      .select("id, name, slug")
      .eq("slug", "jumia")
      .maybeSingle();

    let merchantId = existing?.id;
    if (!merchantId) {
      const { data, error } = await supabase
        .from("merchants")
        .upsert(
          {
            id: JUMIA_ID,
            name: "Jumia",
            slug: "jumia",
            category: "grocery",
            is_verified: false,
          },
          { onConflict: "id" },
        )
        .select("id")
        .single();
      if (error) throw error;
      merchantId = data.id;
    }

    const { data: loc } = await supabase
      .from("merchant_locations")
      .select("id, name")
      .eq("merchant_id", merchantId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let locationId = loc?.id;
    if (!locationId) {
      const { data: created, error } = await supabase
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
      if (error) throw error;
      locationId = created.id;
    }

    return { id: merchantId, locationId, slug: "jumia", name: "Jumia" };
  }

  // Existing chain (e.g. Carrefour) — use first active location.
  const { data: merchant, error } = await supabase
    .from("merchants")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (error) throw error;

  const { data: loc, error: locErr } = await supabase
    .from("merchant_locations")
    .select("id")
    .eq("merchant_id", merchant.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (locErr) throw locErr;
  if (!loc?.id) throw new Error(`No active location for ${slug}`);

  return { id: merchant.id, locationId: loc.id, slug: merchant.slug, name: merchant.name };
}

async function upsertScrapePrices(supabase, merchant, hits) {
  let written = 0;
  let skipped = 0;

  for (const hit of hits) {
    const { data: existing } = await supabase
      .from("merchant_prices")
      .select("id, source, price_cents, observed_at, tip_count")
      .eq("merchant_id", merchant.id)
      .eq("location_id", merchant.locationId)
      .eq("product_id", hit.productId)
      .maybeSingle();

    const src = (existing?.source || "").toLowerCase();
    if (existing && PROTECTED.has(src)) {
      skipped += 1;
      continue;
    }

    const payload = {
      merchant_id: merchant.id,
      location_id: merchant.locationId,
      product_id: hit.productId,
      price_cents: hit.priceCents,
      source: "scrape",
      observed_at: new Date().toISOString(),
      tip_count: existing?.tip_count ?? 0,
    };

    if (existing && existing.price_cents !== hit.priceCents) {
      payload.prev_price_cents = existing.price_cents;
      payload.prev_observed_at = existing.observed_at;
    }

    const { error } = await supabase.from("merchant_prices").upsert(payload, {
      onConflict: "merchant_id,location_id,product_id",
    });
    if (error) throw error;
    written += 1;
  }

  return { written, skipped };
}

module.exports = { ensureOnlineMerchant, upsertScrapePrices };
