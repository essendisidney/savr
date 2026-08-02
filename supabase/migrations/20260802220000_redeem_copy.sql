-- User-facing redeem ledger copy (no beta / coming-soon wording)
create or replace function public.request_redeem(
  p_amount_cents integer,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_balance integer;
  v_request_id uuid;
  v_phone text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_amount_cents is null or p_amount_cents < 5000 then
    raise exception 'minimum redeem is KES 50';
  end if;

  select id, cashback_cents into v_account_id, v_balance
  from public.wallet_accounts
  where profile_id = auth.uid()
  for update;

  if v_account_id is null then
    raise exception 'no wallet balance';
  end if;
  if v_balance < p_amount_cents then
    raise exception 'insufficient cashback balance';
  end if;

  v_phone := nullif(trim(coalesce(p_phone, '')), '');
  if v_phone is null then
    select phone into v_phone from public.profiles where id = auth.uid();
  end if;

  update public.wallet_accounts
  set cashback_cents = cashback_cents - p_amount_cents,
      updated_at = now()
  where id = v_account_id;

  insert into public.redeem_requests (profile_id, amount_cents, phone, status)
  values (auth.uid(), p_amount_cents, v_phone, 'pending')
  returning id into v_request_id;

  insert into public.wallet_ledger (
    account_id, amount_cents, entry_type, reference_type, reference_id, note
  ) values (
    v_account_id,
    -p_amount_cents,
    'redeem',
    'redeem_request',
    v_request_id,
    'Redeem to M-Pesa'
  );

  return v_request_id;
end;
$$;
