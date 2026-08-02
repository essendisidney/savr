-- In-app alert inbox: track which watch drops the user has already seen.

alter table public.product_watches
  add column if not exists seen_drop_cents integer not null default 0;

comment on column public.product_watches.seen_drop_cents is
  'Last drop amount (cents) the user acknowledged in the alert inbox';
