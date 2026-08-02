-- Household partners can append products to a shared list via token (no auth required)

create or replace function public.append_shared_list_item(
  p_token text,
  p_product_id uuid,
  p_quantity numeric default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list public.shopping_lists%rowtype;
  v_product public.products%rowtype;
  v_qty numeric;
  v_existing public.list_items%rowtype;
  v_count integer;
  v_items jsonb;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception 'invalid share link';
  end if;
  if p_product_id is null then
    raise exception 'product required';
  end if;

  v_qty := coalesce(p_quantity, 1);
  if v_qty < 1 or v_qty > 99 then
    raise exception 'quantity must be between 1 and 99';
  end if;
  v_qty := round(v_qty);

  select * into v_list
  from public.shopping_lists
  where share_token = trim(p_token);

  if not found then
    raise exception 'shared list not found';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id;

  if not found then
    raise exception 'product not found';
  end if;

  select count(*) into v_count
  from public.list_items
  where list_id = v_list.id;

  select * into v_existing
  from public.list_items
  where list_id = v_list.id
    and product_id = p_product_id
  limit 1;

  if found then
    update public.list_items
    set quantity = least(99, quantity + v_qty)
    where id = v_existing.id;
  else
    if v_count >= 80 then
      raise exception 'list is full (80 items max)';
    end if;
    insert into public.list_items (list_id, product_id, free_text, quantity, unit)
    values (
      v_list.id,
      v_product.id,
      coalesce(nullif(trim(v_product.name), ''), 'Item'),
      v_qty,
      coalesce(nullif(trim(v_product.unit), ''), 'piece')
    );
  end if;

  update public.shopping_lists
  set updated_at = now()
  where id = v_list.id;

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

grant execute on function public.append_shared_list_item(text, uuid, numeric) to anon, authenticated;
