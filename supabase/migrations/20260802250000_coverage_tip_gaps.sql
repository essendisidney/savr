-- Intentional coverage gaps so basket tip flywheel is discoverable
-- (Naivas missing bananas + noodles; Quickmart missing tissue)
delete from public.merchant_prices
where merchant_id = '11111111-1111-1111-1111-111111111101'
  and product_id in (
    '33333333-3333-3333-3333-333333333075',
    '33333333-3333-3333-3333-333333333080'
  );

delete from public.merchant_prices
where merchant_id = '11111111-1111-1111-1111-111111111102'
  and product_id = '33333333-3333-3333-3333-333333333084';
