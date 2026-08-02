-- Crowdsource price tips from shoppers (data flywheel)

create or replace function public.submit_crowdsource_price(
  p_merchant_id uuid,
  p_product_id uuid,
  p_price_cents integer
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
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

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

  select id into v_location_id
  from public.merchant_locations
  where merchant_id = p_merchant_id and is_active = true
  order by created_at asc
  limit 1;

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
    set price_cents = excluded.price_cents,
        observed_at = now(),
        source = case
          when public.merchant_prices.source = 'merchant' then 'merchant'
          else 'crowdsource'
        end
  returning id into v_price_id;

  return v_price_id;
end;
$$;

grant execute on function public.submit_crowdsource_price(uuid, uuid, integer) to authenticated;
