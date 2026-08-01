import { getSupabase } from "./supabase";

export type MerchantSummary = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  category: string;
  skuCount: number;
  cashbackCents: number;
};

export type ManagedPrice = {
  id: string;
  productId: string;
  productName: string;
  brand: string | null;
  priceCents: number;
  locationName: string | null;
};

export async function listMerchants(): Promise<MerchantSummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data: merchants } = await supabase
    .from("merchants")
    .select("id, name, slug, is_verified, category")
    .eq("category", "grocery")
    .order("name");

  if (!merchants?.length) return [];

  const { data: prices } = await supabase.from("merchant_prices").select("merchant_id");
  const { data: rules } = await supabase
    .from("cashback_rules")
    .select("merchant_id, flat_cents")
    .eq("is_active", true);

  const skuCount = new Map<string, number>();
  for (const p of prices ?? []) {
    skuCount.set(p.merchant_id, (skuCount.get(p.merchant_id) ?? 0) + 1);
  }
  const cashback = new Map<string, number>();
  for (const r of rules ?? []) {
    cashback.set(r.merchant_id, r.flat_cents ?? 0);
  }

  return merchants.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    verified: m.is_verified,
    category: m.category,
    skuCount: skuCount.get(m.id) ?? 0,
    cashbackCents: cashback.get(m.id) ?? 0,
  }));
}

export async function fetchMyMerchantIds(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("merchant_members")
    .select("merchant_id")
    .eq("profile_id", user.id);

  return (data ?? []).map((r) => r.merchant_id);
}

export async function claimMerchant(merchantId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.rpc("claim_merchant", { p_merchant_id: merchantId });
  return error ? { error: error.message } : {};
}

export async function loadMerchantPrices(merchantId: string): Promise<ManagedPrice[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("merchant_prices")
    .select("id, product_id, price_cents, products(name, brand), merchant_locations(name)")
    .eq("merchant_id", merchantId)
    .order("observed_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const productRaw = row.products as unknown;
    const locationRaw = row.merchant_locations as unknown;
    const product = (Array.isArray(productRaw) ? productRaw[0] : productRaw) as {
      name: string;
      brand: string | null;
    } | null;
    const location = (Array.isArray(locationRaw) ? locationRaw[0] : locationRaw) as {
      name: string;
    } | null;
    return {
      id: row.id,
      productId: row.product_id,
      productName: product?.name ?? "Product",
      brand: product?.brand ?? null,
      priceCents: row.price_cents,
      locationName: location?.name ?? null,
    };
  });
}

export async function updateMerchantPrice(
  priceId: string,
  priceCents: number,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.rpc("update_merchant_price", {
    p_price_id: priceId,
    p_price_cents: priceCents,
  });
  return error ? { error: error.message } : {};
}

export type MerchantCashbackRule = {
  id: string | null;
  title: string;
  flatCents: number;
  minBasketCents: number;
  isActive: boolean;
};

export async function loadCashbackRule(merchantId: string): Promise<MerchantCashbackRule> {
  const empty: MerchantCashbackRule = {
    id: null,
    title: "Basket cashback",
    flatCents: 0,
    minBasketCents: 200000,
    isActive: true,
  };
  const supabase = getSupabase();
  if (!supabase) return empty;

  const { data } = await supabase
    .from("cashback_rules")
    .select("id, title, flat_cents, min_basket_cents, is_active")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return empty;
  return {
    id: data.id,
    title: data.title,
    flatCents: data.flat_cents ?? 0,
    minBasketCents: data.min_basket_cents ?? 0,
    isActive: data.is_active,
  };
}

export async function saveCashbackRule(
  merchantId: string,
  rule: MerchantCashbackRule,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };
  if (rule.flatCents < 0 || rule.minBasketCents < 0) {
    return { error: "Cashback amounts must be zero or positive." };
  }

  const payload = {
    merchant_id: merchantId,
    title: rule.title.trim() || "Basket cashback",
    flat_cents: rule.flatCents,
    min_basket_cents: rule.minBasketCents,
    percent: null,
    is_active: rule.isActive,
  };

  if (rule.id) {
    const { error } = await supabase.from("cashback_rules").update(payload).eq("id", rule.id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("cashback_rules")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: error.message };
    rule.id = data.id;
  }

  if (rule.isActive && rule.id) {
    await supabase
      .from("cashback_rules")
      .update({ is_active: false })
      .eq("merchant_id", merchantId)
      .neq("id", rule.id);
  }

  return {};
}
