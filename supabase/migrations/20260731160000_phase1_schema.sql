-- Savr Phase 1 schema
-- Currency: integer cents (KES * 100)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  city text not null default 'Nairobi',
  role text not null default 'consumer' check (role in ('consumer', 'merchant_admin')),
  preferred_merchant_ids uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.phone)
  );
  insert into public.wallet_accounts (profile_id) values (new.id);
  return new;
end;
$$;

-- wallet_accounts created below; recreate trigger after both tables exist

-- ---------------------------------------------------------------------------
-- Merchants
-- ---------------------------------------------------------------------------
create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in (
    'grocery', 'fuel', 'ride_partner', 'pharmacy', 'restaurant', 'other'
  )),
  logo_url text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.merchant_locations (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  city text not null default 'Nairobi',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index merchant_locations_merchant_id_idx on public.merchant_locations (merchant_id);
create index merchant_locations_geo_idx on public.merchant_locations (lat, lng);

create table public.merchant_members (
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (merchant_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text not null default 'staples',
  unit text not null default 'piece',
  barcode text unique,
  created_at timestamptz not null default now()
);

create index products_name_idx on public.products using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(brand, '')));

create table public.merchant_prices (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  location_id uuid references public.merchant_locations (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'KES',
  in_stock boolean not null default true,
  observed_at timestamptz not null default now(),
  source text not null default 'merchant' check (source in ('merchant', 'receipt', 'crowdsource', 'scrape', 'seed')),
  unique (merchant_id, location_id, product_id)
);

create index merchant_prices_product_idx on public.merchant_prices (product_id);
create index merchant_prices_merchant_idx on public.merchant_prices (merchant_id);

-- ---------------------------------------------------------------------------
-- Shopping lists
-- ---------------------------------------------------------------------------
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'My list',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shopping_lists_owner_idx on public.shopping_lists (owner_id);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  free_text text not null,
  quantity numeric not null default 1 check (quantity > 0),
  unit text not null default 'piece',
  created_at timestamptz not null default now()
);

create index list_items_list_idx on public.list_items (list_id);

-- ---------------------------------------------------------------------------
-- Basket compares
-- ---------------------------------------------------------------------------
create table public.basket_compares (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  city text not null default 'Nairobi',
  recommended_merchant_id uuid references public.merchants (id),
  chosen_merchant_id uuid references public.merchants (id),
  baseline_total_cents integer,
  savings_cents integer not null default 0,
  cashback_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.basket_compare_results (
  id uuid primary key default gen_random_uuid(),
  compare_id uuid not null references public.basket_compares (id) on delete cascade,
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  total_cents integer not null,
  coverage_ratio numeric not null default 0,
  cashback_cents integer not null default 0,
  distance_km numeric,
  is_recommended boolean not null default false,
  unique (compare_id, merchant_id)
);

-- ---------------------------------------------------------------------------
-- Rides & fuel
-- ---------------------------------------------------------------------------
create table public.ride_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pickup_label text,
  dest_label text not null,
  pickup_lat double precision,
  pickup_lng double precision,
  dest_lat double precision,
  dest_lng double precision,
  results jsonb not null default '[]'::jsonb,
  recommended_partner text,
  created_at timestamptz not null default now()
);

create table public.fuel_stations (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references public.merchants (id) on delete set null,
  name text not null,
  brand text,
  address text,
  lat double precision not null,
  lng double precision not null,
  city text not null default 'Nairobi',
  is_active boolean not null default true
);

create table public.fuel_prices (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.fuel_stations (id) on delete cascade,
  fuel_type text not null default 'petrol' check (fuel_type in ('petrol', 'diesel', 'kerosene')),
  price_cents_per_litre integer not null check (price_cents_per_litre >= 0),
  observed_at timestamptz not null default now(),
  source text not null default 'seed'
);

create index fuel_prices_station_idx on public.fuel_prices (station_id, observed_at desc);

-- ---------------------------------------------------------------------------
-- Promotions & cashback rules
-- ---------------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  title text not null,
  description text,
  discount_percent numeric check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100)),
  product_id uuid references public.products (id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true
);

create table public.cashback_rules (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  title text not null,
  percent numeric check (percent is null or (percent >= 0 and percent <= 100)),
  flat_cents integer check (flat_cents is null or flat_cents >= 0),
  category text,
  product_id uuid references public.products (id) on delete cascade,
  min_basket_cents integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Wallet
-- ---------------------------------------------------------------------------
create table public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  cashback_cents integer not null default 0 check (cashback_cents >= 0),
  updated_at timestamptz not null default now()
);

create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.wallet_accounts (id) on delete cascade,
  amount_cents integer not null,
  entry_type text not null check (entry_type in ('cashback_earn', 'redeem', 'adjust')),
  reference_type text,
  reference_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index wallet_ledger_account_idx on public.wallet_ledger (account_id, created_at desc);

-- Fix signup trigger now that wallet_accounts exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger shopping_lists_updated_at
  before update on public.shopping_lists
  for each row execute function public.set_updated_at();

create or replace function public.is_merchant_member(m_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.merchant_members mm
    where mm.merchant_id = m_id and mm.profile_id = auth.uid()
  );
$$;

create or replace function public.credit_cashback(
  p_profile_id uuid,
  p_amount_cents integer,
  p_reference_type text,
  p_reference_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
begin
  if p_amount_cents <= 0 then
    raise exception 'amount must be positive';
  end if;
  if auth.uid() is distinct from p_profile_id then
    raise exception 'not allowed';
  end if;

  select id into v_account_id from public.wallet_accounts where profile_id = p_profile_id for update;
  if v_account_id is null then
    insert into public.wallet_accounts (profile_id) values (p_profile_id) returning id into v_account_id;
  end if;

  update public.wallet_accounts
    set cashback_cents = cashback_cents + p_amount_cents, updated_at = now()
    where id = v_account_id;

  insert into public.wallet_ledger (account_id, amount_cents, entry_type, reference_type, reference_id, note)
  values (v_account_id, p_amount_cents, 'cashback_earn', p_reference_type, p_reference_id, p_note);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.merchants enable row level security;
alter table public.merchant_locations enable row level security;
alter table public.merchant_members enable row level security;
alter table public.products enable row level security;
alter table public.merchant_prices enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.list_items enable row level security;
alter table public.basket_compares enable row level security;
alter table public.basket_compare_results enable row level security;
alter table public.ride_quotes enable row level security;
alter table public.fuel_stations enable row level security;
alter table public.fuel_prices enable row level security;
alter table public.promotions enable row level security;
alter table public.cashback_rules enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_ledger enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Public read catalogs
create policy "merchants_public_read" on public.merchants for select using (true);
create policy "locations_public_read" on public.merchant_locations for select using (true);
create policy "products_public_read" on public.products for select using (true);
create policy "prices_public_read" on public.merchant_prices for select using (true);
create policy "promotions_public_read" on public.promotions for select using (is_active);
create policy "cashback_rules_public_read" on public.cashback_rules for select using (is_active);
create policy "fuel_stations_public_read" on public.fuel_stations for select using (is_active);
create policy "fuel_prices_public_read" on public.fuel_prices for select using (true);

-- Merchant writes
create policy "merchants_member_update" on public.merchants for update using (public.is_merchant_member(id));
create policy "locations_member_all" on public.merchant_locations for all using (public.is_merchant_member(merchant_id));
create policy "prices_member_all" on public.merchant_prices for all using (public.is_merchant_member(merchant_id));
create policy "promotions_member_all" on public.promotions for all using (public.is_merchant_member(merchant_id));
create policy "cashback_member_all" on public.cashback_rules for all using (public.is_merchant_member(merchant_id));
create policy "merchant_members_select" on public.merchant_members for select using (profile_id = auth.uid() or public.is_merchant_member(merchant_id));

-- Lists
create policy "lists_owner_all" on public.shopping_lists for all using (owner_id = auth.uid());
create policy "list_items_owner_all" on public.list_items for all using (
  exists (select 1 from public.shopping_lists sl where sl.id = list_id and sl.owner_id = auth.uid())
);

-- Compares
create policy "compares_owner_all" on public.basket_compares for all using (user_id = auth.uid());
create policy "compare_results_owner" on public.basket_compare_results for all using (
  exists (select 1 from public.basket_compares bc where bc.id = compare_id and bc.user_id = auth.uid())
);

create policy "rides_owner_all" on public.ride_quotes for all using (user_id = auth.uid());

-- Wallet read-only from client
create policy "wallet_select_own" on public.wallet_accounts for select using (profile_id = auth.uid());
create policy "ledger_select_own" on public.wallet_ledger for select using (
  exists (select 1 from public.wallet_accounts wa where wa.id = account_id and wa.profile_id = auth.uid())
);

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on public.shopping_lists, public.list_items, public.basket_compares, public.basket_compare_results, public.ride_quotes, public.profiles to authenticated;
grant insert, update, delete on public.merchant_locations, public.merchant_prices, public.promotions, public.cashback_rules, public.merchants to authenticated;
grant execute on function public.credit_cashback to authenticated;
grant execute on function public.is_merchant_member to authenticated, anon;
