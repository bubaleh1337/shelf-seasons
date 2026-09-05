create extension if not exists pgcrypto with schema extensions;

create type public.app_locale as enum ('en', 'ru');
create type public.theme_mode as enum ('system', 'light', 'dark');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale public.app_locale not null default 'en',
  timezone text not null default 'UTC',
  theme public.theme_mode not null default 'system',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 80
  ),
  constraint profiles_timezone_length check (char_length(timezone) between 1 and 64)
);

create table public.reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  year smallint not null,
  target_books smallint not null,
  include_rereads boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_goals_year_range check (year between 2000 and 2200),
  constraint reading_goals_target_range check (target_books between 1 and 999),
  constraint reading_goals_user_year_unique unique (user_id, year)
);

create index reading_goals_user_year_idx
  on public.reading_goals (user_id, year desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger reading_goals_set_updated_at
before update on public.reading_goals
for each row execute function public.set_updated_at();

revoke all on function public.set_updated_at() from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

insert into public.profiles (user_id, display_name, avatar_url)
select
  id,
  nullif(left(trim(coalesce(raw_user_meta_data ->> 'full_name', '')), 80), ''),
  nullif(trim(coalesce(raw_user_meta_data ->> 'avatar_url', '')), '')
from auth.users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.reading_goals enable row level security;

create policy profiles_select_own
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy reading_goals_select_own
on public.reading_goals for select
to authenticated
using ((select auth.uid()) = user_id);

create policy reading_goals_insert_own
on public.reading_goals for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy reading_goals_update_own
on public.reading_goals for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy reading_goals_delete_own
on public.reading_goals for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.profiles from anon;
revoke all on table public.reading_goals from anon;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.reading_goals to authenticated;

create or replace function public.complete_onboarding(
  p_locale public.app_locale,
  p_timezone text,
  p_theme public.theme_mode,
  p_yearly_goal smallint default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'invalid_timezone' using errcode = '22023';
  end if;

  if p_yearly_goal is not null and (p_yearly_goal < 1 or p_yearly_goal > 999) then
    raise exception 'invalid_yearly_goal' using errcode = '22023';
  end if;

  insert into public.profiles (
    user_id, locale, timezone, theme, onboarding_completed_at
  ) values (
    current_user_id, p_locale, p_timezone, p_theme, now()
  )
  on conflict (user_id) do update set
    locale = excluded.locale,
    timezone = excluded.timezone,
    theme = excluded.theme,
    onboarding_completed_at = coalesce(
      public.profiles.onboarding_completed_at,
      excluded.onboarding_completed_at
    );

  if p_yearly_goal is not null then
    insert into public.reading_goals (user_id, year, target_books)
    values (
      current_user_id,
      extract(year from timezone(p_timezone, now()))::smallint,
      p_yearly_goal
    )
    on conflict (user_id, year) do update set
      target_books = excluded.target_books;
  end if;
end;
$$;

revoke all on function public.complete_onboarding(
  public.app_locale, text, public.theme_mode, smallint
) from public, anon;
grant execute on function public.complete_onboarding(
  public.app_locale, text, public.theme_mode, smallint
) to authenticated;
