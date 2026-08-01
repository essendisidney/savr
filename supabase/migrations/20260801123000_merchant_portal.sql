-- Merchant portal: claim store + update prices
create or replace function public.claim_merchant(p_merchant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (select 1 from public.merchants where id = p_merchant_id and category = 'grocery') then
    raise exception 'merchant not found';
  end if;

  insert into public.merchant_members (merchant_id, profile_id, role)
  values (p_merchant_id, auth.uid(), 'owner')
  on conflict (merchant_id, profile_id) do update set role = excluded.role;

  update public.profiles
  set role = 'merchant_admin'
  where id = auth.uid();
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
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_price_cents < 0 then
    raise exception 'invalid price';
  end if;

  select merchant_id into v_merchant_id
  from public.merchant_prices
  where id = p_price_id;

  if v_merchant_id is null then
    raise exception 'price row not found';
  end if;

  if not public.is_merchant_member(v_merchant_id) then
    raise exception 'not a merchant member';
  end if;

  update public.merchant_prices
  set price_cents = p_price_cents,
      observed_at = now(),
      source = 'merchant'
  where id = p_price_id;
end;
$$;

grant execute on function public.claim_merchant(uuid) to authenticated;
grant execute on function public.update_merchant_price(uuid, integer) to authenticated;
