-- Durable intent / product event stream (privacy-safe props only; no PII).

create table public.savr_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint savr_events_name_len check (char_length(name) between 2 and 64)
);

create index savr_events_user_created_idx
  on public.savr_events (user_id, created_at desc);

create index savr_events_name_created_idx
  on public.savr_events (name, created_at desc);

comment on table public.savr_events is
  'Signed-in product events for habit analytics and later API/AI — props must stay non-PII';

alter table public.savr_events enable row level security;

create policy "savr_events_owner_select" on public.savr_events
  for select using (user_id = auth.uid());

create policy "savr_events_owner_insert" on public.savr_events
  for insert with check (user_id = auth.uid());

grant select, insert on public.savr_events to authenticated;

-- Optional merchant aggregate later; consumers own their rows.
create or replace function public.record_savr_event(
  p_name text,
  p_props jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;
  if p_name is null or char_length(trim(p_name)) < 2 then
    raise exception 'Invalid event name';
  end if;

  insert into public.savr_events (user_id, name, props)
  values (auth.uid(), lower(trim(p_name)), coalesce(p_props, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.record_savr_event(text, jsonb) to authenticated;
