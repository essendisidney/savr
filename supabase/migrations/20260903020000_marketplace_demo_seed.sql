-- Optional demo seed (idempotent). Prefer app DEMO_LISTINGS when DB empty.
-- Run only when a seller profile exists; skipped if listings already present.

do $$
declare
  seller uuid;
begin
  if exists (select 1 from public.listings limit 1) then
    return;
  end if;

  select id into seller from public.profiles order by created_at nulls last limit 1;
  if seller is null then
    return;
  end if;

  insert into public.listings (seller_id, title, price_cents, status, city)
  values
    (seller, 'iPhone 13 128GB', 4500000, 'live', 'Nairobi'),
    (seller, 'Oak dining table', 850000, 'live', 'Nairobi'),
    (seller, 'Think Twice dress', 80000, 'live', 'Nairobi'),
    (seller, 'Samsung 43" Smart TV', 2200000, 'live', 'Nairobi'),
    (seller, 'Dell Latitude laptop', 3500000, 'live', 'Nairobi'),
    (seller, 'Toyota Fielder 2014', 15000000, 'live', 'Nairobi'),
    (seller, 'Nike Air Force 1', 450000, 'live', 'Nairobi'),
    (seller, '3-seater sofa', 1200000, 'live', 'Nairobi'),
    (seller, 'Mountain bike', 950000, 'live', 'Nairobi'),
    (seller, 'Double-door fridge', 2800000, 'live', 'Nairobi'),
    (seller, 'Casio watch', 250000, 'live', 'Nairobi'),
    (seller, 'JBL Bluetooth speaker', 380000, 'live', 'Nairobi'),
    (seller, 'Leather jacket M', 320000, 'live', 'Nairobi'),
    (seller, '24" Dell monitor', 750000, 'live', 'Nairobi'),
    (seller, 'PlayStation 5 Disc', 5500000, 'live', 'Nairobi'),
    (seller, 'Microwave oven', 420000, 'live', 'Nairobi'),
    (seller, '5x6 bed + mattress', 1800000, 'live', 'Nairobi'),
    (seller, 'Canon EOS M50', 4200000, 'live', 'Nairobi'),
    (seller, 'Electric scooter', 2100000, 'live', 'Nairobi'),
    (seller, 'Designer tote bag', 600000, 'live', 'Nairobi');

  insert into public.listing_images (listing_id, storage_path, public_url, sort_order)
  select
    l.id,
    'seed/' || l.id::text,
    case (row_number() over (order by l.created_at)) % 6
      when 1 then 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
      when 2 then 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80'
      when 3 then 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80'
      when 4 then 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80'
      when 5 then 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80'
      else 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80'
    end,
    0
  from public.listings l
  where l.seller_id = seller
    and not exists (select 1 from public.listing_images li where li.listing_id = l.id);
end $$;
