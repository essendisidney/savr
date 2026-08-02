-- Invite-code gate for Nairobi soft-close beta

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  max_uses integer not null default 100 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.invite_codes (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  redeemed_at timestamptz not null default now()
);

create index if not exists invite_redemptions_code_idx on public.invite_redemptions (code_id);
create index if not exists invite_redemptions_profile_idx on public.invite_redemptions (profile_id);

alter table public.invite_codes enable row level security;
alter table public.invite_redemptions enable row level security;

-- Public cannot read codes; redeem goes through service role / RPC
create policy "invite_codes_no_public" on public.invite_codes for select using (false);
create policy "invite_redemptions_own" on public.invite_redemptions
  for select using (profile_id = auth.uid());

insert into public.invite_codes (code, max_uses, is_active) values
  ('NAIROBI', 500, true),
  ('SAVRBETA', 500, true),
  ('WESTLANDS', 200, true)
on conflict (code) do nothing;

create or replace function public.redeem_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.invite_codes%rowtype;
  v_norm text;
begin
  v_norm := upper(trim(coalesce(p_code, '')));
  if v_norm = '' then
    return jsonb_build_object('ok', false, 'error', 'Enter an invite code');
  end if;

  select * into v_row
  from public.invite_codes
  where code = v_norm
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid invite code');
  end if;
  if not v_row.is_active then
    return jsonb_build_object('ok', false, 'error', 'This invite code is inactive');
  end if;
  if v_row.uses >= v_row.max_uses then
    return jsonb_build_object('ok', false, 'error', 'This invite code is fully used');
  end if;

  update public.invite_codes
  set uses = uses + 1
  where id = v_row.id;

  insert into public.invite_redemptions (code_id, profile_id)
  values (v_row.id, auth.uid());

  return jsonb_build_object('ok', true, 'code', v_row.code);
end;
$$;

grant execute on function public.redeem_invite_code(text) to anon, authenticated;
