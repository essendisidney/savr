-- Wave 6: denser catalog + Chandarana & Eastmatt
-- Applied remotely in parts; this file is the full reproducible seed.

insert into public.merchants (id, name, slug, category, is_verified) values
  ('11111111-1111-1111-1111-111111111104', 'Chandarana', 'chandarana', 'grocery', true),
  ('11111111-1111-1111-1111-111111111105', 'Eastmatt', 'eastmatt', 'grocery', true)
on conflict (id) do nothing;

insert into public.merchant_locations (id, merchant_id, name, address, lat, lng, city) values
  ('22222222-2222-2222-2222-222222222104', '11111111-1111-1111-1111-111111111104', 'Chandarana Yaya', 'Yaya Centre, Argwings Kodhek', -1.2928, 36.7875, 'Nairobi'),
  ('22222222-2222-2222-2222-222222222105', '11111111-1111-1111-1111-111111111105', 'Eastmatt South B', 'Mombasa Road / South B', -1.3165, 36.8370, 'Nairobi')
on conflict (id) do nothing;

insert into public.cashback_rules (merchant_id, title, flat_cents, min_basket_cents, is_active)
select * from (values
  ('11111111-1111-1111-1111-111111111104'::uuid, 'Grocery cashback', 3500, 200000, true),
  ('11111111-1111-1111-1111-111111111105'::uuid, 'Grocery cashback', 2500, 200000, true)
) as v(merchant_id, title, flat_cents, min_basket_cents, is_active)
where not exists (select 1 from public.cashback_rules c where c.merchant_id = v.merchant_id and c.title = v.title);

insert into public.products (id, name, brand, category, unit) values
  ('33333333-3333-3333-3333-333333333131', 'Panadol Extra 20s', 'GSK', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333132', 'Hedex Capsules 20s', 'GSK', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333133', 'ORS Sachets 10s', 'Local', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333134', 'Betadine 100ml', 'Mundipharma', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333135', 'Cotton Wool 100g', 'Local', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333136', 'Pampers Newborn 44s', 'Pampers', 'baby', 'piece'),
  ('33333333-3333-3333-3333-333333333137', 'Baby Cereal 200g', 'Cerelac', 'baby', 'piece'),
  ('33333333-3333-3333-3333-333333333138', 'Infant Formula 400g', 'Nan', 'baby', 'piece'),
  ('33333333-3333-3333-3333-333333333139', 'Baby Lotion 200ml', 'Johnson''s', 'baby', 'piece'),
  ('33333333-3333-3333-3333-333333333140', 'Brown Bread 400g', 'Super Loaf', 'bakery', 'piece'),
  ('33333333-3333-3333-3333-333333333141', 'Mandazi 6-pack', 'Local', 'bakery', 'piece'),
  ('33333333-3333-3333-3333-333333333142', 'Chapati Flour 2kg', 'Exe', 'bakery', 'piece'),
  ('33333333-3333-3333-3333-333333333143', 'Croissants 4-pack', 'Local', 'bakery', 'piece'),
  ('33333333-3333-3333-3333-333333333144', 'Mayonnaise 400g', 'Nandos', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333145', 'Tomato Sauce 700g', 'Heinz', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333146', 'Chilli Sauce 250ml', 'Nandos', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333147', 'Soy Sauce 250ml', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333148', 'Peanut Butter 400g', 'Tropical Heat', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333149', 'Honey 500g', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333150', 'Oats 1kg', 'Quaker', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333151', 'Lentils 1kg', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333152', 'Green Grams 1kg', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333153', 'Ndengu 1kg', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333154', 'Yoghurt Drink 250ml', 'Yogurt', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333155', 'Butter 500g', 'Brookside', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333156', 'Mozzarella 200g', 'Happy Cow', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333157', 'Avocado 1kg', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333158', 'Pineapple Whole', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333159', 'Mangoes 1kg', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333160', 'Spinach Bundle', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333161', 'Dhania Bundle', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333162', 'Laundry Bar 1kg', 'Sunlight', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333163', 'Dishwashing Liquid 750ml', 'Sunlight', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333164', 'Bleach 1L', 'Jik', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333165', 'Air Freshener 300ml', 'Glade', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333166', 'Crisps 150g', 'Tropical Heat', 'snacks', 'piece'),
  ('33333333-3333-3333-3333-333333333167', 'Biscuits Assorted 200g', 'Digestive', 'snacks', 'piece'),
  ('33333333-3333-3333-3333-333333333168', 'Juice 1L', 'Afia', 'beverages', 'piece'),
  ('33333333-3333-3333-3333-333333333169', 'Malt Drink 500ml', 'Malta Guinness', 'beverages', 'piece'),
  ('33333333-3333-3333-3333-333333333170', 'Coffee Instant 100g', 'Nescafe', 'beverages', 'piece')
on conflict (id) do nothing;

with bases(product_id, base_cents) as (
  values
    ('33333333-3333-3333-3333-333333333131'::uuid, 45000),
    ('33333333-3333-3333-3333-333333333132'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333133'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333134'::uuid, 65000),
    ('33333333-3333-3333-3333-333333333135'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333136'::uuid, 185000),
    ('33333333-3333-3333-3333-333333333137'::uuid, 52000),
    ('33333333-3333-3333-3333-333333333138'::uuid, 210000),
    ('33333333-3333-3333-3333-333333333139'::uuid, 48000),
    ('33333333-3333-3333-3333-333333333140'::uuid, 8500),
    ('33333333-3333-3333-3333-333333333141'::uuid, 12000),
    ('33333333-3333-3333-3333-333333333142'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333143'::uuid, 32000),
    ('33333333-3333-3333-3333-333333333144'::uuid, 42000),
    ('33333333-3333-3333-3333-333333333145'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333146'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333147'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333148'::uuid, 45000),
    ('33333333-3333-3333-3333-333333333149'::uuid, 65000),
    ('33333333-3333-3333-3333-333333333150'::uuid, 72000),
    ('33333333-3333-3333-3333-333333333151'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333152'::uuid, 30000),
    ('33333333-3333-3333-3333-333333333153'::uuid, 26000),
    ('33333333-3333-3333-3333-333333333154'::uuid, 6500),
    ('33333333-3333-3333-3333-333333333155'::uuid, 68000),
    ('33333333-3333-3333-3333-333333333156'::uuid, 42000),
    ('33333333-3333-3333-3333-333333333157'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333158'::uuid, 15000),
    ('33333333-3333-3333-3333-333333333159'::uuid, 20000),
    ('33333333-3333-3333-3333-333333333160'::uuid, 5000),
    ('33333333-3333-3333-3333-333333333161'::uuid, 3000),
    ('33333333-3333-3333-3333-333333333162'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333163'::uuid, 32000),
    ('33333333-3333-3333-3333-333333333164'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333165'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333166'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333167'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333168'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333169'::uuid, 12000),
    ('33333333-3333-3333-3333-333333333170'::uuid, 55000)
), merchants(merchant_id, location_id, mult) as (
  values
    ('11111111-1111-1111-1111-111111111101'::uuid, '22222222-2222-2222-2222-222222222101'::uuid, 1.03),
    ('11111111-1111-1111-1111-111111111102'::uuid, '22222222-2222-2222-2222-222222222102'::uuid, 0.995),
    ('11111111-1111-1111-1111-111111111103'::uuid, '22222222-2222-2222-2222-222222222103'::uuid, 0.97)
)
insert into public.merchant_prices (merchant_id, location_id, product_id, price_cents, source, observed_at, prev_price_cents, prev_observed_at)
select
  m.merchant_id,
  m.location_id,
  b.product_id,
  greatest(100, round(b.base_cents * m.mult / 100) * 100)::int,
  'seed',
  now(),
  greatest(100, round(b.base_cents * m.mult * (case when m.mult > 1 then 1.04 else 0.96 end) / 100) * 100)::int,
  now() - interval '7 days'
from bases b
cross join merchants m
on conflict (merchant_id, location_id, product_id) do nothing;

insert into public.merchant_prices (
  merchant_id, location_id, product_id, price_cents, source, observed_at, prev_price_cents, prev_observed_at
)
select
  '11111111-1111-1111-1111-111111111104',
  '22222222-2222-2222-2222-222222222104',
  avg_p.product_id,
  greatest(100, round(avg_p.avg_cents * 0.985 / 100) * 100)::int,
  'seed',
  now(),
  greatest(100, round(avg_p.avg_cents * 1.02 / 100) * 100)::int,
  now() - interval '7 days'
from (
  select product_id, avg(price_cents)::numeric as avg_cents
  from public.merchant_prices
  where merchant_id in (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103'
  )
  group by product_id
) avg_p
on conflict (merchant_id, location_id, product_id) do nothing;

insert into public.merchant_prices (
  merchant_id, location_id, product_id, price_cents, source, observed_at, prev_price_cents, prev_observed_at
)
select
  '11111111-1111-1111-1111-111111111105',
  '22222222-2222-2222-2222-222222222105',
  avg_p.product_id,
  greatest(100, round(avg_p.avg_cents * 1.02 / 100) * 100)::int,
  'seed',
  now(),
  greatest(100, round(avg_p.avg_cents * 0.97 / 100) * 100)::int,
  now() - interval '7 days'
from (
  select product_id, avg(price_cents)::numeric as avg_cents
  from public.merchant_prices
  where merchant_id in (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103'
  )
  group by product_id
) avg_p
on conflict (merchant_id, location_id, product_id) do nothing;

update public.merchant_prices
set observed_at = now()
where source = 'seed'
  and observed_at < now() - interval '1 day';

update public.fuel_prices
set observed_at = now()
where source = 'seed'
  and observed_at < now() - interval '1 day';
