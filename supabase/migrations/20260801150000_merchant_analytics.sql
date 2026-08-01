-- Privacy-safe merchant analytics aggregates (no shopper PII)
create or replace function public.merchant_analytics(p_merchant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_impressions integer := 0;
  v_recommended integer := 0;
  v_chosen integer := 0;
  v_list_inclusions integer := 0;
  v_avg_basket_cents numeric := 0;
  v_top jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not public.is_merchant_member(p_merchant_id) then
    raise exception 'not a merchant member';
  end if;

  select
    count(*)::integer,
    count(*) filter (where is_recommended)::integer,
    coalesce(avg(total_cents), 0)
  into v_impressions, v_recommended, v_avg_basket_cents
  from public.basket_compare_results
  where merchant_id = p_merchant_id;

  select count(*)::integer
  into v_chosen
  from public.basket_compares
  where chosen_merchant_id = p_merchant_id;

  select count(*)::integer
  into v_list_inclusions
  from public.list_items li
  where li.product_id in (
    select mp.product_id
    from public.merchant_prices mp
    where mp.merchant_id = p_merchant_id
  );

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  into v_top
  from (
    select
      p.name as product_name,
      p.brand,
      count(*)::integer as inclusions
    from public.list_items li
    join public.products p on p.id = li.product_id
    where li.product_id in (
      select mp.product_id
      from public.merchant_prices mp
      where mp.merchant_id = p_merchant_id
    )
    group by p.id, p.name, p.brand
    order by count(*) desc
    limit 5
  ) t;

  return jsonb_build_object(
    'impressions', v_impressions,
    'recommended', v_recommended,
    'chosen', v_chosen,
    'list_inclusions', v_list_inclusions,
    'avg_basket_cents', round(v_avg_basket_cents)::integer,
    'win_rate', case when v_impressions = 0 then 0
      else round((v_chosen::numeric / v_impressions::numeric) * 100)::integer end,
    'top_products', v_top
  );
end;
$$;

grant execute on function public.merchant_analytics(uuid) to authenticated;
