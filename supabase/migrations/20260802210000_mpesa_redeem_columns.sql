-- M-Pesa B2C tracking on redeem requests
alter table public.redeem_requests
  add column if not exists mpesa_conversation_id text,
  add column if not exists mpesa_originator_conversation_id text,
  add column if not exists failure_reason text;

create index if not exists redeem_requests_pending_idx
  on public.redeem_requests (status, created_at)
  where status = 'pending';
