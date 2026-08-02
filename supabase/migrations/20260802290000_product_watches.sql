-- Watchlist / price drop alerts (in-app first; push later)
create table if not exists public.product_watches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  baseline_cents integer,
  created_at timestamptz not null default now(),
  unique (profile_id, product_id)
);

create index if not exists product_watches_profile_idx
  on public.product_watches (profile_id, created_at desc);

comment on table public.product_watches is
  'User wishlist for staples; drop when cheapest < baseline_cents';
comment on column public.product_watches.baseline_cents is
  'Cheapest merchant price (cents) when the user started watching';

alter table public.product_watches enable row level security;

drop policy if exists "watches_owner_all" on public.product_watches;
create policy "watches_owner_all" on public.product_watches
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

grant select, insert, update, delete on public.product_watches to authenticated;
