import { getSupabase } from "./supabase";
import type {
  CashbackRule,
  Catalog,
  FuelStation,
  Merchant,
  MerchantPrice,
  Product,
} from "./types";

const fallbackCatalog: Catalog = {
  source: "fallback",
  merchants: [
    { id: "m-naivas", name: "Naivas", slug: "naivas", category: "grocery" },
    { id: "m-quickmart", name: "Quickmart", slug: "quickmart", category: "grocery" },
    { id: "m-carrefour", name: "Carrefour", slug: "carrefour", category: "grocery" },
  ],
  products: [
    { id: "p-milk", name: "Fresh Milk 500ml", brand: "Brookside", category: "dairy", unit: "piece" },
    { id: "p-bread", name: "White Bread 400g", brand: "Super Loaf", category: "bakery", unit: "piece" },
    { id: "p-rice", name: "Basmati Rice 2kg", brand: "Pishori", category: "staples", unit: "piece" },
    { id: "p-sugar", name: "Sugar 1kg", brand: "Mumias", category: "staples", unit: "piece" },
    { id: "p-soap", name: "Bar Soap 800g", brand: "Geisha", category: "household", unit: "piece" },
    { id: "p-oil", name: "Cooking Oil 2L", brand: "Rina", category: "staples", unit: "piece" },
  ],
  prices: [
    { merchantId: "m-naivas", productId: "p-milk", priceCents: 7500 },
    { merchantId: "m-naivas", productId: "p-bread", priceCents: 7000 },
    { merchantId: "m-naivas", productId: "p-rice", priceCents: 145000 },
    { merchantId: "m-naivas", productId: "p-sugar", priceCents: 18000 },
    { merchantId: "m-naivas", productId: "p-soap", priceCents: 22000 },
    { merchantId: "m-naivas", productId: "p-oil", priceCents: 159000 },
    { merchantId: "m-quickmart", productId: "p-milk", priceCents: 7200 },
    { merchantId: "m-quickmart", productId: "p-bread", priceCents: 6800 },
    { merchantId: "m-quickmart", productId: "p-rice", priceCents: 138000 },
    { merchantId: "m-quickmart", productId: "p-sugar", priceCents: 17500 },
    { merchantId: "m-quickmart", productId: "p-soap", priceCents: 21000 },
    { merchantId: "m-quickmart", productId: "p-oil", priceCents: 148500 },
    { merchantId: "m-carrefour", productId: "p-milk", priceCents: 7000 },
    { merchantId: "m-carrefour", productId: "p-bread", priceCents: 6500 },
    { merchantId: "m-carrefour", productId: "p-rice", priceCents: 135000 },
    { merchantId: "m-carrefour", productId: "p-sugar", priceCents: 17000 },
    { merchantId: "m-carrefour", productId: "p-soap", priceCents: 20500 },
    { merchantId: "m-carrefour", productId: "p-oil", priceCents: 144000 },
  ],
  cashbackRules: [
    { merchantId: "m-naivas", flatCents: 2000, minBasketCents: 200000 },
    { merchantId: "m-quickmart", flatCents: 3000, minBasketCents: 200000 },
    { merchantId: "m-carrefour", flatCents: 4500, minBasketCents: 200000 },
  ],
};

export async function loadCatalog(): Promise<Catalog> {
  const supabase = getSupabase();
  if (!supabase) return fallbackCatalog;

  const [merchantsRes, productsRes, pricesRes, rulesRes] = await Promise.all([
    supabase.from("merchants").select("id, name, slug, category").eq("category", "grocery"),
    supabase.from("products").select("id, name, brand, category, unit").order("name"),
    supabase.from("merchant_prices").select("merchant_id, product_id, price_cents"),
    supabase
      .from("cashback_rules")
      .select("merchant_id, flat_cents, min_basket_cents")
      .eq("is_active", true),
  ]);

  if (merchantsRes.error || productsRes.error || pricesRes.error || !merchantsRes.data?.length) {
    console.warn("Catalog load failed, using fallback", {
      merchants: merchantsRes.error,
      products: productsRes.error,
      prices: pricesRes.error,
    });
    return fallbackCatalog;
  }

  const merchants: Merchant[] = merchantsRes.data;
  const products: Product[] = productsRes.data ?? [];
  const prices: MerchantPrice[] = (pricesRes.data ?? []).map((row) => ({
    merchantId: row.merchant_id,
    productId: row.product_id,
    priceCents: row.price_cents,
  }));
  const cashbackRules: CashbackRule[] = (rulesRes.data ?? []).map((row) => ({
    merchantId: row.merchant_id,
    flatCents: row.flat_cents ?? 0,
    minBasketCents: row.min_basket_cents ?? 0,
  }));

  return { merchants, products, prices, cashbackRules, source: "supabase" };
}

export async function loadFuelStations(): Promise<{ stations: FuelStation[]; source: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      source: "fallback",
      stations: [
        { name: "Total Kilimani", brand: "TotalEnergies", priceCentsPerLitre: 17900, cashbackCents: 1500, distanceKm: 1.2 },
        { name: "Rubis Westlands", brand: "Rubis", priceCentsPerLitre: 18000, cashbackCents: 1000, distanceKm: 0.8 },
        { name: "Shell Junction", brand: "Shell", priceCentsPerLitre: 18300, cashbackCents: 1200, distanceKm: 2.1 },
      ],
    };
  }

  const { data, error } = await supabase
    .from("fuel_stations")
    .select("name, brand, fuel_prices(price_cents_per_litre, fuel_type, observed_at)")
    .eq("is_active", true);

  if (error || !data?.length) {
    return loadFuelStationsFallback();
  }

  const stations = data
    .map((s) => {
      const prices = (s.fuel_prices as { price_cents_per_litre: number; fuel_type: string }[] | null) ?? [];
      const petrol = prices.find((p) => p.fuel_type === "petrol") ?? prices[0];
      if (!petrol) return null;
      const station: FuelStation = {
        name: s.name,
        brand: s.brand ?? s.name,
        priceCentsPerLitre: petrol.price_cents_per_litre,
        cashbackCents: 1500,
        distanceKm: null,
      };
      return station;
    })
    .filter((s): s is FuelStation => s !== null)
    .sort((a, b) => a.priceCentsPerLitre - b.priceCentsPerLitre);

  return { stations, source: "supabase" };
}

function loadFuelStationsFallback() {
  return {
    source: "fallback" as const,
    stations: [
      { name: "Total Kilimani", brand: "TotalEnergies", priceCentsPerLitre: 17900, cashbackCents: 1500, distanceKm: 1.2 },
      { name: "Rubis Westlands", brand: "Rubis", priceCentsPerLitre: 18000, cashbackCents: 1000, distanceKm: 0.8 },
      { name: "Shell Junction", brand: "Shell", priceCentsPerLitre: 18300, cashbackCents: 1200, distanceKm: 2.1 },
    ],
  };
}
