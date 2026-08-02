-- Crowdsource fuel litre tips (append latest observation)

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
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

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

grant execute on function public.submit_crowdsource_fuel_price(uuid, integer, text) to authenticated;
