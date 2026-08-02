-- Price history light: keep previous observation on merchant_prices for "vs last week".

alter table public.merchant_prices
  add column if not exists prev_price_cents integer,
  add column if not exists prev_observed_at timestamptz;

comment on column public.merchant_prices.prev_price_cents is
  'Prior shelf price (cents) before the latest update — used for week/prior trend UI';
comment on column public.merchant_prices.prev_observed_at is
  'When prev_price_cents was the live price';

-- Bootstrap demo trends (~7 days ago). Mix of drops and rises from stable hash.
update public.merchant_prices mp
set
  prev_price_cents = case
    when abs(hashtext(mp.product_id::text || mp.merchant_id::text)) % 5 = 0
      then greatest(100, round(mp.price_cents * 0.94)::integer)
    else round(
      mp.price_cents * (1.04 + (abs(hashtext(mp.product_id::text)) % 6) / 100.0)
    )::integer
  end,
  prev_observed_at = now() - interval '7 days'
where mp.prev_price_cents is null
  and mp.price_cents is not null
  and mp.price_cents > 0;

create or replace function public.add_merchant_price(
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
    raise exception 'not authenticated';
  end if;
  if p_price_cents < 0 then
    raise exception 'invalid price';
  end if;
  if not public.is_merchant_member(p_merchant_id) then
    raise exception 'not a merchant member';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'product not found';
  end if;

  select id into v_location_id
  from public.merchant_locations
  where merchant_id = p_merchant_id and is_active = true
  order by created_at nulls last
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
    p_merchant_id, v_location_id, p_product_id, p_price_cents, 'merchant', now()
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
      source = 'merchant'
  returning id into v_price_id;

  return v_price_id;
end;
$$;

create or replace function public.update_merchant_price(
  p_price_id uuid,
  p_price_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_merchant_id uuid;
  v_old_cents integer;
  v_old_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_price_cents < 0 then
    raise exception 'invalid price';
  end if;

  select merchant_id, price_cents, observed_at
    into v_merchant_id, v_old_cents, v_old_at
  from public.merchant_prices
  where id = p_price_id;

  if v_merchant_id is null then
    raise exception 'price row not found';
  end if;

  if not public.is_merchant_member(v_merchant_id) then
    raise exception 'not a merchant member';
  end if;

  update public.merchant_prices
  set
    prev_price_cents = case
      when v_old_cents is distinct from p_price_cents then v_old_cents
      else prev_price_cents
    end,
    prev_observed_at = case
      when v_old_cents is distinct from p_price_cents then v_old_at
      else prev_observed_at
    end,
    price_cents = p_price_cents,
    observed_at = now(),
    source = 'merchant'
  where id = p_price_id;
end;
$$;

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
