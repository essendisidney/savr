-- Manual shop receipts (honesty loop — no OCR). Shopper logs where they paid.

create table public.shop_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  location_id uuid references public.merchant_locations (id) on delete set null,
  paid_total_cents integer not null check (paid_total_cents >= 0),
  smart_total_cents integer not null check (smart_total_cents >= 0),
  missed_cents integer not null default 0 check (missed_cents >= 0),
  already_optimal boolean not null default false,
  paid_merchant_name text,
  best_merchant_name text,
  created_at timestamptz not null default now()
);

create table public.shop_receipt_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.shop_receipts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  paid_unit_cents integer check (paid_unit_cents is null or paid_unit_cents >= 0),
  unique (receipt_id, product_id)
);

create index shop_receipts_user_created_idx
  on public.shop_receipts (user_id, created_at desc);

create index shop_receipt_lines_receipt_idx
  on public.shop_receipt_lines (receipt_id);

alter table public.shop_receipts enable row level security;
alter table public.shop_receipt_lines enable row level security;

create policy "receipts_owner_all" on public.shop_receipts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "receipt_lines_owner_all" on public.shop_receipt_lines
  for all using (
    exists (
      select 1 from public.shop_receipts r
      where r.id = receipt_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shop_receipts r
      where r.id = receipt_id and r.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.shop_receipts to authenticated;
grant select, insert, update, delete on public.shop_receipt_lines to authenticated;
