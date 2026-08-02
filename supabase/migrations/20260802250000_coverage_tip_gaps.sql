-- Discoverable coverage gaps: SKU priced at only one merchant
insert into public.products (id, name, brand, category, unit) values
  ('33333333-3333-3333-3333-333333333090', 'Avocado Hass 1kg', 'Local', 'produce', 'piece')
on conflict (id) do nothing;

-- Only Carrefour has a price — Naivas/Quickmart show as missing in basket ranks
insert into public.merchant_prices (merchant_id, location_id, product_id, price_cents, source, observed_at)
values
  (
    '11111111-1111-1111-1111-111111111103',
    '22222222-2222-2222-2222-222222222103',
    '33333333-3333-3333-3333-333333333090',
    18500,
    'seed',
    now()
  )
on conflict (merchant_id, location_id, product_id) do nothing;
