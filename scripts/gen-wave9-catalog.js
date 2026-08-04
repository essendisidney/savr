/**
 * Wave 9 — bigger Nairobi weekly-shop catalog (~60 SKUs × 10 grocery locs).
 * Honesty: source=seed, observed_at LEFT NULL (never bump clocks to now()).
 *
 * Usage: node scripts/gen-wave9-catalog.js
 */
const fs = require("fs");
const path = require("path");

const products = [
  ["211", "Rice Bran Oil 2L", "Rina", "staples", 420],
  ["212", "Sunflower Oil 2L", "Rina", "staples", 450],
  ["213", "Brown Sugar 1kg", "Mumias", "staples", 195],
  ["214", "Icing Sugar 500g", "Local", "staples", 140],
  ["215", "Honey 500g", "Local", "staples", 480],
  ["216", "Peanut Butter Crunchy 400g", "Tropical Heat", "staples", 380],
  ["217", "Tomato Sauce 700g", "Local", "staples", 220],
  ["218", "Mayonnaise 400g", "Local", "staples", 320],
  ["219", "Chilli Sauce 250ml", "Local", "staples", 180],
  ["220", "Vinegar 500ml", "Local", "staples", 90],
  ["221", "Basmati Rice 5kg", "Pishori", "staples", 1450],
  ["222", "Maize Flour 5kg", "Jogoo", "staples", 520],
  ["223", "Wheat Flour 5kg", "Exe", "staples", 580],
  ["224", "Oats 500g", "Quaker", "staples", 420],
  ["225", "Biscuits Assorted 200g", "Local", "snacks", 120],
  ["226", "Digestive Biscuits 400g", "McVitie's", "snacks", 280],
  ["227", "Crisps 150g", "Tropical Heat", "snacks", 160],
  ["228", "Nuts Mixed 200g", "Tropical Heat", "snacks", 350],
  ["229", "Chocolate Drink 400g", "Cadbury", "beverages", 480],
  ["230", "Coffee Instant 100g", "Nescafe", "beverages", 520],
  ["231", "Green Tea 25s", "Kericho Gold", "beverages", 220],
  ["232", "Juice Mango 1L", "Afia", "beverages", 180],
  ["233", "Soda Can 6-pack", "Coca-Cola", "beverages", 420],
  ["234", "Yoghurt Drink 250ml", "Fresha", "dairy", 70],
  ["235", "Mozzarella 200g", "Happy Cow", "dairy", 420],
  ["236", "Paneer 200g", "Local", "dairy", 380],
  ["237", "Eggs Tray 12", "Kienyeji", "protein", 220],
  ["238", "Chicken Wings 1kg", "Farmers Choice", "protein", 520],
  ["239", "Beef Stewing 1kg", "Local", "protein", 680],
  ["240", "Pork Chops 500g", "Farmers Choice", "protein", 480],
  ["241", "Fish Fillet 500g", "Local", "protein", 450],
  ["242", "Prawns 500g", "Local", "protein", 980],
  ["243", "Avocado Each", "Local", "produce", 50],
  ["244", "Mango Each", "Local", "produce", 40],
  ["245", "Pineapple Whole", "Local", "produce", 150],
  ["246", "Cabbage Head", "Local", "produce", 60],
  ["247", "Carrots 1kg", "Local", "produce", 90],
  ["248", "Sweet Potatoes 1kg", "Local", "produce", 110],
  ["249", "Lemons 1kg", "Local", "produce", 100],
  ["250", "Oranges 1kg", "Local", "produce", 120],
  ["251", "Coriander Bundle", "Local", "produce", 30],
  ["252", "Dhania Bundle", "Local", "produce", 30],
  ["253", "Dishwashing Liquid 750ml", "Sunlight", "household", 280],
  ["254", "Hand Wash 500ml", "Dettol", "household", 320],
  ["255", "Floor Cleaner 1L", "Mr Muscle", "household", 380],
  ["256", "Bleach 1L", "Jik", "household", 180],
  ["257", "Scouring Powder 500g", "Vim", "household", 120],
  ["258", "Aluminium Foil", "Local", "household", 220],
  ["259", "Cling Film", "Local", "household", 180],
  ["260", "Baby Diapers M 36s", "Huggies", "baby", 1450],
  ["261", "Baby Wipes 80s", "Huggies", "baby", 280],
  ["262", "Baby Lotion 200ml", "Johnson's", "baby", 380],
  ["263", "Sanitary Pads Night 8s", "Always", "personal_care", 220],
  ["264", "Cotton Wool 100g", "Local", "personal_care", 90],
  ["265", "Face Wash 100ml", "Nivea", "personal_care", 420],
  ["266", "Razors 5s", "Gillette", "personal_care", 380],
  ["267", "Paracetamol 20s", "Local", "pharmacy", 80],
  ["268", "ORS Sachets 10s", "Local", "pharmacy", 150],
  ["269", "Petroleum Jelly 100g", "Vaseline", "personal_care", 160],
  ["270", "Shoe Polish Black", "Kiwi", "household", 140],
];

const primary = [
  ["11111111-1111-1111-1111-111111111101", "22222222-2222-2222-2222-222222222101", 1.03],
  ["11111111-1111-1111-1111-111111111102", "22222222-2222-2222-2222-222222222102", 0.995],
  ["11111111-1111-1111-1111-111111111103", "22222222-2222-2222-2222-222222222103", 0.97],
  ["11111111-1111-1111-1111-111111111104", "22222222-2222-2222-2222-222222222104", 0.985],
  ["11111111-1111-1111-1111-111111111105", "22222222-2222-2222-2222-222222222105", 1.02],
];

const seconds = [
  ["22222222-2222-2222-2222-222222222106", "11111111-1111-1111-1111-111111111101", 1.015],
  ["22222222-2222-2222-2222-222222222107", "11111111-1111-1111-1111-111111111102", 0.99],
  ["22222222-2222-2222-2222-222222222108", "11111111-1111-1111-1111-111111111103", 1.01],
  ["22222222-2222-2222-2222-222222222109", "11111111-1111-1111-1111-111111111104", 0.995],
  ["22222222-2222-2222-2222-222222222110", "11111111-1111-1111-1111-111111111105", 1.025],
];

let out = `-- Wave 9: market-density Nairobi weekly shop (~${products.length} SKUs × 10 grocery locs).
-- Honesty: source=seed, observed_at NULL — never pretend seed was walked today.

insert into public.products (id, name, brand, category, unit) values
`;

out += products
  .map(
    ([n, name, brand, cat]) =>
      `  ('33333333-3333-3333-3333-333333333${n}', '${name.replace(/'/g, "''")}', '${brand.replace(/'/g, "''")}', '${cat}', 'piece')`,
  )
  .join(",\n");
out += "\non conflict (id) do nothing;\n\n";

out += `with bases(product_id, base_cents) as (
  values
${products
  .map(([n, , , , kes]) => `    ('33333333-3333-3333-3333-333333333${n}'::uuid, ${kes * 100})`)
  .join(",\n")}
), primary_locs(merchant_id, location_id, mult) as (
  values
${primary
  .map(([m, l, mult]) => `    ('${m}'::uuid, '${l}'::uuid, ${mult})`)
  .join(",\n")}
)
insert into public.merchant_prices (
  merchant_id, location_id, product_id, price_cents, source, observed_at, prev_price_cents, prev_observed_at
)
select
  m.merchant_id,
  m.location_id,
  b.product_id,
  greatest(100, round(b.base_cents * m.mult / 100) * 100)::int,
  'seed',
  null,
  null,
  null
from bases b
cross join primary_locs m
on conflict (merchant_id, location_id, product_id) do nothing;

-- Mirror onto second branches
insert into public.merchant_prices (
  merchant_id, location_id, product_id, price_cents, source, observed_at, prev_price_cents, prev_observed_at
)
select
  mp.merchant_id,
  loc.id,
  mp.product_id,
  greatest(100, round(mp.price_cents * mult.factor / 100) * 100)::int,
  'seed',
  null,
  null,
  null
from public.merchant_prices mp
join (
  values
${seconds
  .map(([l, m, f]) => `    ('${l}'::uuid, '${m}'::uuid, ${f}::numeric)`)
  .join(",\n")}
) as mult(location_id, merchant_id, factor)
  on mp.merchant_id = mult.merchant_id
join public.merchant_locations loc on loc.id = mult.location_id
where mp.product_id >= '33333333-3333-3333-3333-333333333211'
  and mp.product_id <= '33333333-3333-3333-3333-333333333270'
  and mp.location_id = (
    select l2.id
    from public.merchant_locations l2
    where l2.merchant_id = mp.merchant_id
    order by l2.created_at asc
    limit 1
  )
on conflict (merchant_id, location_id, product_id) do nothing;
`;

const dest = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20260804090000_expand_staples_wave9_market.sql",
);
fs.writeFileSync(dest, out);
console.log(`Wrote ${dest} (${products.length} SKUs × 10 locs, honesty-safe seed)`);
