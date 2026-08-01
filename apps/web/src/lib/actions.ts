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

export async function loadWallet(): Promise<{
  balanceCents: number;
  ledger: { note: string | null; amountCents: number; when: string }[];
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) return { balanceCents: 0, ledger: [], error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { balanceCents: 0, ledger: [], error: "signed_out" };

  const { data: account } = await supabase
    .from("wallet_accounts")
    .select("id, cashback_cents")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!account) return { balanceCents: 0, ledger: [] };

  const { data: entries } = await supabase
    .from("wallet_ledger")
    .select("amount_cents, note, created_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    balanceCents: account.cashback_cents,
    ledger: (entries ?? []).map((e) => ({
      note: e.note,
      amountCents: e.amount_cents,
      when: new Date(e.created_at).toLocaleDateString("en-KE", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    })),
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
