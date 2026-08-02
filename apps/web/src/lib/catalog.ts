import { getSupabase } from "./supabase";
import type {
  CashbackRule,
  Catalog,
  FuelStation,
  FuelType,
  Merchant,
  MerchantPrice,
  Product,
} from "./types";

const fallbackCatalog: Catalog = {
  source: "fallback",
  merchants: [
    {
      id: "m-naivas",
      name: "Naivas",
      slug: "naivas",
      category: "grocery",
      location: {
        id: "loc-naivas",
        merchantId: "m-naivas",
        name: "Naivas Westlands",
        address: "Waiyaki Way, Westlands",
        lat: -1.2671,
        lng: 36.811,
        city: "Nairobi",
      },
    },
    {
      id: "m-quickmart",
      name: "Quickmart",
      slug: "quickmart",
      category: "grocery",
      location: {
        id: "loc-qm",
        merchantId: "m-quickmart",
        name: "Quickmart Kilimani",
        address: "Argwings Kodhek Rd",
        lat: -1.2921,
        lng: 36.785,
        city: "Nairobi",
      },
    },
    {
      id: "m-carrefour",
      name: "Carrefour",
      slug: "carrefour",
      category: "grocery",
      location: {
        id: "loc-carrefour",
        merchantId: "m-carrefour",
        name: "Carrefour The Hub",
        address: "The Hub Karen",
        lat: -1.319,
        lng: 36.712,
        city: "Nairobi",
      },
    },
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

  const [merchantsRes, productsRes, pricesRes, rulesRes, locationsRes] = await Promise.all([
    supabase.from("merchants").select("id, name, slug, category").eq("category", "grocery"),
    supabase.from("products").select("id, name, brand, category, unit").order("name"),
    supabase
      .from("merchant_prices")
      .select("merchant_id, product_id, price_cents, observed_at, source"),
    supabase
      .from("cashback_rules")
      .select("merchant_id, flat_cents, min_basket_cents")
      .eq("is_active", true),
    supabase
      .from("merchant_locations")
      .select("id, merchant_id, name, address, lat, lng, city")
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

  const locationByMerchant = new Map<string, Merchant["location"]>();
  for (const row of locationsRes.data ?? []) {
    if (locationByMerchant.has(row.merchant_id)) continue;
    locationByMerchant.set(row.merchant_id, {
      id: row.id,
      merchantId: row.merchant_id,
      name: row.name,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      city: row.city,
    });
  }

  const merchants: Merchant[] = merchantsRes.data.map((m) => ({
    ...m,
    location: locationByMerchant.get(m.id) ?? null,
  }));
  const products: Product[] = productsRes.data ?? [];
  const prices: MerchantPrice[] = (pricesRes.data ?? []).map((row) => ({
    merchantId: row.merchant_id,
    productId: row.product_id,
    priceCents: row.price_cents,
    observedAt: (row as { observed_at?: string | null }).observed_at ?? null,
    source: (row as { source?: string | null }).source ?? null,
  }));
  const cashbackRules: CashbackRule[] = (rulesRes.data ?? []).map((row) => ({
    merchantId: row.merchant_id,
    flatCents: row.flat_cents ?? 0,
    minBasketCents: row.min_basket_cents ?? 0,
  }));

  return { merchants, products, prices, cashbackRules, source: "supabase" };
}

export async function loadFuelStations(
  fuelType: FuelType = "petrol",
): Promise<{ stations: FuelStation[]; source: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return loadFuelStationsFallback(fuelType);
  }

  const { data, error } = await supabase
    .from("fuel_stations")
    .select("id, name, brand, lat, lng, address, fuel_prices(price_cents_per_litre, fuel_type, observed_at, source)")
    .eq("is_active", true);

  if (error || !data?.length) {
    return loadFuelStationsFallback(fuelType);
  }

  const stations = data
    .map((s) => {
      const prices =
        ((s.fuel_prices as {
          price_cents_per_litre: number;
          fuel_type: string;
          observed_at?: string;
          source?: string;
        }[] | null) ?? [])
          .slice()
          .sort((a, b) => String(b.observed_at ?? "").localeCompare(String(a.observed_at ?? "")));
      const match =
        prices.find((p) => p.fuel_type === fuelType) ??
        (fuelType === "petrol" ? prices.find((p) => p.fuel_type === "petrol") : null);
      if (!match) return null;
      const lat = typeof s.lat === "number" ? s.lat : null;
      const lng = typeof s.lng === "number" ? s.lng : null;
      const station: FuelStation = {
        id: s.id,
        name: s.name,
        brand: s.brand ?? s.name,
        fuelType,
        priceCentsPerLitre: match.price_cents_per_litre,
        cashbackCents: fuelType === "diesel" ? 1200 : 1500,
        distanceKm: null,
        lat,
        lng,
        mapsUrl:
          lat != null && lng != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            : s.address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name}, ${s.address}, Nairobi`)}`
              : null,
        observedAt: match.observed_at ?? null,
        source: match.source ?? null,
      };
      return station;
    })
    .filter((s): s is FuelStation => s !== null)
    .sort((a, b) => a.priceCentsPerLitre - b.priceCentsPerLitre);

  if (!stations.length) {
    return loadFuelStationsFallback(fuelType);
  }

  return { stations, source: "supabase" };
}

function loadFuelStationsFallback(fuelType: FuelType = "petrol") {
  const now = new Date().toISOString();
  const petrolSeed: {
    id: string;
    name: string;
    brand: string;
    price: number;
    diesel: number;
    lat: number;
    lng: number;
    cashback: number;
  }[] = [
    {
      id: "fallback-total-kilimani",
      name: "Total Kilimani",
      brand: "TotalEnergies",
      price: 17900,
      diesel: 16650,
      lat: -1.29,
      lng: 36.788,
      cashback: 1500,
    },
    {
      id: "fallback-rubis-westlands",
      name: "Rubis Westlands",
      brand: "Rubis",
      price: 18000,
      diesel: 16800,
      lat: -1.265,
      lng: 36.804,
      cashback: 1000,
    },
    {
      id: "fallback-shell-junction",
      name: "Shell Junction",
      brand: "Shell",
      price: 18300,
      diesel: 17100,
      lat: -1.3,
      lng: 36.78,
      cashback: 1200,
    },
    {
      id: "fallback-rubis-abc",
      name: "Rubis ABC Place",
      brand: "Rubis",
      price: 18100,
      diesel: 16900,
      lat: -1.2608,
      lng: 36.7925,
      cashback: 1000,
    },
    {
      id: "fallback-shell-sarit",
      name: "Shell Sarit",
      brand: "Shell",
      price: 18250,
      diesel: 17050,
      lat: -1.2615,
      lng: 36.8028,
      cashback: 1200,
    },
    {
      id: "fallback-total-westlands",
      name: "Total Westlands",
      brand: "TotalEnergies",
      price: 18050,
      diesel: 16850,
      lat: -1.2682,
      lng: 36.8075,
      cashback: 1500,
    },
    {
      id: "fallback-shell-yaya",
      name: "Shell Yaya",
      brand: "Shell",
      price: 18200,
      diesel: 17000,
      lat: -1.2928,
      lng: 36.7885,
      cashback: 1200,
    },
    {
      id: "fallback-rubis-cbd",
      name: "Rubis CBD",
      brand: "Rubis",
      price: 18400,
      diesel: 17200,
      lat: -1.2868,
      lng: 36.8255,
      cashback: 1000,
    },
    {
      id: "fallback-total-eastleigh",
      name: "Total Eastleigh",
      brand: "TotalEnergies",
      price: 17980,
      diesel: 16720,
      lat: -1.2755,
      lng: 36.8485,
      cashback: 1500,
    },
    {
      id: "fallback-shell-embakasi",
      name: "Shell Embakasi",
      brand: "Shell",
      price: 18120,
      diesel: 16880,
      lat: -1.318,
      lng: 36.895,
      cashback: 1200,
    },
  ];

  const stations: FuelStation[] = petrolSeed
    .map((s) => ({
      id: s.id,
      name: s.name,
      brand: s.brand,
      fuelType,
      priceCentsPerLitre: fuelType === "diesel" ? s.diesel : s.price,
      cashbackCents: fuelType === "diesel" ? Math.min(s.cashback, 1200) : s.cashback,
      distanceKm: null,
      lat: s.lat,
      lng: s.lng,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`,
      observedAt: now,
      source: "fallback",
    }))
    .sort((a, b) => a.priceCentsPerLitre - b.priceCentsPerLitre);

  return { source: "fallback" as const, stations };
}
