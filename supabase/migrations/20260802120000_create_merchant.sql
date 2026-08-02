-- Register a new grocery merchant + first branch; caller becomes owner
create or replace function public.create_merchant(
  p_name text,
  p_branch_name text default null,
  p_address text default null,
  p_city text default 'Nairobi'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_base text;
  v_merchant_id uuid;
  v_branch text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_base := lower(trim(coalesce(p_name, '')));
  if length(v_base) < 2 then
    raise exception 'store name is required';
  end if;

  v_slug := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    raise exception 'invalid store name';
  end if;

  if exists (select 1 from public.merchants where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  v_branch := nullif(trim(coalesce(p_branch_name, '')), '');
  if v_branch is null then
    v_branch := trim(p_name) || ' · Main';
  end if;

  insert into public.merchants (name, slug, category, is_verified)
  values (trim(p_name), v_slug, 'grocery', false)
  returning id into v_merchant_id;

  insert into public.merchant_locations (merchant_id, name, address, city, is_active)
  values (
    v_merchant_id,
    v_branch,
    nullif(trim(coalesce(p_address, '')), ''),
    coalesce(nullif(trim(p_city), ''), 'Nairobi'),
    true
  );

  insert into public.merchant_members (merchant_id, profile_id, role)
  values (v_merchant_id, auth.uid(), 'owner')
  on conflict (merchant_id, profile_id) do update set role = excluded.role;

  update public.profiles
  set role = 'merchant_admin'
  where id = auth.uid();

  return v_merchant_id;
end;
$$;

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
    set price_cents = excluded.price_cents,
        observed_at = now(),
        source = 'merchant'
  returning id into v_price_id;

  return v_price_id;
end;
$$;

grant execute on function public.create_merchant(text, text, text, text) to authenticated;
grant execute on function public.add_merchant_price(uuid, uuid, integer) to authenticated;
