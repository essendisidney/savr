-- Live cheapest-price board (online crawl persist) + drop watches
create table if not exists public.market_listings (
  id uuid primary key default gen_random_uuid(),
  shop_id text not null,
  shop text not null,
  country text not null default 'ke',
  name text not null,
  brand text,
  url text not null unique,
  price_cents integer not null check (price_cents > 0),
  currency text not null default 'KES',
  observed_at timestamptz not null default now(),
  prev_price_cents integer,
  query_seed text
);

create index if not exists market_listings_country_price_idx
  on public.market_listings (country, price_cents);
create index if not exists market_listings_observed_idx
  on public.market_listings (observed_at desc);
create index if not exists market_listings_name_ilike_idx
  on public.market_listings (lower(name));

alter table public.market_listings enable row level security;

drop policy if exists "market_listings_public_read" on public.market_listings;
create policy "market_listings_public_read" on public.market_listings
  for select using (true);

grant select on public.market_listings to anon, authenticated;

create table if not exists public.market_watches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  listing_url text not null,
  listing_name text not null,
  shop text,
  baseline_cents integer not null,
  created_at timestamptz not null default now(),
  unique (profile_id, listing_url)
);

create index if not exists market_watches_profile_idx
  on public.market_watches (profile_id, created_at desc);

alter table public.market_watches enable row level security;

drop policy if exists "market_watches_owner_all" on public.market_watches;
create policy "market_watches_owner_all" on public.market_watches
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

grant select, insert, update, delete on public.market_watches to authenticated;
