create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id text,
  user_id text,
  page text,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_events_created_at_idx
  on public.product_events (created_at desc);

create index if not exists product_events_event_name_created_at_idx
  on public.product_events (event_name, created_at desc);

create index if not exists product_events_session_id_created_at_idx
  on public.product_events (session_id, created_at desc);

create index if not exists product_events_user_id_created_at_idx
  on public.product_events (user_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_events_event_name_check'
  ) then
    alter table public.product_events
      add constraint product_events_event_name_check
      check (
        event_name in (
          'compare_opened',
          'compare_weapon_selected',
          'compare_skin_selected',
          'compare_wear_selected',
          'compare_search_submitted',
          'compare_results_shown',
          'compare_no_results',
          'signup_submitted',
          'signup_confirmed'
        )
      );
  end if;
end $$;
