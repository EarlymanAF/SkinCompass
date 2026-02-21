do $$
begin
  if to_regclass('public.user_profiles') is not null
     and to_regclass('public.steam_profiles') is null then
    alter table public.user_profiles rename to steam_profiles;
  end if;
end $$;

do $$
begin
  if to_regclass('public.user_profiles_last_login_at_idx') is not null
     and to_regclass('public.steam_profiles_last_login_at_idx') is null then
    alter index public.user_profiles_last_login_at_idx rename to steam_profiles_last_login_at_idx;
  end if;
end $$;

create or replace function public.set_steam_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.steam_profiles;
drop trigger if exists steam_profiles_set_updated_at on public.steam_profiles;

create trigger steam_profiles_set_updated_at
before update on public.steam_profiles
for each row
execute function public.set_steam_profiles_updated_at();

create index if not exists steam_profiles_last_login_at_idx
  on public.steam_profiles (last_login_at desc);
