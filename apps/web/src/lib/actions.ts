import { getSupabase } from "./supabase";
import type { BasketResult, ListItem } from "./types";

export async function confirmBasketChoice(params: {
  items: ListItem[];
  results: BasketResult[];
  chosenMerchantId: string;
  recommendedMerchantId: string;
  savingsCents: number;
  cashbackCents: number;
}): Promise<{ compareId: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Sign in to earn savings cashback." };

  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({ owner_id: user.id, name: "Basket compare" })
    .select("id")
    .single();
  if (listError || !list) return { error: listError?.message ?? "Could not create list." };

  const listRows = params.items.map((item) => ({
    list_id: list.id,
    product_id: item.productId,
    free_text: item.freeText,
    quantity: item.quantity,
  }));
  const { error: itemsError } = await supabase.from("list_items").insert(listRows);
  if (itemsError) return { error: itemsError.message };

  const baseline = Math.max(...params.results.map((r) => r.totalCents));
  const { data: compare, error: compareError } = await supabase
    .from("basket_compares")
    .insert({
      list_id: list.id,
      user_id: user.id,
      city: "Nairobi",
      recommended_merchant_id: params.recommendedMerchantId,
      chosen_merchant_id: params.chosenMerchantId,
      baseline_total_cents: baseline,
      savings_cents: params.savingsCents,
      cashback_cents: params.cashbackCents,
    })
    .select("id")
    .single();
  if (compareError || !compare) return { error: compareError?.message ?? "Could not save compare." };

  const resultRows = params.results.map((r) => ({
    compare_id: compare.id,
    merchant_id: r.merchantId,
    total_cents: r.totalCents,
    coverage_ratio: r.coverage,
    cashback_cents: r.cashbackCents,
    is_recommended: r.isRecommended,
  }));
  const { error: resultsError } = await supabase.from("basket_compare_results").insert(resultRows);
  if (resultsError) return { error: resultsError.message };

  if (params.cashbackCents > 0) {
    const { error: creditError } = await supabase.rpc("credit_cashback", {
      p_profile_id: user.id,
      p_amount_cents: params.cashbackCents,
      p_reference_type: "basket_compare",
      p_reference_id: compare.id,
      p_note: "Savings cashback for choosing the smarter basket",
    });
    if (creditError) return { error: creditError.message };
  }

  return { compareId: compare.id };
}

export type CompareHistoryItem = {
  id: string;
  when: string;
  savingsCents: number;
  cashbackCents: number;
  chosenMerchant: string;
  recommendedMerchant: string;
  followedAdvice: boolean;
};

export async function loadWallet(): Promise<{
  balanceCents: number;
  lifetimeSavingsCents: number;
  compareCount: number;
  history: CompareHistoryItem[];
  ledger: { note: string | null; amountCents: number; when: string }[];
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      balanceCents: 0,
      lifetimeSavingsCents: 0,
      compareCount: 0,
      history: [],
      ledger: [],
      error: "Supabase is not configured.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      balanceCents: 0,
      lifetimeSavingsCents: 0,
      compareCount: 0,
      history: [],
      ledger: [],
      error: "signed_out",
    };
  }

  const [accountRes, comparesRes] = await Promise.all([
    supabase
      .from("wallet_accounts")
      .select("id, cashback_cents")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("basket_compares")
      .select(
        "id, savings_cents, cashback_cents, created_at, chosen_merchant_id, recommended_merchant_id, chosen:merchants!chosen_merchant_id(name), recommended:merchants!recommended_merchant_id(name)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const account = accountRes.data;
  const compares = comparesRes.data ?? [];

  const lifetimeSavingsCents = compares.reduce(
    (sum, row) => sum + (row.savings_cents ?? 0),
    0,
  );

  const history: CompareHistoryItem[] = compares.map((row) => {
    const chosen = row.chosen as { name: string } | { name: string }[] | null;
    const recommended = row.recommended as { name: string } | { name: string }[] | null;
    const chosenName = Array.isArray(chosen) ? chosen[0]?.name : chosen?.name;
    const recommendedName = Array.isArray(recommended)
      ? recommended[0]?.name
      : recommended?.name;
    return {
      id: row.id,
      when: new Date(row.created_at).toLocaleDateString("en-KE", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      savingsCents: row.savings_cents ?? 0,
      cashbackCents: row.cashback_cents ?? 0,
      chosenMerchant: chosenName ?? "Store",
      recommendedMerchant: recommendedName ?? "Store",
      followedAdvice: row.chosen_merchant_id === row.recommended_merchant_id,
    };
  });

  let ledger: { note: string | null; amountCents: number; when: string }[] = [];
  if (account) {
    const { data: entries } = await supabase
      .from("wallet_ledger")
      .select("amount_cents, note, created_at")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(20);

    ledger = (entries ?? []).map((e) => ({
      note: e.note,
      amountCents: e.amount_cents,
      when: new Date(e.created_at).toLocaleDateString("en-KE", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    }));
  }

  return {
    balanceCents: account?.cashback_cents ?? 0,
    lifetimeSavingsCents,
    compareCount: compares.length,
    history,
    ledger,
  };
}

export type SavedListSummary = {
  id: string;
  name: string;
  updatedAt: string;
  itemCount: number;
};

export async function saveShoppingList(params: {
  name: string;
  items: ListItem[];
}): Promise<{ listId: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };
  if (!params.items.length) return { error: "Add items before saving." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save lists." };

  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({
      owner_id: user.id,
      name: params.name.trim() || "My list",
    })
    .select("id")
    .single();
  if (listError || !list) return { error: listError?.message ?? "Could not save list." };

  const rows = params.items.map((item) => ({
    list_id: list.id,
    product_id: item.productId,
    free_text: item.freeText,
    quantity: item.quantity,
  }));
  const { error: itemsError } = await supabase.from("list_items").insert(rows);
  if (itemsError) return { error: itemsError.message };

  return { listId: list.id };
}

export async function fetchSavedLists(): Promise<{
  lists: SavedListSummary[];
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) return { lists: [], error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { lists: [], error: "signed_out" };

  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id, name, updated_at, list_items(count)")
    .eq("owner_id", user.id)
    .neq("name", "Basket compare")
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error) return { lists: [], error: error.message };

  const lists: SavedListSummary[] = (data ?? []).map((row) => {
    const countRaw = row.list_items as { count: number }[] | null;
    return {
      id: row.id,
      name: row.name,
      updatedAt: new Date(row.updated_at).toLocaleDateString("en-KE", {
        month: "short",
        day: "numeric",
      }),
      itemCount: countRaw?.[0]?.count ?? 0,
    };
  });

  return { lists };
}

export async function loadSavedList(
  listId: string,
): Promise<{ items: ListItem[]; name: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to load lists." };

  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .select("id, name")
    .eq("id", listId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (listError || !list) return { error: listError?.message ?? "List not found." };

  const { data: rows, error: itemsError } = await supabase
    .from("list_items")
    .select("product_id, free_text, quantity")
    .eq("list_id", listId);
  if (itemsError) return { error: itemsError.message };

  return {
    name: list.name,
    items: (rows ?? [])
      .filter((r) => r.product_id)
      .map((r) => ({
        productId: r.product_id as string,
        freeText: r.free_text,
        quantity: Number(r.quantity) || 1,
      })),
  };
}

export type UserProfile = {
  fullName: string;
  phone: string;
  city: string;
  preferredMerchantIds: string[];
};

export async function loadProfile(): Promise<UserProfile | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signed_out" };

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, city, preferred_merchant_ids")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { error: error.message };

  return {
    fullName: data?.full_name ?? user.user_metadata?.full_name ?? "",
    phone: data?.phone ?? "",
    city: data?.city ?? "Nairobi",
    preferredMerchantIds: data?.preferred_merchant_ids ?? [],
  };
}

export async function saveProfile(profile: UserProfile): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update your profile." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: profile.fullName.trim() || null,
      phone: profile.phone.trim() || null,
      city: profile.city.trim() || "Nairobi",
      preferred_merchant_ids: profile.preferredMerchantIds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return error ? { error: error.message } : {};
}
