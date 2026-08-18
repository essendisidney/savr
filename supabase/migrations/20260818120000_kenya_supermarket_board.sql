-- Kenya supermarket board: more chains + Kenyan staple SKUs.
-- Seed prices are starter boards (source=seed), never live tills.

insert into public.merchants (id, name, slug, category, is_verified) values
  ('11111111-1111-1111-1111-111111111106', 'Cleanshelf', 'cleanshelf', 'grocery', true),
  ('11111111-1111-1111-1111-111111111107', 'Magunas', 'magunas', 'grocery', true),
  ('11111111-1111-1111-1111-111111111108', 'Gilanis', 'gilanis', 'grocery', true),
  ('11111111-1111-1111-1111-111111111109', 'Tumaini', 'tumaini', 'grocery', true),
  ('11111111-1111-1111-1111-111111111110', 'Kassmart', 'kassmart', 'grocery', true),
  ('11111111-1111-1111-1111-111111111111', 'Game', 'game', 'grocery', true),
  ('11111111-1111-1111-1111-111111111112', 'Buyers Choice', 'buyers-choice', 'grocery', true),
  ('11111111-1111-1111-1111-111111111113', 'Kamindi', 'kamindi', 'grocery', true),
  ('11111111-1111-1111-1111-111111111114', 'Cielo', 'cielo', 'grocery', true)
on conflict (id) do nothing;

insert into public.merchant_locations (id, merchant_id, name, address, lat, lng, city, is_active) values
  ('22222222-2222-2222-2222-222222222111', '11111111-1111-1111-1111-111111111106', 'Cleanshelf Westlands', 'Ring Road Parklands', -1.2680, 36.8060, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222112', '11111111-1111-1111-1111-111111111107', 'Magunas Roysambu', 'Thika Superhighway, Roysambu', -1.2190, 36.8870, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222113', '11111111-1111-1111-1111-111111111108', 'Gilanis Parklands', 'Parklands Road', -1.2630, 36.8180, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222114', '11111111-1111-1111-1111-111111111109', 'Tumaini Donholm', 'Outer Ring Road, Donholm', -1.2940, 36.8870, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222115', '11111111-1111-1111-1111-111111111110', 'Kassmart Kitengela', 'Namanga Road, Kitengela', -1.4770, 36.9570, 'Kitengela', true),
  ('22222222-2222-2222-2222-222222222116', '11111111-1111-1111-1111-111111111111', 'Game Garden City', 'Garden City Mall, Thika Road', -1.2290, 36.8780, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222117', '11111111-1111-1111-1111-111111111112', 'Buyers Choice Embakasi', 'Outering Road, Embakasi', -1.3080, 36.8950, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222118', '11111111-1111-1111-1111-111111111113', 'Kamindi Thika', 'Kenya Commercial Bank area, Thika', -1.0390, 37.0830, 'Thika', true),
  ('22222222-2222-2222-2222-222222222119', '11111111-1111-1111-1111-111111111114', 'Cielo Ruiru', 'Ruiru Town', -1.1480, 36.9600, 'Ruiru', true),
  ('22222222-2222-2222-2222-222222222120', '11111111-1111-1111-1111-111111111101', 'Naivas Garden City', 'Garden City Mall, Thika Road', -1.2295, 36.8785, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222121', '11111111-1111-1111-1111-111111111102', 'Quickmart Embakasi', 'Airport North Road, Embakasi', -1.3230, 36.8940, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222122', '11111111-1111-1111-1111-111111111103', 'Carrefour Junction', 'The Junction Mall, Ngong Road', -1.2998, 36.7625, 'Nairobi', true)
on conflict (id) do nothing;

insert into public.cashback_rules (merchant_id, title, flat_cents, min_basket_cents, is_active)
select * from (values
  ('11111111-1111-1111-1111-111111111106'::uuid, 'Grocery cashback', 2500, 200000, true),
  ('11111111-1111-1111-1111-111111111107'::uuid, 'Grocery cashback', 2500, 200000, true),
  ('11111111-1111-1111-1111-111111111108'::uuid, 'Grocery cashback', 3000, 200000, true),
  ('11111111-1111-1111-1111-111111111109'::uuid, 'Grocery cashback', 2000, 200000, true),
  ('11111111-1111-1111-1111-111111111110'::uuid, 'Grocery cashback', 2000, 200000, true),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Grocery cashback', 4000, 250000, true),
  ('11111111-1111-1111-1111-111111111112'::uuid, 'Grocery cashback', 2000, 200000, true),
  ('11111111-1111-1111-1111-111111111113'::uuid, 'Grocery cashback', 2500, 200000, true),
  ('11111111-1111-1111-1111-111111111114'::uuid, 'Grocery cashback', 2000, 200000, true)
) as v(merchant_id, title, flat_cents, min_basket_cents, is_active)
where not exists (
  select 1 from public.cashback_rules c
  where c.merchant_id = v.merchant_id and c.title = v.title
);

insert into public.products (id, name, brand, category, unit) values
  ('33333333-3333-3333-3333-333333333271', 'Kabras Sugar 2kg', 'Kabras', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333272', 'Soko Maize Flour 2kg', 'Soko', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333273', 'White Star Maize Flour 2kg', 'White Star', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333274', 'Tuzo Fresh Milk 500ml', 'Tuzo', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333275', 'Daima Fresh Milk 500ml', 'Daima', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333276', 'Royco Mchuzi Mix 400g', 'Royco', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333277', 'Kimbo Cooking Fat 1kg', 'Kimbo', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333278', 'Cowboy Cooking Fat 1kg', 'Cowboy', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333279', 'Ariel Detergent 1kg', 'Ariel', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333280', 'Rina Cooking Oil 5L', 'Rina', 'staples', 'piece')
on conflict (id) do nothing;

-- New SKUs onto every active grocery branch (starter board).
with bases(product_id, base_cents) as (
  values
    ('33333333-3333-3333-3333-333333333271'::uuid, 36000),
    ('33333333-3333-3333-3333-333333333272'::uuid, 21000),
    ('33333333-3333-3333-3333-333333333273'::uuid, 23000),
    ('33333333-3333-3333-3333-333333333274'::uuid, 7000),
    ('33333333-3333-3333-3333-333333333275'::uuid, 7200),
    ('33333333-3333-3333-3333-333333333276'::uuid, 18500),
    ('33333333-3333-3333-3333-333333333277'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333278'::uuid, 26500),
    ('33333333-3333-3333-3333-333333333279'::uuid, 32000),
    ('33333333-3333-3333-3333-333333333280'::uuid, 145000)
)
insert into public.merchant_prices (
  merchant_id, location_id, product_id, price_cents, source, observed_at, prev_price_cents, prev_observed_at
)
select
  loc.merchant_id,
  loc.id,
  b.product_id,
  greatest(100, round(b.base_cents * coalesce(mult.factor, 1.0) / 100) * 100)::int,
  'seed',
  now(),
  greatest(100, round(b.base_cents * coalesce(mult.prev_factor, 1.02) / 100) * 100)::int,
  now() - interval '7 days'
from bases b
cross join public.merchant_locations loc
join public.merchants m on m.id = loc.merchant_id and m.category = 'grocery'
left join (
  values
    ('11111111-1111-1111-1111-111111111101'::uuid, 1.03::numeric, 0.98::numeric),
    ('11111111-1111-1111-1111-111111111102'::uuid, 0.995::numeric, 1.03::numeric),
    ('11111111-1111-1111-1111-111111111103'::uuid, 0.97::numeric, 1.02::numeric),
    ('11111111-1111-1111-1111-111111111104'::uuid, 0.985::numeric, 1.02::numeric),
    ('11111111-1111-1111-1111-111111111105'::uuid, 1.02::numeric, 0.97::numeric),
    ('11111111-1111-1111-1111-111111111106'::uuid, 1.01::numeric, 0.99::numeric),
    ('11111111-1111-1111-1111-111111111107'::uuid, 0.98::numeric, 1.03::numeric),
    ('11111111-1111-1111-1111-111111111108'::uuid, 1.04::numeric, 0.98::numeric),
    ('11111111-1111-1111-1111-111111111109'::uuid, 0.99::numeric, 1.02::numeric),
    ('11111111-1111-1111-1111-111111111110'::uuid, 0.97::numeric, 1.03::numeric),
    ('11111111-1111-1111-1111-111111111111'::uuid, 1.06::numeric, 0.99::numeric),
    ('11111111-1111-1111-1111-111111111112'::uuid, 0.985::numeric, 1.02::numeric),
    ('11111111-1111-1111-1111-111111111113'::uuid, 0.99::numeric, 1.03::numeric),
    ('11111111-1111-1111-1111-111111111114'::uuid, 1.015::numeric, 0.98::numeric)
) as mult(merchant_id, factor, prev_factor) on mult.merchant_id = loc.merchant_id
where loc.is_active
on conflict (merchant_id, location_id, product_id) do nothing;

-- Fill any grocery branch that is missing a catalog SKU from the 3-major average.
insert into public.merchant_prices (
  merchant_id, location_id, product_id, price_cents, source, observed_at, prev_price_cents, prev_observed_at
)
select
  loc.merchant_id,
  loc.id,
  avg_p.product_id,
  greatest(100, round(avg_p.avg_cents * coalesce(mult.factor, 1.0) / 100) * 100)::int,
  'seed',
  now(),
  greatest(100, round(avg_p.avg_cents * coalesce(mult.prev_factor, 1.02) / 100) * 100)::int,
  now() - interval '7 days'
from public.merchant_locations loc
join public.merchants m on m.id = loc.merchant_id and m.category = 'grocery'
join (
  select product_id, avg(price_cents)::numeric as avg_cents
  from public.merchant_prices
  where merchant_id in (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103'
  )
  group by product_id
) avg_p on true
left join public.merchant_prices existing
  on existing.merchant_id = loc.merchant_id
 and existing.location_id = loc.id
 and existing.product_id = avg_p.product_id
left join (
  values
    ('11111111-1111-1111-1111-111111111104'::uuid, 0.985::numeric, 1.02::numeric),
    ('11111111-1111-1111-1111-111111111105'::uuid, 1.02::numeric, 0.97::numeric),
    ('11111111-1111-1111-1111-111111111106'::uuid, 1.01::numeric, 0.99::numeric),
    ('11111111-1111-1111-1111-111111111107'::uuid, 0.98::numeric, 1.03::numeric),
    ('11111111-1111-1111-1111-111111111108'::uuid, 1.04::numeric, 0.98::numeric),
    ('11111111-1111-1111-1111-111111111109'::uuid, 0.99::numeric, 1.02::numeric),
    ('11111111-1111-1111-1111-111111111110'::uuid, 0.97::numeric, 1.03::numeric),
    ('11111111-1111-1111-1111-111111111111'::uuid, 1.06::numeric, 0.99::numeric),
    ('11111111-1111-1111-1111-111111111112'::uuid, 0.985::numeric, 1.02::numeric),
    ('11111111-1111-1111-1111-111111111113'::uuid, 0.99::numeric, 1.03::numeric),
    ('11111111-1111-1111-1111-111111111114'::uuid, 1.015::numeric, 0.98::numeric)
) as mult(merchant_id, factor, prev_factor) on mult.merchant_id = loc.merchant_id
where loc.is_active
  and existing.product_id is null
on conflict (merchant_id, location_id, product_id) do nothing;
