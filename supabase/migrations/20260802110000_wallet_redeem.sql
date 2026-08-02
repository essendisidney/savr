-- Cashback redeem requests (pending until M-Pesa payouts)
create table if not exists public.redeem_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  phone text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists redeem_requests_profile_idx
  on public.redeem_requests (profile_id, created_at desc);

alter table public.redeem_requests enable row level security;

create policy "redeem_select_own" on public.redeem_requests
  for select using (profile_id = auth.uid());

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
    'Redeem pending · M-Pesa payout coming soon'
  );

  return v_request_id;
end;
$$;

grant select on public.redeem_requests to authenticated;
grant execute on function public.request_redeem(integer, text) to authenticated;
