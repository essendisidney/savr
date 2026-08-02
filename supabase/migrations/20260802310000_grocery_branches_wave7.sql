-- Wave 7: second Nairobi branches for each grocery chain + branch prices

insert into public.merchant_locations (id, merchant_id, name, address, lat, lng, city, is_active) values
  ('22222222-2222-2222-2222-222222222106', '11111111-1111-1111-1111-111111111101', 'Naivas Junction', 'Ngong Road Junction', -1.3005, 36.7820, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222107', '11111111-1111-1111-1111-111111111102', 'Quickmart Lavington', 'James Gichuru Road', -1.2760, 36.7685, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222108', '11111111-1111-1111-1111-111111111103', 'Carrefour Two Rivers', 'Two Rivers Mall, Limuru Road', -1.2195, 36.8045, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222109', '11111111-1111-1111-1111-111111111104', 'Chandarana Sarit', 'Sarit Centre, Westlands', -1.2618, 36.8042, 'Nairobi', true),
  ('22222222-2222-2222-2222-222222222110', '11111111-1111-1111-1111-111111111105', 'Eastmatt Donholm', 'Outer Ring Road, Donholm', -1.2935, 36.8870, 'Nairobi', true)
on conflict (id) do nothing;

-- Copy catalog prices onto new branches with small shelf variance
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
where mp.location_id = (
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
