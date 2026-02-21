create table if not exists public.steam_profiles (
  steam_id text primary key,
  display_name text,
  avatar_url text,
  last_login_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_steam_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists steam_profiles_set_updated_at on public.steam_profiles;

create trigger steam_profiles_set_updated_at
before update on public.steam_profiles
for each row
execute function public.set_steam_profiles_updated_at();

create index if not exists steam_profiles_last_login_at_idx
  on public.steam_profiles (last_login_at desc);
