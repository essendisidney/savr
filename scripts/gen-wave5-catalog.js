const fs = require("fs");

const products = [
  ["091", "Sukuma Wiki Bundle", "Local", "produce"],
  ["092", "Cabbage Head", "Local", "produce"],
  ["093", "Carrots 1kg", "Local", "produce"],
  ["094", "Irish Potatoes 2kg", "Local", "produce"],
  ["095", "Sweet Potatoes 1kg", "Local", "produce"],
  ["096", "Garlic 250g", "Local", "produce"],
  ["097", "Ginger 250g", "Local", "produce"],
  ["098", "Lemons 1kg", "Local", "produce"],
  ["099", "Oranges 1kg", "Local", "produce"],
  ["100", "Watermelon Slice", "Local", "produce"],
  ["101", "Beef Mince 500g", "Farmers Choice", "protein"],
  ["102", "Beef Stewing 1kg", "Local", "protein"],
  ["103", "Pork Chops 500g", "Farmers Choice", "protein"],
  ["104", "Sausages 400g", "Farmers Choice", "protein"],
  ["105", "Fish Fillet 500g", "Local", "protein"],
  ["106", "Tilapia Whole", "Local", "protein"],
  ["107", "UHT Milk 500ml", "Brookside", "dairy"],
  ["108", "Cream 250ml", "Brookside", "dairy"],
  ["109", "Gouda Cheese 200g", "Happy Cow", "dairy"],
  ["110", "Maize Flour 5kg", "Jogoo", "staples"],
  ["111", "Wheat Flour 2kg", "Exe", "staples"],
  ["112", "Spaghetti 500g", "Indomie", "staples"],
  ["113", "Tomato Paste 400g", "Gino", "staples"],
  ["114", "Baked Beans 420g", "Heinz", "staples"],
  ["115", "Vegetable Oil 1L", "Rina", "staples"],
  ["116", "Black Tea 500g", "Kericho Gold", "beverages"],
  ["117", "Drinking Chocolate 400g", "Cadbury", "beverages"],
  ["118", "Energy Drink 500ml", "Predator", "beverages"],
  ["119", "Bottled Water 1.5L", "Dasani", "beverages"],
  ["120", "Hand Wash 500ml", "Dettol", "household"],
  ["121", "Floor Cleaner 1L", "Mr Muscle", "household"],
  ["122", "Kitchen Towels 2s", "Rosy", "household"],
  ["123", "Bin Liners 20s", "Local", "household"],
  ["124", "Shampoo 400ml", "Pantene", "personal_care"],
  ["125", "Bar Soap 3-pack", "Lux", "personal_care"],
  ["126", "Deodorant 150ml", "Nivea", "personal_care"],
  ["127", "Baby Wipes 80s", "Huggies", "baby"],
  ["128", "Cornflakes 500g", "Kellogg's", "snacks"],
  ["129", "Chocolate Bar 80g", "Cadbury", "snacks"],
  ["130", "Popcorn Kernels 500g", "Tropical Heat", "snacks"],
];

// KES base shelf prices (will * 100 for cents)
const base = [
  40, 55, 90, 140, 110, 80, 70, 100, 120, 150, 380, 520, 420, 280, 450, 350, 85, 160, 340, 380, 210,
  95, 95, 180, 290, 320, 380, 150, 70, 220, 280, 160, 90, 450, 180, 320, 280, 420, 120, 160,
];

const merchants = [
  ["11111111-1111-1111-1111-111111111101", "22222222-2222-2222-2222-222222222101", 1.08],
  ["11111111-1111-1111-1111-111111111102", "22222222-2222-2222-2222-222222222102", 1.04],
  ["11111111-1111-1111-1111-111111111103", "22222222-2222-2222-2222-222222222103", 1.0],
];

let out = "-- Wave 5 Nairobi staples — produce, protein, staples, household\n\n";
out += "insert into public.products (id, name, brand, category, unit) values\n";
out += products
  .map(
    ([n, name, brand, cat]) =>
      `  ('33333333-3333-3333-3333-333333333${n}', '${name.replace(/'/g, "''")}', '${brand.replace(/'/g, "''")}', '${cat}', 'piece')`,
  )
  .join(",\n");
out += "\non conflict (id) do nothing;\n\n";
out +=
  "insert into public.merchant_prices (merchant_id, location_id, product_id, price_cents, source, observed_at) values\n";

const rows = [];
for (const [mid, lid, mult] of merchants) {
  products.forEach(([n], i) => {
    const cents = Math.round(base[i] * mult) * 100;
    rows.push(
      `  ('${mid}', '${lid}', '33333333-3333-3333-3333-333333333${n}', ${cents}, 'seed', now())`,
    );
  });
}
out += rows.join(",\n");
out += "\non conflict (merchant_id, location_id, product_id) do nothing;\n\n";
out += `-- Keep seed freshness current\n`;
out += `update public.merchant_prices\nset observed_at = now()\nwhere source = 'seed'\n  and observed_at < now() - interval '2 days';\n\n`;
out += `update public.fuel_prices\nset observed_at = now()\nwhere source = 'seed'\n  and observed_at < now() - interval '2 days';\n`;

const path = "d:/savr/supabase/migrations/20260802270000_expand_staples_wave5.sql";
fs.writeFileSync(path, out);
console.log("wrote", products.length, "products ->", path);
