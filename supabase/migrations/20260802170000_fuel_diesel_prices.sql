-- Diesel litre prices for Nairobi seed stations

insert into public.fuel_prices (station_id, fuel_type, price_cents_per_litre, source, observed_at) values
  ('44444444-4444-4444-4444-444444444001', 'diesel', 16800, 'seed', now()),
  ('44444444-4444-4444-4444-444444444002', 'diesel', 17100, 'seed', now()),
  ('44444444-4444-4444-4444-444444444003', 'diesel', 16650, 'seed', now());
