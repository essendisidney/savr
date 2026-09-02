-- Savr marketplace: C2C listings, escrow deals, ratings, seller verification

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 120),
  price_cents integer not null check (price_cents >= 100),
  status text not null default 'live' check (status in ('draft', 'live', 'reserved', 'sold', 'removed')),
  city text not null default 'Nairobi',
  boosted_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_status_created_idx on public.listings (status, created_at desc);
create index if not exists listings_seller_idx on public.listings (seller_id);

do $$
begin
  create extension if not exists pg_trgm;
  create index if not exists listings_title_trgm_idx on public.listings using gin (title gin_trgm_ops);
exception when others then
  null;
end $$;

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_images_listing_idx on public.listing_images (listing_id, sort_order);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete restrict,
  buyer_id uuid not null references public.profiles (id) on delete restrict,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  price_cents integer not null check (price_cents >= 100),
  fee_cents integer not null default 0 check (fee_cents >= 0),
  status text not null default 'pending_pay' check (
    status in ('pending_pay', 'in_escrow', 'released', 'refunded', 'cancelled')
  ),
  buyer_phone text,
  seller_phone text,
  stk_checkout_id text,
  b2c_conversation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, buyer_id, status)
);

-- Allow multiple cancelled deals; unique only for active paths via partial indexes
alter table public.deals drop constraint if exists deals_listing_id_buyer_id_status_key;

create unique index if not exists deals_one_open_per_listing
  on public.deals (listing_id)
  where status in ('pending_pay', 'in_escrow');

create index if not exists deals_buyer_idx on public.deals (buyer_id, created_at desc);
create index if not exists deals_seller_idx on public.deals (seller_id, created_at desc);

create table if not exists public.escrow_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  status text not null,
  note text,
  mpesa_ref text,
  dry_run boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists escrow_events_deal_idx on public.escrow_events (deal_id, created_at asc);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (deal_id, from_id)
);

create table if not exists public.seller_verifications (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  id_status text not null default 'none' check (id_status in ('none', 'pending', 'verified', 'rejected')),
  id_storage_path text,
  note text,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.deals enable row level security;
alter table public.escrow_events enable row level security;
alter table public.ratings enable row level security;
alter table public.seller_verifications enable row level security;

drop policy if exists listings_public_read on public.listings;
create policy listings_public_read on public.listings
  for select using (
    status = 'live'
    or seller_id = auth.uid()
    or exists (
      select 1 from public.deals d
      where d.listing_id = listings.id
        and (d.buyer_id = auth.uid() or d.seller_id = auth.uid())
    )
  );

drop policy if exists listings_owner_insert on public.listings;
create policy listings_owner_insert on public.listings
  for insert with check (seller_id = auth.uid());

drop policy if exists listings_owner_update on public.listings;
create policy listings_owner_update on public.listings
  for update using (seller_id = auth.uid());

drop policy if exists listing_images_public_read on public.listing_images;
create policy listing_images_public_read on public.listing_images
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (
          l.status = 'live'
          or l.seller_id = auth.uid()
          or exists (
            select 1 from public.deals d
            where d.listing_id = l.id
              and (d.buyer_id = auth.uid() or d.seller_id = auth.uid())
          )
        )
    )
  );

drop policy if exists listing_images_owner_write on public.listing_images;
create policy listing_images_owner_write on public.listing_images
  for all using (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
  )
  with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
  );

drop policy if exists deals_parties_read on public.deals;
create policy deals_parties_read on public.deals
  for select using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists deals_buyer_insert on public.deals;
create policy deals_buyer_insert on public.deals
  for insert with check (buyer_id = auth.uid());

drop policy if exists deals_parties_update on public.deals;
create policy deals_parties_update on public.deals
  for update using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists escrow_parties_read on public.escrow_events;
create policy escrow_parties_read on public.escrow_events
  for select using (
    exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.buyer_id = auth.uid() or d.seller_id = auth.uid())
    )
  );

drop policy if exists escrow_parties_insert on public.escrow_events;
create policy escrow_parties_insert on public.escrow_events
  for insert with check (
    exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.buyer_id = auth.uid() or d.seller_id = auth.uid())
    )
  );

drop policy if exists ratings_public_read on public.ratings;
create policy ratings_public_read on public.ratings for select using (true);

drop policy if exists ratings_party_insert on public.ratings;
create policy ratings_party_insert on public.ratings
  for insert with check (
    from_id = auth.uid()
    and exists (
      select 1 from public.deals d
      where d.id = deal_id
        and d.status = 'released'
        and (d.buyer_id = auth.uid() or d.seller_id = auth.uid())
    )
  );

drop policy if exists verification_read on public.seller_verifications;
create policy verification_read on public.seller_verifications
  for select using (true);

drop policy if exists verification_self_write on public.seller_verifications;
create policy verification_self_write on public.seller_verifications
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Storage bucket (run via dashboard if storage API unavailable)
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do update set public = true;

drop policy if exists listing_photos_public_read on storage.objects;
create policy listing_photos_public_read on storage.objects
  for select using (bucket_id = 'listing-photos');

drop policy if exists listing_photos_auth_upload on storage.objects;
create policy listing_photos_auth_upload on storage.objects
  for insert with check (bucket_id = 'listing-photos' and auth.role() = 'authenticated');

drop policy if exists listing_photos_owner_update on storage.objects;
create policy listing_photos_owner_update on storage.objects
  for update using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists listing_photos_owner_delete on storage.objects;
create policy listing_photos_owner_delete on storage.objects
  for delete using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);
