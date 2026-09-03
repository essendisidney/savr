"use server";

import { getSupabase } from "./supabase";
import { createAdminClient } from "./supabase-admin";
import {
  BOOST_DAYS,
  DEMO_LISTINGS,
  feeCentsFor,
  searchDemoListings,
  type DealStatus,
  type MarketplaceDeal,
  type MarketplaceListing,
} from "./marketplace";
import { initiateB2C, initiateStkPush, mpesaIsDryRun } from "./mpesa";
import { isValidKeMobile } from "./phone";

/** Privileged writes for escrow + listing status (buyer cannot update seller’s listing via RLS). */
function adminDb() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  price_cents: number;
  status: string;
  city: string;
  created_at: string;
  boosted_until?: string | null;
  listing_images?: { public_url: string; sort_order: number }[] | null;
};

async function enrichListings(
  rows: ListingRow[],
): Promise<MarketplaceListing[]> {
  const supabase = getSupabase();
  const sellerIds = [...new Set(rows.map((r) => r.seller_id))];
  const nameById = new Map<string, string | null>();
  const verified = new Set<string>();
  const ratingSum = new Map<string, { sum: number; count: number }>();

  if (supabase && sellerIds.length) {
    const [{ data: profiles }, { data: verifs }, { data: ratingRows }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", sellerIds),
      supabase
        .from("seller_verifications")
        .select("profile_id, id_status")
        .in("profile_id", sellerIds),
      supabase.from("ratings").select("to_id, stars").in("to_id", sellerIds),
    ]);
    for (const p of profiles ?? []) nameById.set(p.id, p.full_name);
    for (const v of verifs ?? []) {
      if (v.id_status === "verified") verified.add(v.profile_id);
    }
    for (const r of ratingRows ?? []) {
      const cur = ratingSum.get(r.to_id) ?? { sum: 0, count: 0 };
      cur.sum += r.stars;
      cur.count += 1;
      ratingSum.set(r.to_id, cur);
    }
  }

  return rows.map((row) => {
    const images = [...(row.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const stats = ratingSum.get(row.seller_id);
    return {
      id: row.id,
      sellerId: row.seller_id,
      sellerName: nameById.get(row.seller_id) ?? null,
      title: row.title,
      priceCents: row.price_cents,
      status: row.status as MarketplaceListing["status"],
      city: row.city,
      imageUrl: images[0]?.public_url ?? null,
      verified: verified.has(row.seller_id),
      boostedUntil: row.boosted_until ?? null,
      avgStars: stats && stats.count > 0 ? Math.round((stats.sum / stats.count) * 10) / 10 : null,
      ratingCount: stats?.count ?? 0,
      createdAt: row.created_at,
    };
  });
}

function sortBoostedFirst(rows: MarketplaceListing[]): MarketplaceListing[] {
  const now = Date.now();
  return [...rows].sort((a, b) => {
    const aBoost = a.boostedUntil && new Date(a.boostedUntil).getTime() > now ? 1 : 0;
    const bBoost = b.boostedUntil && new Date(b.boostedUntil).getTime() > now ? 1 : 0;
    if (aBoost !== bBoost) return bBoost - aBoost;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

const LISTING_SELECT =
  "id, seller_id, title, price_cents, status, city, created_at, boosted_until, listing_images(public_url, sort_order)";

export async function loadLiveListings(limit = 40): Promise<MarketplaceListing[]> {
  const supabase = getSupabase();
  if (!supabase) return sortBoostedFirst(DEMO_LISTINGS).slice(0, limit);

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit, 48));

  if (error || !data?.length) return sortBoostedFirst(DEMO_LISTINGS).slice(0, limit);
  return sortBoostedFirst(await enrichListings(data as ListingRow[])).slice(0, limit);
}

export async function searchListings(q: string): Promise<MarketplaceListing[]> {
  const supabase = getSupabase();
  const needle = q.trim();
  if (!supabase) return sortBoostedFirst(searchDemoListings(needle));

  let query = supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(48);

  if (needle) query = query.ilike("title", `%${needle}%`);

  const { data, error } = await query;
  if (error || !data?.length) return sortBoostedFirst(searchDemoListings(needle));
  return sortBoostedFirst(await enrichListings(data as ListingRow[]));
}

export async function loadListing(id: string): Promise<MarketplaceListing | null> {
  const demo = DEMO_LISTINGS.find((l) => l.id === id);
  const supabase = getSupabase();
  if (!supabase) return demo ?? null;

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return demo ?? null;
  const [row] = await enrichListings([data as ListingRow]);
  return row ?? null;
}

export async function createListing(params: {
  title: string;
  priceKes: number;
  city?: string;
  imagePath?: string | null;
  imageUrl?: string | null;
}): Promise<{ id: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: "Connect Supabase to post live listings. Demo board is read-only." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to sell" };

  const title = params.title.trim().slice(0, 120);
  const priceCents = Math.round(params.priceKes * 100);
  if (title.length < 2) return { error: "Add a short title" };
  if (!Number.isFinite(priceCents) || priceCents < 100) return { error: "Enter a price in KES" };
  if (!params.imageUrl) return { error: "Add one photo" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.phone || !isValidKeMobile(profile.phone)) {
    return {
      error: "Add a valid M-Pesa phone on your profile before posting (You → Profile).",
    };
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title,
      price_cents: priceCents,
      status: "live",
      city: (params.city ?? "Nairobi").trim() || "Nairobi",
    })
    .select("id")
    .single();

  if (error || !listing) return { error: error?.message ?? "Could not create listing" };

  const { error: imgErr } = await supabase.from("listing_images").insert({
    listing_id: listing.id,
    storage_path: params.imagePath ?? params.imageUrl,
    public_url: params.imageUrl,
    sort_order: 0,
  });
  if (imgErr) return { error: imgErr.message };

  return { id: listing.id };
}

export async function loadMyListings(): Promise<MarketplaceListing[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return enrichListings((data ?? []) as ListingRow[]);
}

export async function startDeal(listingId: string): Promise<{ dealId: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Connect Supabase to buy with escrow" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to buy" };

  const listing = await loadListing(listingId);
  if (!listing || listing.status !== "live") return { error: "Listing not available" };
  if (listing.sellerId === user.id) return { error: "You can’t buy your own listing" };
  if (listing.id.startsWith("demo-")) {
    return { error: "Demo listing — post a real item or connect Supabase to buy" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  const fee = feeCentsFor(listing.priceCents);
  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.sellerId,
      price_cents: listing.priceCents,
      fee_cents: fee,
      status: "pending_pay",
      buyer_phone: profile?.phone ?? null,
    })
    .select("id")
    .single();

  if (error || !deal) return { error: error?.message ?? "Could not start deal" };

  const admin = adminDb() ?? supabase;
  await admin.from("listings").update({ status: "reserved" }).eq("id", listing.id);
  await admin.from("escrow_events").insert({
    deal_id: deal.id,
    status: "pending_pay",
    note: "Deal opened — waiting for M-Pesa",
    dry_run: mpesaIsDryRun(),
  });

  return { dealId: deal.id };
}

export async function cancelDeal(
  dealId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in" };

  const { data: deal } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
  if (!deal) return { error: "Deal not found" };
  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    return { error: "Deal not found" };
  }
  if (deal.status !== "pending_pay") {
    return { error: "Only unpaid deals can be cancelled" };
  }

  const admin = adminDb() ?? supabase;
  await admin
    .from("deals")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", dealId);

  const { data: open } = await admin
    .from("deals")
    .select("id")
    .eq("listing_id", deal.listing_id)
    .in("status", ["pending_pay", "in_escrow"])
    .limit(1);

  if (!open?.length) {
    await admin.from("listings").update({ status: "live" }).eq("id", deal.listing_id);
  }

  await admin.from("escrow_events").insert({
    deal_id: dealId,
    status: "cancelled",
    note: "Deal cancelled — listing restored if no other open deal",
    dry_run: mpesaIsDryRun(),
  });

  return { ok: true };
}

export async function boostListing(
  listingId: string,
): Promise<{ ok: true; dryRun: boolean; boostedUntil: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in" };

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing || listing.seller_id !== user.id) return { error: "Listing not found" };
  if (listing.status !== "live" && listing.status !== "reserved") {
    return { error: "Only active listings can be boosted" };
  }

  const until = new Date(Date.now() + BOOST_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const dryRun = mpesaIsDryRun();
  const { error } = await supabase
    .from("listings")
    .update({ boosted_until: until, updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) return { error: error.message };
  return { ok: true, dryRun, boostedUntil: until };
}

export async function loadDeal(dealId: string): Promise<MarketplaceDeal | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("deals")
    .select(
      "id, listing_id, buyer_id, seller_id, price_cents, fee_cents, status, created_at, listings(title, listing_images(public_url, sort_order))",
    )
    .eq("id", dealId)
    .maybeSingle();

  if (!data) return null;
  const listingRaw = data.listings as unknown;
  const listing = (Array.isArray(listingRaw) ? listingRaw[0] : listingRaw) as
    | { title: string; listing_images?: { public_url: string; sort_order: number }[] }
    | null
    | undefined;
  const images = [...(listing?.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: data.id,
    listingId: data.listing_id,
    listingTitle: listing?.title ?? "Listing",
    buyerId: data.buyer_id,
    sellerId: data.seller_id,
    priceCents: data.price_cents,
    feeCents: data.fee_cents,
    status: data.status as DealStatus,
    createdAt: data.created_at,
    imageUrl: images[0]?.public_url ?? null,
  };
}

export async function loadMyDeals(): Promise<MarketplaceDeal[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("deals")
    .select(
      "id, listing_id, buyer_id, seller_id, price_cents, fee_cents, status, created_at, listings(title, listing_images(public_url, sort_order))",
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(40);

  return (data ?? []).map((row) => {
    const listingRaw = row.listings as unknown;
    const listing = (Array.isArray(listingRaw) ? listingRaw[0] : listingRaw) as
      | { title: string; listing_images?: { public_url: string; sort_order: number }[] }
      | null
      | undefined;
    const images = [...(listing?.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: row.id,
      listingId: row.listing_id,
      listingTitle: listing?.title ?? "Listing",
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      priceCents: row.price_cents,
      feeCents: row.fee_cents,
      status: row.status as DealStatus,
      createdAt: row.created_at,
      imageUrl: images[0]?.public_url ?? null,
    };
  });
}

export async function payDealWithMpesa(
  dealId: string,
  phone: string,
): Promise<{ ok: true; dryRun: boolean } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in" };

  const { data: deal } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
  if (!deal || deal.buyer_id !== user.id) return { error: "Deal not found" };
  if (deal.status !== "pending_pay") return { error: "Deal is not awaiting payment" };

  const amountKes = Math.round(deal.price_cents / 100);
  try {
    const stk = await initiateStkPush({
      amountKes,
      phone,
      accountReference: dealId.slice(0, 12),
      transactionDesc: "Savr escrow",
    });

    const admin = adminDb() ?? supabase;
    await admin
      .from("deals")
      .update({
        status: "in_escrow",
        buyer_phone: phone,
        stk_checkout_id: stk.checkoutRequestId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);

    await admin.from("escrow_events").insert({
      deal_id: dealId,
      status: "in_escrow",
      note: stk.dryRun
        ? "Dry-run STK — money treated as held (no live M-Pesa)"
        : "STK accepted — funds in escrow",
      mpesa_ref: stk.checkoutRequestId,
      dry_run: stk.dryRun,
    });

    return { ok: true, dryRun: stk.dryRun };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "M-Pesa failed" };
  }
}

export async function confirmDealReceived(
  dealId: string,
): Promise<{ ok: true; dryRun: boolean } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in" };

  const { data: deal } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
  if (!deal || deal.buyer_id !== user.id) return { error: "Only the buyer can confirm" };
  if (deal.status !== "in_escrow") return { error: "Deal is not in escrow" };

  const { data: seller } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", deal.seller_id)
    .maybeSingle();

  const payoutPhone = deal.seller_phone || seller?.phone;
  if (!payoutPhone) {
    return {
      error:
        "Seller needs a valid M-Pesa phone on their profile before payout. Ask them to update You → Profile, or report a problem.",
    };
  }

  const payoutKes = Math.round((deal.price_cents - deal.fee_cents) / 100);
  try {
    const b2c = await initiateB2C({
      amountKes: payoutKes,
      phone: payoutPhone,
      occasion: "SavrSale",
      remarks: `Savr escrow release ${dealId.slice(0, 8)}`,
      originatorConversationId: `savr-${dealId.slice(0, 20)}`,
    });

    const admin = adminDb() ?? supabase;
    await admin
      .from("deals")
      .update({
        status: "released",
        b2c_conversation_id: b2c.conversationId,
        seller_phone: payoutPhone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);

    await admin.from("listings").update({ status: "sold" }).eq("id", deal.listing_id);
    await admin.from("escrow_events").insert({
      deal_id: dealId,
      status: "released",
      note: b2c.dryRun
        ? `Dry-run payout KES ${payoutKes} to seller (fee kept)`
        : `Released KES ${payoutKes} to seller`,
      mpesa_ref: b2c.conversationId,
      dry_run: b2c.dryRun,
    });

    return { ok: true, dryRun: b2c.dryRun };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Payout failed" };
  }
}

export async function reportDealProblem(dealId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in" };

  const { data: deal } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return { error: "Deal not found" };
  }
  if (deal.status !== "in_escrow") return { error: "Only escrow deals can be reported" };

  const who = deal.buyer_id === user.id ? "buyer" : "seller";
  await (adminDb() ?? supabase).from("escrow_events").insert({
    deal_id: dealId,
    status: "dispute",
    note: `Problem reported by ${who} — funds still held. Either party can refund to restore the listing.`,
    dry_run: mpesaIsDryRun(),
  });
  return { ok: true };
}

export async function refundDeal(
  dealId: string,
): Promise<{ ok: true; dryRun: boolean } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in" };

  const { data: deal } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return { error: "Deal not found" };
  }
  if (deal.status !== "in_escrow") return { error: "Only escrow deals can be refunded" };

  const admin = adminDb() ?? supabase;
  const dryRun = mpesaIsDryRun();
  await admin
    .from("deals")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("id", dealId);

  const { data: open } = await admin
    .from("deals")
    .select("id")
    .eq("listing_id", deal.listing_id)
    .in("status", ["pending_pay", "in_escrow"])
    .limit(1);

  if (!open?.length) {
    await admin.from("listings").update({ status: "live" }).eq("id", deal.listing_id);
  }

  await admin.from("escrow_events").insert({
    deal_id: dealId,
    status: "refunded",
    note: dryRun
      ? "Dry-run refund — escrow marked refunded, listing restored"
      : "Escrow refunded to buyer path — listing restored",
    dry_run: dryRun,
  });

  return { ok: true, dryRun };
}

/** Cancel unpaid deals older than maxAgeMinutes; restore listings. */
export async function expireStalePendingDeals(
  maxAgeMinutes = 60,
): Promise<{ expired: number }> {
  const admin = adminDb();
  if (!admin) return { expired: 0 };

  const cutoff = new Date(Date.now() - maxAgeMinutes * 60_000).toISOString();
  const { data: stale } = await admin
    .from("deals")
    .select("id, listing_id")
    .eq("status", "pending_pay")
    .lt("created_at", cutoff)
    .limit(100);

  if (!stale?.length) return { expired: 0 };

  let expired = 0;
  for (const deal of stale) {
    await admin
      .from("deals")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", deal.id);

    const { data: open } = await admin
      .from("deals")
      .select("id")
      .eq("listing_id", deal.listing_id)
      .in("status", ["pending_pay", "in_escrow"])
      .limit(1);

    if (!open?.length) {
      await admin.from("listings").update({ status: "live" }).eq("id", deal.listing_id);
    }

    await admin.from("escrow_events").insert({
      deal_id: deal.id,
      status: "cancelled",
      note: `Auto-expired after ${maxAgeMinutes}m unpaid`,
      dry_run: mpesaIsDryRun(),
    });
    expired += 1;
  }

  return { expired };
}

export async function loadMyRatingForDeal(
  dealId: string,
): Promise<{ stars: number } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("ratings")
    .select("stars")
    .eq("deal_id", dealId)
    .eq("from_id", user.id)
    .maybeSingle();

  return data ? { stars: data.stars } : null;
}

export async function loadEscrowEvents(dealId: string): Promise<
  { id: string; status: string; note: string | null; dryRun: boolean; createdAt: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("escrow_events")
    .select("id, status, note, dry_run, created_at")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((e) => ({
    id: e.id,
    status: e.status,
    note: e.note,
    dryRun: e.dry_run,
    createdAt: e.created_at,
  }));
}

export async function dealHasDispute(dealId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from("escrow_events")
    .select("id")
    .eq("deal_id", dealId)
    .eq("status", "dispute")
    .limit(1);
  return Boolean(data?.length);
}

export async function rateDeal(params: {
  dealId: string;
  toId: string;
  stars: number;
  note?: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in" };

  const stars = Math.min(5, Math.max(1, Math.round(params.stars)));
  const { error } = await supabase.from("ratings").insert({
    deal_id: params.dealId,
    from_id: user.id,
    to_id: params.toId,
    stars,
    note: params.note?.trim().slice(0, 280) || null,
  });
  if (error) {
    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      return { error: "You already rated this deal" };
    }
    return { error: error.message };
  }
  return { ok: true };
}

export async function requestVerification(params?: {
  idNote?: string;
}): Promise<{ ok: true; dryRun: boolean } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase required" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in" };

  const note = [
    `Week-2 stub: KES ${100} verify fee (dry-run — no charge yet)`,
    params?.idNote?.trim() ? `ID note: ${params.idNote.trim().slice(0, 200)}` : "ID upload placeholder — pending ops review",
  ].join(" · ");

  const { error } = await supabase.from("seller_verifications").upsert({
    profile_id: user.id,
    id_status: "pending",
    note,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  return { ok: true, dryRun: mpesaIsDryRun() };
}

export async function loadVerificationStatus(): Promise<"none" | "pending" | "verified" | "rejected"> {
  const supabase = getSupabase();
  if (!supabase) return "none";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "none";
  const { data } = await supabase
    .from("seller_verifications")
    .select("id_status")
    .eq("profile_id", user.id)
    .maybeSingle();
  return (data?.id_status as "none" | "pending" | "verified" | "rejected") ?? "none";
}
