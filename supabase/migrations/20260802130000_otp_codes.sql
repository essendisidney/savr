-- Phone OTP codes for Taifa Mobile SMS auth (Creda-style)

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists otp_codes_phone_created_idx
  on public.otp_codes (phone, created_at desc);

create index if not exists otp_codes_lookup_idx
  on public.otp_codes (phone, code, used, expires_at);

alter table public.otp_codes enable row level security;

-- No public policies: only service role (API routes) touches this table.
