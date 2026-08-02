-- Wave 8: denser Nairobi weekly-shop catalog (~40 SKUs) across all grocery branches.

insert into public.products (id, name, brand, category, unit) values
  ('33333333-3333-3333-3333-333333333171', 'Chicken Broiler 1kg', 'Local', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333172', 'Beef Mince 500g', 'Local', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333173', 'Goat Meat 1kg', 'Local', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333174', 'Tilapia Whole 1kg', 'Local', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333175', 'Sausages 400g', 'Farmer''s Choice', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333176', 'Bacon 200g', 'Farmer''s Choice', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333177', 'Tinned Tuna 185g', 'John West', 'protein', 'piece'),
  ('33333333-3333-3333-3333-333333333178', 'Baked Beans 420g', 'Heinz', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333179', 'Spaghetti 500g', 'Indomie', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333180', 'Macaroni 400g', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333181', 'Cornflakes 500g', 'Kellogg''s', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333182', 'Weetabix 430g', 'Weetabix', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333183', 'Custard Powder 300g', 'Bird''s', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333184', 'Baking Powder 100g', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333185', 'Vanilla Essence 50ml', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333186', 'Coconut Milk 400ml', 'Local', 'staples', 'piece'),
  ('33333333-3333-3333-3333-333333333187', 'Ghee 500g', 'Brookside', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333188', 'Fresh Cream 250ml', 'Brookside', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333189', 'Sour Milk 500ml', 'Mala', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333190', 'Cheddar Cheese 200g', 'Happy Cow', 'dairy', 'piece'),
  ('33333333-3333-3333-3333-333333333191', 'Watermelon Whole', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333192', 'Passion Fruit 1kg', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333193', 'Pawpaw Whole', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333194', 'Sukuma Wiki Bundle', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333195', 'Managu Bundle', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333196', 'Spring Onions Bundle', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333197', 'Ginger 500g', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333198', 'Garlic 250g', 'Local', 'produce', 'piece'),
  ('33333333-3333-3333-3333-333333333199', 'Tissue Rolls 10s', 'Rosy', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333200', 'Kitchen Towels 2s', 'Rosy', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333201', 'Bin Liners 20s', 'Local', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333202', 'Mosquito Coil 10s', 'Doom', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333203', 'Matchboxes 10s', 'Local', 'household', 'piece'),
  ('33333333-3333-3333-3333-333333333204', 'Toothbrush Soft', 'Colgate', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333205', 'Deodorant Spray 150ml', 'Nivea', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333206', 'Body Lotion 400ml', 'Nivea', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333207', 'Sanitary Pads 16s', 'Always', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333208', 'Shampoo 400ml', 'Sunsilk', 'personal_care', 'piece'),
  ('33333333-3333-3333-3333-333333333209', 'Energy Drink 250ml', 'Monster', 'beverages', 'piece'),
  ('33333333-3333-3333-3333-333333333210', 'Bottled Water 6x500ml', 'Dasani', 'beverages', 'piece')
on conflict (id) do nothing;

with bases(product_id, base_cents) as (
  values
    ('33333333-3333-3333-3333-333333333171'::uuid, 48000),
    ('33333333-3333-3333-3333-333333333172'::uuid, 42000),
    ('33333333-3333-3333-3333-333333333173'::uuid, 85000),
    ('33333333-3333-3333-3333-333333333174'::uuid, 55000),
    ('33333333-3333-3333-3333-333333333175'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333176'::uuid, 45000),
    ('33333333-3333-3333-3333-333333333177'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333178'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333179'::uuid, 12000),
    ('33333333-3333-3333-3333-333333333180'::uuid, 14000),
    ('33333333-3333-3333-3333-333333333181'::uuid, 65000),
    ('33333333-3333-3333-3333-333333333182'::uuid, 72000),
    ('33333333-3333-3333-3333-333333333183'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333184'::uuid, 8000),
    ('33333333-3333-3333-3333-333333333185'::uuid, 9000),
    ('33333333-3333-3333-3333-333333333186'::uuid, 25000),
    ('33333333-3333-3333-3333-333333333187'::uuid, 78000),
    ('33333333-3333-3333-3333-333333333188'::uuid, 22000),
    ('33333333-3333-3333-3333-333333333189'::uuid, 9000),
    ('33333333-3333-3333-3333-333333333190'::uuid, 48000),
    ('33333333-3333-3333-3333-333333333191'::uuid, 25000),
    ('33333333-3333-3333-3333-333333333192'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333193'::uuid, 12000),
    ('33333333-3333-3333-3333-333333333194'::uuid, 4000),
    ('33333333-3333-3333-3333-333333333195'::uuid, 5000),
    ('33333333-3333-3333-3333-333333333196'::uuid, 3000),
    ('33333333-3333-3333-3333-333333333197'::uuid, 15000),
    ('33333333-3333-3333-3333-333333333198'::uuid, 12000),
    ('33333333-3333-3333-3333-333333333199'::uuid, 32000),
    ('33333333-3333-3333-3333-333333333200'::uuid, 28000),
    ('33333333-3333-3333-3333-333333333201'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333202'::uuid, 15000),
    ('33333333-3333-3333-3333-333333333203'::uuid, 5000),
    ('33333333-3333-3333-3333-333333333204'::uuid, 12000),
    ('33333333-3333-3333-3333-333333333205'::uuid, 45000),
    ('33333333-3333-3333-3333-333333333206'::uuid, 52000),
    ('33333333-3333-3333-3333-333333333207'::uuid, 38000),
    ('33333333-3333-3333-3333-333333333208'::uuid, 42000),
    ('33333333-3333-3333-3333-333333333209'::uuid, 18000),
    ('33333333-3333-3333-3333-333333333210'::uuid, 35000)
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
  now(),
  greatest(100, round(b.base_cents * m.mult * (case when m.mult > 1 then 1.04 else 0.96 end) / 100) * 100)::int,
  now() - interval '7 days'
from bases b
cross join primary_locs m
on conflict (merchant_id, location_id, product_id) do nothing;

-- Mirror onto second branches with small variance
insert into public.merchant_prices (
  merchant_id, location_id, product_id, price_cents, source, observed_at, prev_price_cents, prev_observed_at
)
select
  mp.merchant_id,
  loc.id,
  mp.product_id,
  greatest(100, round(mp.price_cents * mult.factor / 100) * 100)::int,
  'seed',
  now(),
  greatest(100, round(mp.price_cents * mult.prev_factor / 100) * 100)::int,
  now() - interval '7 days'
from public.merchant_prices mp
join (
  values
    ('22222222-2222-2222-2222-222222222106'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 1.015::numeric, 0.98::numeric),
    ('22222222-2222-2222-2222-222222222107'::uuid, '11111111-1111-1111-1111-111111111102'::uuid, 0.99::numeric, 1.03::numeric),
    ('22222222-2222-2222-2222-222222222108'::uuid, '11111111-1111-1111-1111-111111111103'::uuid, 1.01::numeric, 0.97::numeric),
    ('22222222-2222-2222-2222-222222222109'::uuid, '11111111-1111-1111-1111-111111111104'::uuid, 0.995::numeric, 1.02::numeric),
    ('22222222-2222-2222-2222-222222222110'::uuid, '11111111-1111-1111-1111-111111111105'::uuid, 1.025::numeric, 0.96::numeric)
) as mult(location_id, merchant_id, factor, prev_factor)
  on mp.merchant_id = mult.merchant_id
join public.merchant_locations loc on loc.id = mult.location_id
where mp.product_id >= '33333333-3333-3333-3333-333333333171'
  and mp.product_id <= '33333333-3333-3333-3333-333333333210'
  and mp.location_id = (
    select l2.id
    from public.merchant_locations l2
    where l2.merchant_id = mp.merchant_id
    order by l2.created_at asc
    limit 1
  )
on conflict (merchant_id, location_id, product_id) do nothing;

update public.merchant_prices
set observed_at = now()
where source = 'seed'
  and observed_at < now() - interval '1 day';

update public.fuel_prices
set observed_at = now()
where source = 'seed'
  and observed_at < now() - interval '1 day';
