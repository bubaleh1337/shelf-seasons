do $$
begin
  create type public.series_status as enum ('planned', 'in_progress', 'completed', 'abandoned');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  creator text,
  description text,
  status public.series_status not null default 'planned',
  cover_book_id uuid references public.library_books(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint series_name_length check (char_length(btrim(name)) between 1 and 160),
  constraint series_creator_length check (creator is null or char_length(creator) <= 160),
  constraint series_description_length check (description is null or char_length(description) <= 2000),
  constraint series_id_user_unique unique (id, user_id)
);

create index if not exists series_user_updated_idx on public.series (user_id, updated_at desc);

create table if not exists public.series_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  series_id uuid not null,
  book_id uuid,
  placeholder_title text,
  sort_order numeric(12, 4) not null,
  position_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint series_entries_series_owner_fkey foreign key (series_id, user_id)
    references public.series(id, user_id) on delete cascade,
  constraint series_entries_book_owner_fkey foreign key (book_id, user_id)
    references public.library_books(id, user_id) on delete cascade,
  constraint series_entries_one_source check (
    (book_id is not null and placeholder_title is null)
    or (book_id is null and placeholder_title is not null)
  ),
  constraint series_entries_placeholder_length check (
    placeholder_title is null or char_length(btrim(placeholder_title)) between 1 and 300
  ),
  constraint series_entries_position_length check (char_length(btrim(position_label)) between 1 and 40),
  constraint series_entries_order_unique unique (series_id, sort_order),
  constraint series_entries_book_unique unique (series_id, book_id)
);

create index if not exists series_entries_series_order_idx on public.series_entries (series_id, sort_order);

drop trigger if exists series_set_updated_at on public.series;
create trigger series_set_updated_at before update on public.series
for each row execute function public.set_updated_at();

drop trigger if exists series_entries_set_updated_at on public.series_entries;
create trigger series_entries_set_updated_at before update on public.series_entries
for each row execute function public.set_updated_at();

alter table public.series enable row level security;
alter table public.series_entries enable row level security;
revoke all on table public.series, public.series_entries from anon;
grant select, insert, update, delete on table public.series, public.series_entries to authenticated;

drop policy if exists "Users can read own series" on public.series;
create policy "Users can read own series" on public.series for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own series" on public.series;
create policy "Users can insert own series" on public.series for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (cover_book_id is null or exists (
    select 1 from public.library_books b
    where b.id = cover_book_id and b.user_id = (select auth.uid())
  ))
);
drop policy if exists "Users can update own series" on public.series;
create policy "Users can update own series" on public.series for update to authenticated
using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and (cover_book_id is null or exists (
    select 1 from public.library_books b
    where b.id = cover_book_id and b.user_id = (select auth.uid())
  ))
);
drop policy if exists "Users can delete own series" on public.series;
create policy "Users can delete own series" on public.series for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own series entries" on public.series_entries;
create policy "Users can read own series entries" on public.series_entries for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own series entries" on public.series_entries;
create policy "Users can insert own series entries" on public.series_entries for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own series entries" on public.series_entries;
create policy "Users can update own series entries" on public.series_entries for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own series entries" on public.series_entries;
create policy "Users can delete own series entries" on public.series_entries for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.reorder_series_entries(p_series_id uuid, p_entry_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  expected_count integer;
  supplied_count integer;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.series s where s.id = p_series_id and s.user_id = current_user_id
  ) then
    raise exception 'series_not_found' using errcode = 'P0002';
  end if;

  select count(*) into expected_count from public.series_entries e
  where e.series_id = p_series_id and e.user_id = current_user_id;
  select count(distinct supplied.id) into supplied_count from unnest(p_entry_ids) as supplied(id);

  if supplied_count <> expected_count or cardinality(p_entry_ids) <> expected_count then
    raise exception 'invalid_series_order' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(p_entry_ids) as supplied(id)
    where not exists (
      select 1 from public.series_entries e
      where e.id = supplied.id and e.series_id = p_series_id and e.user_id = current_user_id
    )
  ) then
    raise exception 'foreign_series_entry' using errcode = '42501';
  end if;

  update public.series_entries e
  set sort_order = -ordered.position
  from unnest(p_entry_ids) with ordinality as ordered(id, position)
  where e.id = ordered.id and e.series_id = p_series_id and e.user_id = current_user_id;

  update public.series_entries e
  set sort_order = ordered.position * 1000
  from unnest(p_entry_ids) with ordinality as ordered(id, position)
  where e.id = ordered.id and e.series_id = p_series_id and e.user_id = current_user_id;

  update public.series set updated_at = now()
  where id = p_series_id and user_id = current_user_id;
end;
$$;

revoke all on function public.reorder_series_entries(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_series_entries(uuid, uuid[]) to authenticated;
