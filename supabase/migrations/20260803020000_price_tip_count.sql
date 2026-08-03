-- Tip social proof: count shopper tips per shelf price

alter table public.merchant_prices
  add column if not exists tip_count integer not null default 0;

update public.merchant_prices
set tip_count = 1
where source = 'crowdsource'
  and tip_count = 0;

drop function if exists public.submit_crowdsource_price(uuid, uuid, integer, uuid);

create or replace function public.submit_crowdsource_price(
  p_merchant_id uuid,
  p_product_id uuid,
  p_price_cents integer,
  p_location_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location_id uuid;
  v_tip_count integer;
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
    merchant_id, location_id, product_id, price_cents, source, observed_at, tip_count
  )
  values (
    p_merchant_id, v_location_id, p_product_id, p_price_cents, 'crowdsource', now(), 1
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
      tip_count = coalesce(public.merchant_prices.tip_count, 0) + 1,
      source = case
        when public.merchant_prices.source = 'merchant' then 'merchant'
        else 'crowdsource'
      end
  returning tip_count into v_tip_count;

  return coalesce(v_tip_count, 1);
end;
$$;

grant execute on function public.submit_crowdsource_price(uuid, uuid, integer, uuid) to anon, authenticated;
