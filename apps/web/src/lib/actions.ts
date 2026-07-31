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
