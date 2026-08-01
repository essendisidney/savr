const fs = require("fs");

const products = [
  ["016", "Butter 500g", "Brookside", "dairy"],
  ["017", "Cheddar Cheese 200g", "Brookside", "dairy"],
  ["018", "Fresh Milk 1L", "Brookside", "dairy"],
  ["019", "Brown Bread 400g", "Super Loaf", "bakery"],
  ["020", "Mandazi Mix 1kg", "Prestige", "bakery"],
  ["021", "Pishori Rice 5kg", "Pishori", "staples"],
  ["022", "Red Beans 1kg", "Wairimu", "staples"],
  ["023", "Green Grams 1kg", "Ndengu", "staples"],
  ["024", "Table Salt 1kg", "Kensalt", "staples"],
  ["025", "Margarine 500g", "Blue Band", "staples"],
  ["026", "Ground Coffee 100g", "Dormans", "beverages"],
  ["027", "Cocoa 400g", "Cadbury", "beverages"],
  ["028", "Soda 2L", "Coca-Cola", "beverages"],
  ["029", "Mango Juice 1L", "Afia", "beverages"],
  ["030", "Laundry Detergent 1kg", "Omo", "household"],
  ["031", "Dishwashing Liquid 750ml", "Sunlight", "household"],
  ["032", "Toothpaste 100ml", "Colgate", "personal_care"],
  ["033", "Body Lotion 400ml", "Nivea", "personal_care"],
  ["034", "Sanitary Pads 10s", "Always", "personal_care"],
  ["035", "Diapers Pack Medium", "Huggies", "baby"],
  ["036", "Digestive Biscuits 200g", "McVities", "snacks"],
  ["037", "Potato Crisps 150g", "Krackles", "snacks"],
  ["038", "Instant Noodles 5-pack", "Indomie", "staples"],
  ["039", "Peanut Butter 400g", "Tropical Heat", "staples"],
  ["040", "Natural Honey 500g", "Honey Care", "staples"],
  ["041", "Bananas 1kg", "Local", "produce"],
  ["042", "Tomatoes 1kg", "Local", "produce"],
  ["043", "Onions 1kg", "Local", "produce"],
  ["044", "Potatoes 2kg", "Local", "produce"],
  ["045", "Chicken Pieces 1kg", "Farmers Choice", "protein"],
];

const base = [
  280, 190, 125, 75, 180, 980, 160, 170, 40, 210, 450, 380, 220, 190, 320, 185, 145, 420, 180, 950,
  160, 120, 145, 280, 520, 95, 120, 80, 140, 480,
];

const merchants = [
  ["11111111-1111-1111-1111-111111111101", "22222222-2222-2222-2222-222222222101", 1.08],
  ["11111111-1111-1111-1111-111111111102", "22222222-2222-2222-2222-222222222102", 1.04],
  ["11111111-1111-1111-1111-111111111103", "22222222-2222-2222-2222-222222222103", 1.0],
];

let out = "-- Wave 2 Nairobi staples for richer basket/price compare\n";
out += "insert into public.products (id, name, brand, category, unit) values\n";
out += products
  .map(
    ([n, name, brand, cat]) =>
      `  ('33333333-3333-3333-3333-333333333${n}', '${name}', '${brand}', '${cat}', 'piece')`,
  )
  .join(",\n");
out += "\non conflict (id) do nothing;\n\n";
out +=
  "insert into public.merchant_prices (merchant_id, location_id, product_id, price_cents, source) values\n";

const rows = [];
for (const [mid, lid, mult] of merchants) {
  products.forEach(([n], i) => {
    const cents = Math.round(base[i] * mult) * 100;
    rows.push(
      `  ('${mid}', '${lid}', '33333333-3333-3333-3333-333333333${n}', ${cents}, 'seed')`,
    );
  });
}
out += rows.join(",\n");
out += "\non conflict (merchant_id, location_id, product_id) do nothing;\n";

fs.writeFileSync(
  "d:/savr/supabase/migrations/20260801140000_expand_staples_wave2.sql",
  out,
);
console.log("wrote", products.length, "products");
