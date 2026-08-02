-- Soft-launch: let unsigned shoppers tip grocery shelf prices.
-- Keeps price-range + merchant/product checks; still security definer.

create or replace function public.submit_crowdsource_price(
  p_merchant_id uuid,
  p_product_id uuid,
  p_price_cents integer,
  p_location_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location_id uuid;
  v_price_id uuid;
begin
  if p_price_cents is null or p_price_cents < 100 or p_price_cents > 50000000 then
    raise exception 'Price out of range';
  end if;

  if not exists (
    select 1 from public.merchants
    where id = p_merchant_id and category = 'grocery'
  ) then
    raise exception 'Unknown grocery merchant';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Unknown product';
  end if;

  if p_location_id is not null then
    select id into v_location_id
    from public.merchant_locations
    where id = p_location_id
      and merchant_id = p_merchant_id
      and is_active = true;
    if v_location_id is null then
      raise exception 'Unknown branch for this store';
    end if;
  else
    select id into v_location_id
    from public.merchant_locations
    where merchant_id = p_merchant_id and is_active = true
    order by created_at asc
    limit 1;
  end if;

  if v_location_id is null then
    insert into public.merchant_locations (merchant_id, name, city, is_active)
    values (p_merchant_id, 'Main', 'Nairobi', true)
    returning id into v_location_id;
  end if;

  insert into public.merchant_prices (
    merchant_id, location_id, product_id, price_cents, source, observed_at
  )
  values (
    p_merchant_id, v_location_id, p_product_id, p_price_cents, 'crowdsource', now()
  )
  on conflict (merchant_id, location_id, product_id) do update
    set
      prev_price_cents = case
        when public.merchant_prices.price_cents is distinct from excluded.price_cents
          then public.merchant_prices.price_cents
        else public.merchant_prices.prev_price_cents
      end,
      prev_observed_at = case
        when public.merchant_prices.price_cents is distinct from excluded.price_cents
          then public.merchant_prices.observed_at
        else public.merchant_prices.prev_observed_at
      end,
      price_cents = excluded.price_cents,
      observed_at = now(),
      source = case
        when public.merchant_prices.source = 'merchant' then 'merchant'
        else 'crowdsource'
      end
  returning id into v_price_id;

  return v_price_id;
end;
$$;

grant execute on function public.submit_crowdsource_price(uuid, uuid, integer, uuid) to anon, authenticated;

-- Same for fuel pump tips (soft-launch trust flywheel)
create or replace function public.submit_crowdsource_fuel_price(
  p_station_id uuid,
  p_price_cents_per_litre integer,
  p_fuel_type text default 'petrol'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_type text;
begin
  v_type := coalesce(nullif(trim(p_fuel_type), ''), 'petrol');
  if v_type not in ('petrol', 'diesel', 'kerosene') then
    raise exception 'Invalid fuel type';
  end if;

  if p_price_cents_per_litre is null
     or p_price_cents_per_litre < 5000
     or p_price_cents_per_litre > 50000 then
    raise exception 'Price out of range';
  end if;

  if not exists (
    select 1 from public.fuel_stations where id = p_station_id and is_active = true
  ) then
    raise exception 'Unknown fuel station';
  end if;

  insert into public.fuel_prices (
    station_id, fuel_type, price_cents_per_litre, source, observed_at
  )
  values (
    p_station_id, v_type, p_price_cents_per_litre, 'crowdsource', now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_crowdsource_fuel_price(uuid, integer, text) to anon, authenticated;
