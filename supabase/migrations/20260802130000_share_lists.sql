-- Shareable shopping lists (household / family thin share)
alter table public.shopping_lists
  add column if not exists share_token text unique,
  add column if not exists shared_at timestamptz;

create index if not exists shopping_lists_share_token_idx
  on public.shopping_lists (share_token)
  where share_token is not null;

create or replace function public.enable_list_share(p_list_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.shopping_lists
    where id = p_list_id and owner_id = auth.uid()
  ) then
    raise exception 'list not found';
  end if;

  select share_token into v_token
  from public.shopping_lists
  where id = p_list_id;

  if v_token is null then
    v_token := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    update public.shopping_lists
    set share_token = v_token,
        shared_at = now(),
        updated_at = now()
    where id = p_list_id;
  else
    update public.shopping_lists
    set shared_at = now(),
        updated_at = now()
    where id = p_list_id;
  end if;

  return v_token;
end;
$$;

create or replace function public.get_shared_list(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list public.shopping_lists%rowtype;
  v_items jsonb;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception 'invalid share link';
  end if;

  select * into v_list
  from public.shopping_lists
  where share_token = trim(p_token);

  if not found then
    raise exception 'shared list not found';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'product_id', li.product_id,
      'free_text', li.free_text,
      'quantity', li.quantity
    ) order by li.created_at
  ), '[]'::jsonb)
  into v_items
  from public.list_items li
  where li.list_id = v_list.id
    and li.product_id is not null;

  return jsonb_build_object(
    'name', v_list.name,
    'shared_at', v_list.shared_at,
    'items', v_items
  );
end;
$$;

grant execute on function public.enable_list_share(uuid) to authenticated;
grant execute on function public.get_shared_list(text) to anon, authenticated;
