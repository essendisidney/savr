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

export async function createMerchant(params: {
  name: string;
  branchName?: string;
  address?: string;
  city?: string;
}): Promise<{ merchantId: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };
  const { data, error } = await supabase.rpc("create_merchant", {
    p_name: params.name,
    p_branch_name: params.branchName?.trim() || null,
    p_address: params.address?.trim() || null,
    p_city: params.city?.trim() || "Nairobi",
  });
  if (error) return { error: error.message };
  return { merchantId: data as string };
}

export async function addMerchantPrice(params: {
  merchantId: string;
  productId: string;
  priceCents: number;
}): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.rpc("add_merchant_price", {
    p_merchant_id: params.merchantId,
    p_product_id: params.productId,
    p_price_cents: params.priceCents,
  });
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

export type MerchantPromotion = {
  id: string;
  title: string;
  description: string | null;
  discountPercent: number | null;
  flatCents: number | null;
  category: string | null;
  productId: string | null;
  productName: string | null;
  endsAt: string | null;
  isActive: boolean;
};

export async function loadPromotions(merchantId: string): Promise<MerchantPromotion[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("promotions")
    .select(
      "id, title, description, discount_percent, flat_cents, category, product_id, ends_at, is_active, products(name)",
    )
    .eq("merchant_id", merchantId)
    .order("starts_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const productRaw = row.products as unknown;
    const product = (Array.isArray(productRaw) ? productRaw[0] : productRaw) as {
      name: string;
    } | null;
    const description = row.description ?? null;
    let flatCents =
      row.flat_cents != null && Number.isFinite(Number(row.flat_cents))
        ? Number(row.flat_cents)
        : null;
    let category =
      typeof row.category === "string" && row.category.trim() ? row.category.trim() : null;
    if (flatCents == null && description) {
      const flatMatch = description.match(/Flat\s+(\d+)\s*KES\s*off/i);
      if (flatMatch) flatCents = Number(flatMatch[1]) * 100;
    }
    if (!category && description) {
      const catMatch = description.match(/Category:\s*([^·]+)/i);
      if (catMatch) category = catMatch[1].trim();
    }
    return {
      id: row.id,
      title: row.title,
      description,
      discountPercent: row.discount_percent != null ? Number(row.discount_percent) : null,
      flatCents,
      category,
      productId: row.product_id ?? null,
      productName: product?.name ?? null,
      endsAt: row.ends_at ?? null,
      isActive: row.is_active,
    };
  });
}

export async function createPromotion(params: {
  merchantId: string;
  title: string;
  discountPercent?: number | null;
  flatCents?: number | null;
  productId?: string | null;
  category?: string | null;
  endsAt?: string | null;
}): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const title = params.title.trim();
  if (!title) return { error: "Promotion title is required." };

  const percent =
    params.discountPercent != null && Number.isFinite(params.discountPercent)
      ? Math.min(100, Math.max(0, params.discountPercent))
      : null;
  const flat =
    params.flatCents != null && Number.isFinite(params.flatCents) && params.flatCents > 0
      ? Math.round(params.flatCents)
      : null;

  if (percent == null && flat == null) {
    return { error: "Set a % discount or a flat KES amount." };
  }

  const notes: string[] = [];
  if (flat != null) notes.push(`Flat ${Math.round(flat / 100)} KES off`);
  if (params.category?.trim()) notes.push(`Category: ${params.category.trim()}`);

  const { error } = await supabase.from("promotions").insert({
    merchant_id: params.merchantId,
    title,
    description: notes.length ? notes.join(" · ") : null,
    discount_percent: percent,
    flat_cents: flat,
    category: params.category?.trim() || null,
    product_id: params.productId || null,
    ends_at: params.endsAt || null,
    is_active: true,
  });

  return error ? { error: error.message } : {};
}

export async function deactivatePromotion(promoId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("promotions")
    .update({ is_active: false })
    .eq("id", promoId);
  return error ? { error: error.message } : {};
}

export type MerchantAnalytics = {
  impressions: number;
  recommended: number;
  chosen: number;
  listInclusions: number;
  avgBasketCents: number;
  winRate: number;
  topProducts: { productName: string; brand: string | null; inclusions: number }[];
};

export async function loadMerchantAnalytics(
  merchantId: string,
): Promise<MerchantAnalytics | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const { data, error } = await supabase.rpc("merchant_analytics", {
    p_merchant_id: merchantId,
  });
  if (error) return { error: error.message };

  const row = (data ?? {}) as Record<string, unknown>;
  const topRaw = (row.top_products as Record<string, unknown>[] | null) ?? [];

  return {
    impressions: Number(row.impressions) || 0,
    recommended: Number(row.recommended) || 0,
    chosen: Number(row.chosen) || 0,
    listInclusions: Number(row.list_inclusions) || 0,
    avgBasketCents: Number(row.avg_basket_cents) || 0,
    winRate: Number(row.win_rate) || 0,
    topProducts: topRaw.map((t) => ({
      productName: String(t.product_name ?? "Product"),
      brand: (t.brand as string | null) ?? null,
      inclusions: Number(t.inclusions) || 0,
    })),
  };
}
