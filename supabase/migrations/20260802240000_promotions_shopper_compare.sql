-- Flat + category fields for shopper-facing promo compare
alter table public.promotions
  add column if not exists flat_cents integer check (flat_cents is null or flat_cents >= 0),
  add column if not exists category text;

-- Demo promos so basket ranks show partner deals without portal setup
insert into public.promotions (
  id, merchant_id, title, description, discount_percent, flat_cents, product_id, category, ends_at, is_active
) values
  (
    '55555555-5555-5555-5555-555555555001',
    '11111111-1111-1111-1111-111111111102',
    'Cooking oil deal',
    'Partner promo · live in basket ranks',
    10,
    null,
    '33333333-3333-3333-3333-333333333006',
    null,
    now() + interval '30 days',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555002',
    '11111111-1111-1111-1111-111111111103',
    'KES 50 off dairy',
    'Category promo · live in basket ranks',
    null,
    5000,
    null,
    'dairy',
    now() + interval '30 days',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555003',
    '11111111-1111-1111-1111-111111111101',
    'Weekend basket boost',
    'Store-wide flat off · live in basket ranks',
    null,
    3000,
    null,
    null,
    now() + interval '14 days',
    true
  )
on conflict (id) do nothing;
