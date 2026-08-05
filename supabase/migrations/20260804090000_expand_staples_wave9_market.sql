-- Wave 9: market-density Nairobi weekly shop (~60 SKUs × 10 grocery locs).
-- Honesty: source=seed + fixed seed clock — never pretend it was walked today.

insert into public.products (id, name, brand, category, unit) values
  ('33333333-3333-3333-3333-333333333211', 'Rice Bran Oil 2L', 'Rina', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333212', 'Sunflower Oil 2L', 'Rina', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333213', 'Brown Sugar 1kg', 'Mumias', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333214', 'Icing Sugar 500g', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333215', 'Honey 500g', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333216', 'Peanut Butter Crunchy 400g', 'Tropical Heat', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333217', 'Tomato Sauce 700g', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333218', 'Mayonnaise 400g', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333219', 'Chilli Sauce 250ml', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333220', 'Vinegar 500ml', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333221', 'Basmati Rice 5kg', 'Pishori', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333222', 'Maize Flour 5kg', 'Jogoo', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333223', 'Wheat Flour 5kg', 'Exe', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333224', 'Oats 500g', 'Quaker', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333225', 'Biscuits Assorted 200g', 'Local', 'snacks', 'piece'),
  ('33333333-3333-3333-3333-333333333226', 'Digestive Biscuits 400g', 'McVitie''s', 'snacks', 'piece'),
  ('33333333-3333-3333-3333-333333333227', 'Crisps 150g', 'Tropical Heat', 'snacks', 'piece'),
  ('33333333-3333-3333-3333-333333333228', 'Nuts Mixed 200g', 'Tropical Heat', 'snacks', 'piece'),
  ('33333333-3333-3333-3333-333333333229', 'Chocolate Drink 400g', 'Cadbury', 'beverages', 'piece'),
  ('33333333-3333-3333-3333-333333333230', 'Coffee Instant 100g', 'Nescafe', 'beverages', 'piece'),
  ('33333333-3333-3333-3333-333333333231', 'Green Tea 25s', 'Kericho Gold', 'beverages', 'piece'),
  ('33333333-3333-3333-3333-333333333232', 'Juice Mango 1L', 'Afia', 'beverages', 'piece'),
  ('33333333-3333-3333-3333-333333333233', 'Soda Can 6-pack', 'Coca-Cola', 'beverages', 'piece'),
  ('33333333-3333-3333-3333-333333333234', 'Yoghurt Drink 250ml', 'Fresha', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333235', 'Mozzarella 200g', 'Happy Cow', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333236', 'Paneer 200g', 'Local', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333237', 'Eggs Tray 12', 'Kienyeji', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333238', 'Chicken Wings 1kg', 'Farmers Choice', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333239', 'Beef Stewing 1kg', 'Local', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333240', 'Pork Chops 500g', 'Farmers Choice', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333241', 'Fish Fillet 500g', 'Local', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333242', 'Prawns 500g', 'Local', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333243', 'Avocado Each', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333244', 'Mango Each', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333245', 'Pineapple Whole', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333246', 'Cabbage Head', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333247', 'Carrots 1kg', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333248', 'Sweet Potatoes 1kg', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333249', 'Lemons 1kg', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333250', 'Oranges 1kg', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333251', 'Coriander Bundle', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333252', 'Dhania Bundle', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333253', 'Dishwashing Liquid 750ml', 'Sunlight', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333254', 'Hand Wash 500ml', 'Dettol', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333255', 'Floor Cleaner 1L', 'Mr Muscle', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333256', 'Bleach 1L', 'Jik', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333257', 'Scouring Powder 500g', 'Vim', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333258', 'Aluminium Foil', 'Local', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333259', 'Cling Film', 'Local', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333260', 'Baby Diapers M 36s', 'Huggies', 'baby', 'piece'),
  ('33333333-3333-3333-3333-333333333261', 'Baby Wipes 80s', 'Huggies', 'baby', 'piece'),
  ('33333333-3333-3333-3333-333333333262', 'Baby Lotion 200ml', 'Johnson''s', 'baby', 'piece'),
  ('33333333-3333-3333-3333-333333333263', 'Sanitary Pads Night 8s', 'Always', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333264', 'Cotton Wool 100g', 'Local', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333265', 'Face Wash 100ml', 'Nivea', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333266', 'Razors 5s', 'Gillette', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333267', 'Paracetamol 20s', 'Local', 'pharmacy', 'piece'),
  ('33333333-3333-3333-3333-333333333268', 'ORS Sachets 10s', 'Local', 'pharmacy', 'piece'),
  ('33333333-3333-3333-3333-333333333269', 'Petroleum Jelly 100g', 'Vaseline', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333270', 'Shoe Polish Black', 'Kiwi', 'household', 'piece')
on conflict (id) do nothing;

with bases(product_id, base_cents) as (
  values
    ('33333333-3333-3333-3333-333333333211'::uuid, 42000),
    ('33333333-3333-3333-3333-333333333212'::uuid, 45000),
    ('33333333-3333-3333-3333-333333333213'::uuid, 19500),
    ('33333333-3333-3333-3333-333333333214'::uuid, 14000),
    ('33333333-3333-3333-3333-333333333215'::uuid, 48000),
    ('33333333-3333-3333-3333-333333333216'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333217'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333218'::uuid, 32000),
    ('33333333-3333-3333-3333-333333333219'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333220'::uuid, 9000),
    ('33333333-3333-3333-3333-333333333221'::uuid, 145000),
    ('33333333-3333-3333-3333-333333333222'::uuid, 52000),
    ('33333333-3333-3333-3333-333333333223'::uuid, 58000),
    ('33333333-3333-3333-3333-333333333224'::uuid, 42000),
    ('33333333-3333-3333-3333-333333333225'::uuid, 12000),
    ('33333333-3333-3333-3333-333333333226'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333227'::uuid, 16000),
    ('33333333-3333-3333-3333-333333333228'::uuid, 35000),
    ('33333333-3333-3333-3333-333333333229'::uuid, 48000),
    ('33333333-3333-3333-3333-333333333230'::uuid, 52000),
    ('33333333-3333-3333-3333-333333333231'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333232'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333233'::uuid, 42000),
    ('33333333-3333-3333-3333-333333333234'::uuid, 7000),
    ('33333333-3333-3333-3333-333333333235'::uuid, 42000),
    ('33333333-3333-3333-3333-333333333236'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333237'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333238'::uuid, 52000),
    ('33333333-3333-3333-3333-333333333239'::uuid, 68000),
    ('33333333-3333-3333-3333-333333333240'::uuid, 48000),
    ('33333333-3333-3333-3333-333333333241'::uuid, 45000),
    ('33333333-3333-3333-3333-333333333242'::uuid, 98000),
    ('33333333-3333-3333-3333-333333333243'::uuid, 5000),
    ('33333333-3333-3333-3333-333333333244'::uuid, 4000),
    ('33333333-3333-3333-3333-333333333245'::uuid, 15000),
    ('33333333-3333-3333-3333-333333333246'::uuid, 6000),
    ('33333333-3333-3333-3333-333333333247'::uuid, 9000),
    ('33333333-3333-3333-3333-333333333248'::uuid, 11000),
    ('33333333-3333-3333-3333-333333333249'::uuid, 10000),
    ('33333333-3333-3333-3333-333333333250'::uuid, 12000),
    ('33333333-3333-3333-3333-333333333251'::uuid, 3000),
    ('33333333-3333-3333-3333-333333333252'::uuid, 3000),
    ('33333333-3333-3333-3333-333333333253'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333254'::uuid, 32000),
    ('33333333-3333-3333-3333-333333333255'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333256'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333257'::uuid, 12000),
    ('33333333-3333-3333-3333-333333333258'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333259'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333260'::uuid, 145000),
    ('33333333-3333-3333-3333-333333333261'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333262'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333263'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333264'::uuid, 9000),
    ('33333333-3333-3333-3333-333333333265'::uuid, 42000),
    ('33333333-3333-3333-3333-333333333266'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333267'::uuid, 8000),
    ('33333333-3333-3333-3333-333333333268'::uuid, 15000),
    ('33333333-3333-3333-3333-333333333269'::uuid, 16000),
    ('33333333-3333-3333-3333-333333333270'::uuid, 14000)
), primary_locs(merchant_id, location_id, mult) as (
  values
    ('11111111-1111-1111-1111-111111111101'::uuid, '22222222-2222-2222-2222-222222222101'::uuid, 1.03),
    ('11111111-1111-1111-1111-111111111102'::uuid, '22222222-2222-2222-2222-222222222102'::uuid, 0.995),
    ('11111111-1111-1111-1111-111111111103'::uuid, '22222222-2222-2222-2222-222222222103'::uuid, 0.97),
    ('11111111-1111-1111-1111-111111111104'::uuid, '22222222-2222-2222-2222-222222222104'::uuid, 0.985),
    ('11111111-1111-1111-1111-111111111105'::uuid, '22222222-2222-2222-2222-222222222105'::uuid, 1.02)
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
  timestamptz '2026-07-01 00:00:00+00',
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
  timestamptz '2026-07-01 00:00:00+00',
  null,
  null
from public.merchant_prices mp
join (
  values
    ('22222222-2222-2222-2222-222222222106'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 1.015::numeric),
    ('22222222-2222-2222-2222-222222222107'::uuid, '11111111-1111-1111-1111-111111111102'::uuid, 0.99::numeric),
    ('22222222-2222-2222-2222-222222222108'::uuid, '11111111-1111-1111-1111-111111111103'::uuid, 1.01::numeric),
    ('22222222-2222-2222-2222-222222222109'::uuid, '11111111-1111-1111-1111-111111111104'::uuid, 0.995::numeric),
    ('22222222-2222-2222-2222-222222222110'::uuid, '11111111-1111-1111-1111-111111111105'::uuid, 1.025::numeric)
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
